import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sharedPrompts, prompts, vaults, groupMembers, users, groups, notifications } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";

// POST /api/prompts/[id]/share - Share a prompt with user or group
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id: promptId } = await params;

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
				{ error: "You can only share your own prompts" },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { userId, groupId, email } = body;

		// Must provide either userId/email or groupId, not both
		if ((!userId && !email && !groupId) || ((userId || email) && groupId)) {
			return NextResponse.json(
				{ error: "Provide either userId/email OR groupId, not both" },
				{ status: 400 }
			);
		}

		let targetUserId: string | null = null;
		let targetGroupId: string | null = null;
		let notificationTargets: string[] = [];

		if (groupId) {
			// Share with group - verify user is a member
			const membership = await db.query.groupMembers.findFirst({
				where: and(
					eq(groupMembers.groupId, groupId),
					eq(groupMembers.userId, session.userId)
				),
			});

			if (!membership) {
				return NextResponse.json(
					{ error: "You must be a member of the group to share with it" },
					{ status: 403 }
				);
			}

			targetGroupId = groupId;

			// Get all group members for notifications (except sharer)
			const members = await db.query.groupMembers.findMany({
				where: eq(groupMembers.groupId, groupId),
			});
			notificationTargets = members
				.filter((m) => m.userId !== session.userId)
				.map((m) => m.userId);
		} else {
			// Share with user
			let targetUser;
			if (userId) {
				targetUser = await db.query.users.findFirst({
					where: eq(users.id, userId),
				});
			} else if (email) {
				targetUser = await db.query.users.findFirst({
					where: eq(users.email, email.toLowerCase().trim()),
				});
			}

			if (!targetUser) {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}

			if (targetUser.id === session.userId) {
				return NextResponse.json(
					{ error: "Cannot share with yourself" },
					{ status: 400 }
				);
			}

			targetUserId = targetUser.id;
			notificationTargets = [targetUser.id];
		}

		// Check if already shared
		const existingShare = await db.query.sharedPrompts.findFirst({
			where: and(
				eq(sharedPrompts.promptId, promptId),
				targetUserId
					? eq(sharedPrompts.sharedWithUserId, targetUserId)
					: eq(sharedPrompts.sharedWithGroupId, targetGroupId!)
			),
		});

		if (existingShare) {
			return NextResponse.json(
				{ error: "Prompt is already shared with this target" },
				{ status: 400 }
			);
		}

		// Create share record
		const [share] = await db
			.insert(sharedPrompts)
			.values({
				promptId,
				sharedById: session.userId,
				sharedWithUserId: targetUserId,
				sharedWithGroupId: targetGroupId,
			})
			.returning();

		// Create notifications
		const group = targetGroupId
			? await db.query.groups.findFirst({ where: eq(groups.id, targetGroupId) })
			: null;

		const sharer = await db.query.users.findFirst({
			where: eq(users.id, session.userId),
		});

		for (const targetId of notificationTargets) {
			await db.insert(notifications).values({
				userId: targetId,
				type: "prompt_shared",
				title: "New Shared Prompt",
				message: group
					? `${sharer?.email} shared "${prompt.title}" with ${group.name}`
					: `${sharer?.email} shared "${prompt.title}" with you`,
				metadata: {
					promptId,
					promptTitle: prompt.title,
					sharedById: session.userId,
					sharerEmail: sharer?.email,
					groupId: targetGroupId,
					groupName: group?.name,
				},
			});
		}

		return NextResponse.json({ share }, { status: 201 });
	} catch (error) {
		console.error("Failed to share prompt:", error);
		return NextResponse.json(
			{ error: "Failed to share prompt" },
			{ status: 500 }
		);
	}
}

// GET /api/prompts/[id]/share - Get shares for a prompt
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id: promptId } = await params;

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
				{ error: "You can only view shares of your own prompts" },
				{ status: 403 }
			);
		}

		const shares = await db.query.sharedPrompts.findMany({
			where: eq(sharedPrompts.promptId, promptId),
			with: {
				sharedWithUser: {
					columns: {
						id: true,
						email: true,
					},
				},
				sharedWithGroup: {
					columns: {
						id: true,
						name: true,
					},
				},
			},
		});

		return NextResponse.json({ shares });
	} catch (error) {
		console.error("Failed to fetch shares:", error);
		return NextResponse.json(
			{ error: "Failed to fetch shares" },
			{ status: 500 }
		);
	}
}
