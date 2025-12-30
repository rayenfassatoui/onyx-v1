import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prompts, promptVersions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

interface RouteParams {
	params: Promise<{ id: string; versionId: string }>;
}

// GET /api/prompts/[id]/versions/[versionId] - Get a specific version
export async function GET(request: NextRequest, { params }: RouteParams) {
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

		// Get specific version
		const version = await db.query.promptVersions.findFirst({
			where: and(
				eq(promptVersions.id, versionId),
				eq(promptVersions.promptId, id)
			),
		});

		if (!version) {
			return NextResponse.json({ error: "Version not found" }, { status: 404 });
		}

		return NextResponse.json({ version });
	} catch (error) {
		console.error("Error fetching version:", error);
		return NextResponse.json(
			{ error: "Failed to fetch version" },
			{ status: 500 }
		);
	}
}
