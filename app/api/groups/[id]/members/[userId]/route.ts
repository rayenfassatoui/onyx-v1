import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";

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

// DELETE /api/groups/[id]/members/[userId] - Remove member (admin only, or self-leave)
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; userId: string }> }
) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id: groupId, userId: targetUserId } = await params;

	try {
		const isAdmin = await isGroupAdmin(groupId, session.userId);
		const isSelf = session.userId === targetUserId;

		// Only allow:
		// 1. Admin removing any member
		// 2. Member leaving themselves (but not if they're admin)
		if (!isAdmin && !isSelf) {
			return NextResponse.json(
				{ error: "Only admins can remove members" },
				{ status: 403 }
			);
		}

		// Check if target is admin trying to leave
		const targetMembership = await db.query.groupMembers.findFirst({
			where: and(
				eq(groupMembers.groupId, groupId),
				eq(groupMembers.userId, targetUserId)
			),
		});

		if (!targetMembership) {
			return NextResponse.json(
				{ error: "User is not a member of this group" },
				{ status: 404 }
			);
		}

		// Prevent admin from leaving (they should delete the group or transfer ownership)
		if (isSelf && targetMembership.role === "admin") {
			return NextResponse.json(
				{ error: "Group admin cannot leave. Delete the group or transfer ownership first." },
				{ status: 400 }
			);
		}

		// Remove member
		await db.delete(groupMembers).where(
			and(
				eq(groupMembers.groupId, groupId),
				eq(groupMembers.userId, targetUserId)
			)
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to remove member:", error);
		return NextResponse.json(
			{ error: "Failed to remove member" },
			{ status: 500 }
		);
	}
}
