import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prompts, promptVersions, promptTags, tags } from "@/db/schema";
import { eq, and, inArray, count } from "drizzle-orm";
import { getSession } from "@/lib/auth";

interface RouteParams {
	params: Promise<{ id: string }>;
}

// GET /api/prompts/[id] - Get a single prompt
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		const prompt = await db.query.prompts.findFirst({
			where: and(eq(prompts.id, id), eq(prompts.vaultId, session.vaultId)),
			with: {
				promptTags: {
					with: {
						tag: true,
					},
				},
				versions: {
					orderBy: (versions, { desc }) => [desc(versions.versionNumber)],
					limit: 1,
				},
			},
		});

		if (!prompt) {
			return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
		}

		// Get version count
		const [versionCount] = await db
			.select({ count: count() })
			.from(promptVersions)
			.where(eq(promptVersions.promptId, id));

		return NextResponse.json({
			prompt: {
				id: prompt.id,
				title: prompt.title,
				description: prompt.description,
				content: prompt.content,
				createdAt: prompt.createdAt,
				updatedAt: prompt.updatedAt,
				versionCount: versionCount.count,
				tags: prompt.promptTags.map((pt) => ({
					id: pt.tag.id,
					name: pt.tag.name,
					color: pt.tag.color,
				})),
			},
		});
	} catch (error) {
		console.error("Error fetching prompt:", error);
		return NextResponse.json(
			{ error: "Failed to fetch prompt" },
			{ status: 500 }
		);
	}
}

// PATCH /api/prompts/[id] - Update a prompt
export async function PATCH(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const body = await request.json();
		const { title, description, content, tagIds } = body;

		// Check prompt exists and belongs to user's vault
		const existingPrompt = await db.query.prompts.findFirst({
			where: and(eq(prompts.id, id), eq(prompts.vaultId, session.vaultId)),
		});

		if (!existingPrompt) {
			return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
		}

		// Validate title if provided
		if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
			return NextResponse.json(
				{ error: "Title cannot be empty" },
				{ status: 400 }
			);
		}

		// Update prompt and create new version
		// Get current version number
		const [latestVersion] = await db
			.select({ versionNumber: promptVersions.versionNumber })
			.from(promptVersions)
			.where(eq(promptVersions.promptId, id))
			.orderBy((pv) => pv.versionNumber)
			.limit(1);

		const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

		// Create version snapshot of current state BEFORE update
		await db.insert(promptVersions).values({
			promptId: id,
			title: existingPrompt.title,
			description: existingPrompt.description,
			content: existingPrompt.content,
			versionNumber: newVersionNumber,
		});

		// Update prompt
		const updateData: Partial<typeof prompts.$inferInsert> = {
			updatedAt: new Date(),
		};

		if (title !== undefined) updateData.title = title.trim();
		if (description !== undefined) updateData.description = description.trim();
		if (content !== undefined) updateData.content = content;

		const [updatedPrompt] = await db
			.update(prompts)
			.set(updateData)
			.where(eq(prompts.id, id))
			.returning();

		// Update tags if provided
		if (tagIds !== undefined) {
			// Remove existing tag associations
			await db.delete(promptTags).where(eq(promptTags.promptId, id));

			// Add new tag associations
			if (tagIds.length > 0) {
				const validTags = await db.query.tags.findMany({
					where: and(
						eq(tags.vaultId, session.vaultId),
						inArray(tags.id, tagIds)
					),
				});

				if (validTags.length > 0) {
					await db.insert(promptTags).values(
						validTags.map((tag) => ({
							promptId: id,
							tagId: tag.id,
						}))
					);
				}
			}
		}

		return NextResponse.json({ prompt: updatedPrompt });
	} catch (error) {
		console.error("Error updating prompt:", error);
		return NextResponse.json(
			{ error: "Failed to update prompt" },
			{ status: 500 }
		);
	}
}

// DELETE /api/prompts/[id] - Delete a prompt
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		// Check prompt exists and belongs to user's vault
		const existingPrompt = await db.query.prompts.findFirst({
			where: and(eq(prompts.id, id), eq(prompts.vaultId, session.vaultId)),
		});

		if (!existingPrompt) {
			return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
		}

		// Delete prompt (cascade will handle versions and tags)
		await db.delete(prompts).where(eq(prompts.id, id));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting prompt:", error);
		return NextResponse.json(
			{ error: "Failed to delete prompt" },
			{ status: 500 }
		);
	}
}
