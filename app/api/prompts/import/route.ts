import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prompts, tags, promptTags, vaults, promptVersions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

interface ImportPrompt {
	id?: string;
	title: string;
	description?: string;
	content: string;
	tags?: string[];
}

interface ImportData {
	version?: string;
	prompts: ImportPrompt[];
	tags?: Array<{ name: string; color?: string }>;
}

export async function POST(request: NextRequest) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { data, conflictResolution = "skip" } = body as {
			data: ImportData;
			conflictResolution: "overwrite" | "duplicate" | "skip";
		};

		if (!data || !data.prompts || !Array.isArray(data.prompts)) {
			return NextResponse.json(
				{ error: "Invalid import data format" },
				{ status: 400 }
			);
		}

		// Get user's vault
		const [vault] = await db
			.select()
			.from(vaults)
			.where(eq(vaults.userId, session.userId));

		if (!vault) {
			return NextResponse.json({ error: "Vault not found" }, { status: 404 });
		}

		const results = {
			imported: 0,
			skipped: 0,
			overwritten: 0,
			duplicated: 0,
			errors: [] as string[],
		};

		// Get existing tags
		const existingTags = await db
			.select()
			.from(tags)
			.where(eq(tags.vaultId, vault.id));

		const tagMap = new Map(existingTags.map((t) => [t.name.toLowerCase(), t]));

		// Import tags first (if provided)
		if (data.tags && Array.isArray(data.tags)) {
			for (const tagData of data.tags) {
				if (!tagMap.has(tagData.name.toLowerCase())) {
					const [newTag] = await db
						.insert(tags)
						.values({
							vaultId: vault.id,
							name: tagData.name,
							color: tagData.color || "#6366f1",
						})
						.returning();
					tagMap.set(tagData.name.toLowerCase(), newTag);
				}
			}
		}

		// Get existing prompts for conflict detection
		const existingPrompts = await db
			.select()
			.from(prompts)
			.where(eq(prompts.vaultId, vault.id));

		const promptMap = new Map(
			existingPrompts.map((p) => [p.title.toLowerCase(), p])
		);

		// Import prompts
		for (const promptData of data.prompts) {
			try {
				if (!promptData.title || !promptData.content) {
					results.errors.push(
						`Skipped prompt: missing title or content`
					);
					results.skipped++;
					continue;
				}

				const existingPrompt = promptMap.get(promptData.title.toLowerCase());

				if (existingPrompt) {
					// Handle conflict
					switch (conflictResolution) {
						case "skip":
							results.skipped++;
							continue;

						case "overwrite":
							// Create version before overwriting
							const [latestVersion] = await db
								.select()
								.from(promptVersions)
								.where(eq(promptVersions.promptId, existingPrompt.id))
								.orderBy(promptVersions.versionNumber)
								.limit(1);

							const nextVersion = (latestVersion?.versionNumber || 0) + 1;

							await db.insert(promptVersions).values({
								promptId: existingPrompt.id,
								title: existingPrompt.title,
								description: existingPrompt.description || "",
								content: existingPrompt.content,
								versionNumber: nextVersion,
							});

							// Update prompt
							await db
								.update(prompts)
								.set({
									description: promptData.description || null,
									content: promptData.content,
									updatedAt: new Date(),
								})
								.where(eq(prompts.id, existingPrompt.id));

							// Update tags
							await db
								.delete(promptTags)
								.where(eq(promptTags.promptId, existingPrompt.id));

							if (promptData.tags && promptData.tags.length > 0) {
								for (const tagName of promptData.tags) {
									let tag = tagMap.get(tagName.toLowerCase());
									if (!tag) {
										const [newTag] = await db
											.insert(tags)
											.values({
												vaultId: vault.id,
												name: tagName,
												color: "#6366f1",
											})
											.returning();
										tag = newTag;
										tagMap.set(tagName.toLowerCase(), newTag);
									}
									await db.insert(promptTags).values({
										promptId: existingPrompt.id,
										tagId: tag.id,
									});
								}
							}

							results.overwritten++;
							break;

						case "duplicate":
							// Create with modified title
							const duplicateTitle = `${promptData.title} (imported)`;
							const [duplicatedPrompt] = await db
								.insert(prompts)
								.values({
									vaultId: vault.id,
									title: duplicateTitle,
									description: promptData.description || null,
									content: promptData.content,
								})
								.returning();

							// Add tags
							if (promptData.tags && promptData.tags.length > 0) {
								for (const tagName of promptData.tags) {
									let tag = tagMap.get(tagName.toLowerCase());
									if (!tag) {
										const [newTag] = await db
											.insert(tags)
											.values({
												vaultId: vault.id,
												name: tagName,
												color: "#6366f1",
											})
											.returning();
										tag = newTag;
										tagMap.set(tagName.toLowerCase(), newTag);
									}
									await db.insert(promptTags).values({
										promptId: duplicatedPrompt.id,
										tagId: tag.id,
									});
								}
							}

							results.duplicated++;
							break;
					}
				} else {
					// Create new prompt
					const [newPrompt] = await db
						.insert(prompts)
						.values({
							vaultId: vault.id,
							title: promptData.title,
							description: promptData.description || null,
							content: promptData.content,
						})
						.returning();

					// Add tags
					if (promptData.tags && promptData.tags.length > 0) {
						for (const tagName of promptData.tags) {
							let tag = tagMap.get(tagName.toLowerCase());
							if (!tag) {
								const [newTag] = await db
									.insert(tags)
									.values({
										vaultId: vault.id,
										name: tagName,
										color: "#6366f1",
									})
									.returning();
								tag = newTag;
								tagMap.set(tagName.toLowerCase(), newTag);
							}
							await db.insert(promptTags).values({
								promptId: newPrompt.id,
								tagId: tag.id,
							});
						}
					}

					results.imported++;
				}
			} catch (error) {
				console.error("Error importing prompt:", error);
				results.errors.push(
					`Failed to import "${promptData.title}": ${error instanceof Error ? error.message : "Unknown error"}`
				);
			}
		}

		return NextResponse.json({
			success: true,
			results,
		});
	} catch (error) {
		console.error("Import error:", error);
		return NextResponse.json(
			{ error: "Failed to import data" },
			{ status: 500 }
		);
	}
}
