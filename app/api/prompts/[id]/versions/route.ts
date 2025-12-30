import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prompts, promptVersions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

interface RouteParams {
	params: Promise<{ id: string }>;
}

// GET /api/prompts/[id]/versions - List all versions
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		// Verify prompt belongs to user's vault
		const prompt = await db.query.prompts.findFirst({
			where: and(eq(prompts.id, id), eq(prompts.vaultId, session.vaultId)),
		});

		if (!prompt) {
			return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
		}

		// Get all versions
		const versions = await db.query.promptVersions.findMany({
			where: eq(promptVersions.promptId, id),
			orderBy: [desc(promptVersions.versionNumber)],
		});

		return NextResponse.json({ versions });
	} catch (error) {
		console.error("Error fetching versions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch versions" },
			{ status: 500 }
		);
	}
}
