import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sharedPrompts, prompts } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";

// DELETE /api/prompts/[id]/share/[shareId] - Revoke a share
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; shareId: string }> }
) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id: promptId, shareId } = await params;

	try {
		// Verify ownership
		const prompt = await db.query.prompts.findFirst({
			where: eq(prompts.id, promptId),
			with: {
				vault: true,
			},
		});

		if (!prompt) {
			return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
		}

		if (prompt.vault.userId !== session.userId) {
			return NextResponse.json(
				{ error: "You can only revoke shares of your own prompts" },
				{ status: 403 }
			);
		}

		// Verify share exists and belongs to this prompt
		const share = await db.query.sharedPrompts.findFirst({
			where: and(
				eq(sharedPrompts.id, shareId),
				eq(sharedPrompts.promptId, promptId)
			),
		});

		if (!share) {
			return NextResponse.json({ error: "Share not found" }, { status: 404 });
		}

		// Delete the share
		await db.delete(sharedPrompts).where(eq(sharedPrompts.id, shareId));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to revoke share:", error);
		return NextResponse.json(
			{ error: "Failed to revoke share" },
			{ status: 500 }
		);
	}
}
