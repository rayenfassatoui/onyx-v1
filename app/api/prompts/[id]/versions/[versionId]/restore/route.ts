import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prompts, promptVersions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

interface RouteParams {
	params: Promise<{ id: string; versionId: string }>;
}

// POST /api/prompts/[id]/versions/[versionId]/restore - Restore a version
export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id, versionId } = await params;

		// Verify prompt belongs to user's vault
		const prompt = await db.query.prompts.findFirst({
			where: and(eq(prompts.id, id), eq(prompts.vaultId, session.vaultId)),
		});

		if (!prompt) {
			return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
		}

		// Get the version to restore
		const versionToRestore = await db.query.promptVersions.findFirst({
			where: and(
				eq(promptVersions.id, versionId),
				eq(promptVersions.promptId, id)
			),
		});

		if (!versionToRestore) {
			return NextResponse.json({ error: "Version not found" }, { status: 404 });
		}

		// Restore version
		// Get current max version number
		const [latestVersion] = await db
			.select({ versionNumber: promptVersions.versionNumber })
			.from(promptVersions)
			.where(eq(promptVersions.promptId, id))
			.orderBy(desc(promptVersions.versionNumber))
			.limit(1);

		const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

		// Create version snapshot of current state BEFORE restore
		await db.insert(promptVersions).values({
			promptId: id,
			title: prompt.title,
			description: prompt.description,
			content: prompt.content,
			versionNumber: newVersionNumber,
		});

		// Update prompt to restored version content
		const [updatedPrompt] = await db
			.update(prompts)
			.set({
				title: versionToRestore.title,
				description: versionToRestore.description,
				content: versionToRestore.content,
				updatedAt: new Date(),
			})
			.where(eq(prompts.id, id))
			.returning();

		return NextResponse.json({
			success: true,
			prompt: updatedPrompt,
			message: `Restored to version ${versionToRestore.versionNumber}`,
		});
	} catch (error) {
		console.error("Error restoring version:", error);
		return NextResponse.json(
			{ error: "Failed to restore version" },
			{ status: 500 }
		);
	}
}
