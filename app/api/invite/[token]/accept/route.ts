import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { groupInvites, groupMembers, notifications } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and, sql } from "drizzle-orm";

// POST /api/invite/[token]/accept - Accept invite and join group
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ token: string }> }
) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { token } = await params;

	try {
		// Find the invite
		const invite = await db.query.groupInvites.findFirst({
			where: eq(groupInvites.token, token),
			with: {
				group: true,
			},
		});

		if (!invite) {
			return NextResponse.json(
				{ error: "Invalid invite link" },
				{ status: 404 }
			);
		}

		// Check if expired
		if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
			return NextResponse.json(
				{ error: "This invite link has expired" },
				{ status: 410 }
			);
		}

		// Check if max uses reached
		if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
			return NextResponse.json(
				{ error: "This invite link has reached its maximum uses" },
				{ status: 410 }
			);
		}

		// Check if already a member
		const existingMembership = await db.query.groupMembers.findFirst({
			where: and(
				eq(groupMembers.groupId, invite.groupId),
				eq(groupMembers.userId, session.userId)
			),
		});

		if (existingMembership) {
			return NextResponse.json({
				success: true,
				message: "You are already a member of this group",
				groupId: invite.groupId,
				alreadyMember: true,
			});
		}

		// Add user to group
		await db.insert(groupMembers).values({
			groupId: invite.groupId,
			userId: session.userId,
			role: "member",
		});

		// Increment uses count
		await db
			.update(groupInvites)
			.set({ uses: sql`${groupInvites.uses} + 1` })
			.where(eq(groupInvites.id, invite.id));

		// Create notification for group admins
		const admins = await db.query.groupMembers.findMany({
			where: and(
				eq(groupMembers.groupId, invite.groupId),
				eq(groupMembers.role, "admin")
			),
		});

		for (const admin of admins) {
			await db.insert(notifications).values({
				userId: admin.userId,
				type: "group_invite",
				title: "New member joined",
				message: `${session.email} joined ${invite.group.name} via invite link`,
				metadata: { groupId: invite.groupId },
			});
		}

		return NextResponse.json({
			success: true,
			message: `You have joined ${invite.group.name}`,
			groupId: invite.groupId,
			groupName: invite.group.name,
		});
	} catch (error) {
		console.error("Failed to accept invite:", error);
		return NextResponse.json(
			{ error: "Failed to join group" },
			{ status: 500 }
		);
	}
}
