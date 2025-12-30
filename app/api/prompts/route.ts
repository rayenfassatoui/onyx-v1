import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prompts, promptVersions, promptTags, tags } from "@/db/schema";
import { eq, and, desc, or, ilike, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// GET /api/prompts - List all prompts
export async function GET(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search") || "";
		const sortBy = searchParams.get("sortBy") || "updatedAt";
		const tagIds = searchParams.getAll("tagId");

		// Build query conditions
		const conditions = [eq(prompts.vaultId, session.vaultId)];

		// Add search filter
		if (search) {
			conditions.push(
				or(
					ilike(prompts.title, `%${search}%`),
					ilike(prompts.content, `%${search}%`),
					ilike(prompts.description, `%${search}%`)
				)!
			);
		}

		// Get prompts with tags
		let promptList = await db.query.prompts.findMany({
			where: and(...conditions),
			orderBy: sortBy === "createdAt" ? desc(prompts.createdAt) : desc(prompts.updatedAt),
			with: {
				promptTags: {
					with: {
						tag: true,
					},
				},
			},
		});

		// Filter by tags if specified
		if (tagIds.length > 0) {
			promptList = promptList.filter((prompt) =>
				prompt.promptTags.some((pt) => tagIds.includes(pt.tagId))
			);
		}

		// Transform response
		const result = promptList.map((prompt) => ({
			id: prompt.id,
			title: prompt.title,
			description: prompt.description,
			content: prompt.content,
			createdAt: prompt.createdAt,
			updatedAt: prompt.updatedAt,
			tags: prompt.promptTags.map((pt) => ({
				id: pt.tag.id,
				name: pt.tag.name,
				color: pt.tag.color,
			})),
		}));

		return NextResponse.json({ prompts: result });
	} catch (error) {
		console.error("Error fetching prompts:", error);
		return NextResponse.json(
			{ error: "Failed to fetch prompts" },
			{ status: 500 }
		);
	}
}

// POST /api/prompts - Create a new prompt
export async function POST(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { title, description = "", content, tagIds = [] } = body;

		// Validate required fields
		if (!title || typeof title !== "string" || title.trim() === "") {
			return NextResponse.json(
				{ error: "Title is required" },
				{ status: 400 }
			);
		}

		if (!content || typeof content !== "string") {
			return NextResponse.json(
				{ error: "Content is required" },
				{ status: 400 }
			);
		}

		// Create prompt and initial version
		// Create prompt
		const [newPrompt] = await db
			.insert(prompts)
			.values({
				vaultId: session.vaultId,
				title: title.trim(),
				description: description.trim(),
				content,
			})
			.returning();

		// Create initial version
		await db.insert(promptVersions).values({
			promptId: newPrompt.id,
			title: newPrompt.title,
			description: newPrompt.description,
			content: newPrompt.content,
			versionNumber: 1,
		});

		// Assign tags if provided
		if (tagIds.length > 0) {
			// Verify tags belong to this vault
			const validTags = await db.query.tags.findMany({
				where: and(
					eq(tags.vaultId, session.vaultId),
					inArray(tags.id, tagIds)
				),
			});

			if (validTags.length > 0) {
				await db.insert(promptTags).values(
					validTags.map((tag) => ({
						promptId: newPrompt.id,
						tagId: tag.id,
					}))
				);
			}
		}

		return NextResponse.json({ prompt: newPrompt }, { status: 201 });
	} catch (error) {
		console.error("Error creating prompt:", error);
		return NextResponse.json(
			{ error: "Failed to create prompt" },
			{ status: 500 }
		);
	}
}
