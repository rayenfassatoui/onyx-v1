import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prompts, tags, promptTags, vaults } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const format = searchParams.get("format") || "json";

	// Get user's vault
	const [vault] = await db
		.select()
		.from(vaults)
		.where(eq(vaults.userId, session.userId));

	if (!vault) {
		return NextResponse.json({ error: "Vault not found" }, { status: 404 });
	}

	// Fetch all prompts with their tags
	const allPrompts = await db
		.select()
		.from(prompts)
		.where(eq(prompts.vaultId, vault.id));

	// Fetch all tags
	const allTags = await db
		.select()
		.from(tags)
		.where(eq(tags.vaultId, vault.id));

	// Fetch prompt-tag relationships
	const promptTagRelations = await db
		.select()
		.from(promptTags)
		.where(
			inArray(
				promptTags.promptId,
				allPrompts.map((p) => p.id)
			)
		);

	// Build export data
	const exportData = {
		version: "1.0",
		exportedAt: new Date().toISOString(),
		vault: {
			name: vault.name,
		},
		tags: allTags.map((t) => ({
			id: t.id,
			name: t.name,
			color: t.color,
		})),
		prompts: allPrompts.map((p) => {
			const promptTagIds = promptTagRelations
				.filter((pt) => pt.promptId === p.id)
				.map((pt) => pt.tagId);
			const promptTagNames = allTags
				.filter((t) => promptTagIds.includes(t.id))
				.map((t) => t.name);

			return {
				id: p.id,
				title: p.title,
				description: p.description,
				content: p.content,
				tags: promptTagNames,
				createdAt: p.createdAt,
				updatedAt: p.updatedAt,
			};
		}),
	};

	if (format === "markdown") {
		// Generate Markdown format
		let markdown = `# Onyx Vault Export\n\n`;
		markdown += `> Exported on ${new Date().toLocaleDateString()}\n\n`;
		markdown += `---\n\n`;

		for (const prompt of exportData.prompts) {
			markdown += `## ${prompt.title}\n\n`;
			if (prompt.description) {
				markdown += `*${prompt.description}*\n\n`;
			}
			if (prompt.tags.length > 0) {
				markdown += `**Tags:** ${prompt.tags.join(", ")}\n\n`;
			}
			markdown += `\`\`\`\n${prompt.content}\n\`\`\`\n\n`;
			markdown += `---\n\n`;
		}

		return new NextResponse(markdown, {
			headers: {
				"Content-Type": "text/markdown",
				"Content-Disposition": `attachment; filename="onyx-vault-${Date.now()}.md"`,
			},
		});
	}

	// JSON format
	return new NextResponse(JSON.stringify(exportData, null, 2), {
		headers: {
			"Content-Type": "application/json",
			"Content-Disposition": `attachment; filename="onyx-vault-${Date.now()}.json"`,
		},
	});
}
