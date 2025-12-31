import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { groups, groupMembers, groupInvites } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

// Helper to check if user is admin of group
async function isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
	const membership = await db.query.groupMembers.findFirst({
		where: and(
			eq(groupMembers.groupId, groupId),
			eq(groupMembers.userId, userId)
		),
	});
	return membership?.role === "admin";
}

// Generate a secure random token
function generateToken(): string {
	return randomBytes(16).toString("hex");
}

// GET /api/groups/[id]/invite - List invites for group
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id: groupId } = await params;

	try {
		// Check if user is admin
		if (!(await isGroupAdmin(groupId, session.userId))) {
			return NextResponse.json(
				{ error: "Only admins can view invites" },
				{ status: 403 }
			);
		}

		const invites = await db.query.groupInvites.findMany({
			where: eq(groupInvites.groupId, groupId),
			orderBy: (invites, { desc }) => [desc(invites.createdAt)],
		});

		return NextResponse.json({ invites });
	} catch (error) {
		console.error("Failed to fetch invites:", error);
		return NextResponse.json(
			{ error: "Failed to fetch invites" },
			{ status: 500 }
		);
	}
}

// POST /api/groups/[id]/invite - Create invite link
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id: groupId } = await params;

	try {
		// Check if user is admin
		if (!(await isGroupAdmin(groupId, session.userId))) {
			return NextResponse.json(
				{ error: "Only admins can create invites" },
				{ status: 403 }
			);
		}

		// Check if group exists
		const group = await db.query.groups.findFirst({
			where: eq(groups.id, groupId),
		});

		if (!group) {
			return NextResponse.json({ error: "Group not found" }, { status: 404 });
		}

		const body = await request.json();
		const { expiresIn, maxUses } = body;

		// Calculate expiration date
		let expiresAt: Date | null = null;
		if (expiresIn) {
			expiresAt = new Date();
			switch (expiresIn) {
				case "1h":
					expiresAt.setHours(expiresAt.getHours() + 1);
					break;
				case "24h":
					expiresAt.setHours(expiresAt.getHours() + 24);
					break;
				case "7d":
					expiresAt.setDate(expiresAt.getDate() + 7);
					break;
				case "30d":
					expiresAt.setDate(expiresAt.getDate() + 30);
					break;
				default:
					expiresAt = null; // never expires
			}
		}

		// Create invite
		const token = generateToken();
		const [invite] = await db
			.insert(groupInvites)
			.values({
				token,
				groupId,
				createdById: session.userId,
				expiresAt,
				maxUses: maxUses || null,
			})
			.returning();

		// Generate the full invite URL
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "";
		const inviteUrl = `${baseUrl}/invite/${token}`;

		return NextResponse.json({
			invite,
			inviteUrl,
		});
	} catch (error) {
		console.error("Failed to create invite:", error);
		return NextResponse.json(
			{ error: "Failed to create invite" },
			{ status: 500 }
		);
	}
}

// DELETE /api/groups/[id]/invite - Delete an invite
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id: groupId } = await params;
	const { searchParams } = new URL(request.url);
	const inviteId = searchParams.get("inviteId");

	if (!inviteId) {
		return NextResponse.json({ error: "Invite ID required" }, { status: 400 });
	}

	try {
		// Check if user is admin
		if (!(await isGroupAdmin(groupId, session.userId))) {
			return NextResponse.json(
				{ error: "Only admins can delete invites" },
				{ status: 403 }
			);
		}

		await db.delete(groupInvites).where(
			and(
				eq(groupInvites.id, inviteId),
				eq(groupInvites.groupId, groupId)
			)
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete invite:", error);
		return NextResponse.json(
			{ error: "Failed to delete invite" },
			{ status: 500 }
		);
	}
}
