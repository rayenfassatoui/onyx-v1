import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { groups, groupMembers, users, notifications } from "@/db/schema";
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

// POST /api/groups/[id]/members - Add member (admin only)
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
		// Check admin permission
		if (!(await isGroupAdmin(groupId, session.userId))) {
			return NextResponse.json(
				{ error: "Only admins can add members" },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { email, userId } = body;

		// Find user by email or userId
		let targetUser;
		if (userId) {
			targetUser = await db.query.users.findFirst({
				where: eq(users.id, userId),
			});
		} else if (email) {
			targetUser = await db.query.users.findFirst({
				where: eq(users.email, email.toLowerCase().trim()),
			});
		} else {
			return NextResponse.json(
				{ error: "Email or userId is required" },
				{ status: 400 }
			);
		}

		if (!targetUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Check if already a member
		const existingMembership = await db.query.groupMembers.findFirst({
			where: and(
				eq(groupMembers.groupId, groupId),
				eq(groupMembers.userId, targetUser.id)
			),
		});

		if (existingMembership) {
			return NextResponse.json(
				{ error: "User is already a member of this group" },
				{ status: 400 }
			);
		}

		// Add member
		await db.insert(groupMembers).values({
			groupId,
			userId: targetUser.id,
			role: "member",
		});

		// Get group name for notification
		const group = await db.query.groups.findFirst({
			where: eq(groups.id, groupId),
		});

		// Create notification for the new member
		await db.insert(notifications).values({
			userId: targetUser.id,
			type: "group_invite",
			title: "Added to Group",
			message: `You have been added to the group "${group?.name}"`,
			metadata: {
				groupId,
				groupName: group?.name,
				addedBy: session.userId,
			},
		});

		return NextResponse.json({
			success: true,
			member: {
				userId: targetUser.id,
				email: targetUser.email,
				role: "member",
			},
		});
	} catch (error) {
		console.error("Failed to add member:", error);
		return NextResponse.json(
			{ error: "Failed to add member" },
			{ status: 500 }
		);
	}
}
