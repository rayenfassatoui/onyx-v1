import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { prompts, sharedPrompts, users, groups, groupMembers, notifications, vaults } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

// POST - Share multiple prompts at once
export async function POST(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { promptIds, email, groupId } = body;

		if (!promptIds || !Array.isArray(promptIds) || promptIds.length === 0) {
			return NextResponse.json(
				{ error: "At least one prompt ID is required" },
				{ status: 400 }
			);
		}

		if (!email && !groupId) {
			return NextResponse.json(
				{ error: "Either email or groupId is required" },
				{ status: 400 }
			);
		}

		// Get user's vault
		const vault = await db.query.vaults.findFirst({
			where: eq(vaults.userId, session.userId),
		});

		if (!vault) {
			return NextResponse.json({ error: "Vault not found" }, { status: 404 });
		}

		// Verify all prompts belong to the user
		const userPrompts = await db
			.select({ id: prompts.id })
			.from(prompts)
			.where(
				and(
					eq(prompts.vaultId, vault.id),
					inArray(prompts.id, promptIds)
				)
			);

		const validPromptIds = userPrompts.map(p => p.id);
		
		if (validPromptIds.length === 0) {
			return NextResponse.json(
				{ error: "No valid prompts found" },
				{ status: 404 }
			);
		}

		let sharedWithUserId: string | null = null;
		let sharedWithGroupId: string | null = null;
		let notificationRecipients: string[] = [];

		if (email) {
			// Share with user
			const targetUser = await db.query.users.findFirst({
				where: eq(users.email, email),
			});

			if (!targetUser) {
				return NextResponse.json(
					{ error: "User not found" },
					{ status: 404 }
				);
			}

			if (targetUser.id === session.userId) {
				return NextResponse.json(
					{ error: "You cannot share with yourself" },
					{ status: 400 }
				);
			}

			sharedWithUserId = targetUser.id;
			notificationRecipients = [targetUser.id];
		} else if (groupId) {
			// Share with group
			const group = await db.query.groups.findFirst({
				where: eq(groups.id, groupId),
			});

			if (!group) {
				return NextResponse.json(
					{ error: "Group not found" },
					{ status: 404 }
				);
			}

			// Check if user is a member of the group
			const membership = await db.query.groupMembers.findFirst({
				where: and(
					eq(groupMembers.groupId, groupId),
					eq(groupMembers.userId, session.userId)
				),
			});

			if (!membership) {
				return NextResponse.json(
					{ error: "You are not a member of this group" },
					{ status: 403 }
				);
			}

			sharedWithGroupId = groupId;

			// Get all group members except the sharer
			const members = await db
				.select({ userId: groupMembers.userId })
				.from(groupMembers)
				.where(eq(groupMembers.groupId, groupId));

			notificationRecipients = members
				.map(m => m.userId)
				.filter(id => id !== session.userId);
		}

		// Create share records for each prompt
		const shareRecords = validPromptIds.map(promptId => ({
			promptId,
			sharedById: session.userId,
			sharedWithUserId,
			sharedWithGroupId,
		}));

		// Insert shares (ignore duplicates)
		const results = [];
		for (const record of shareRecords) {
			try {
				// Check if already shared
				const existingShare = await db.query.sharedPrompts.findFirst({
					where: and(
						eq(sharedPrompts.promptId, record.promptId),
						record.sharedWithUserId 
							? eq(sharedPrompts.sharedWithUserId, record.sharedWithUserId)
							: eq(sharedPrompts.sharedWithGroupId, record.sharedWithGroupId!)
					),
				});

				if (!existingShare) {
					const [share] = await db.insert(sharedPrompts).values(record).returning();
					results.push(share);
				}
			} catch (error) {
				console.error("Failed to share prompt:", record.promptId, error);
			}
		}

		// Create notifications
		if (notificationRecipients.length > 0 && results.length > 0) {
			const sharerEmail = session.email;
			const notificationValues = notificationRecipients.map(userId => ({
				userId,
				type: "prompts_shared",
				title: "Prompts Shared",
				message: `${sharerEmail} shared ${results.length} prompt${results.length > 1 ? "s" : ""} with you`,
				metadata: { 
					sharedById: session.userId,
					count: results.length,
				},
			}));

			await db.insert(notifications).values(notificationValues);
		}

		return NextResponse.json({
			success: true,
			sharedCount: results.length,
			totalRequested: validPromptIds.length,
		});
	} catch (error) {
		console.error("Failed to bulk share prompts:", error);
		return NextResponse.json(
			{ error: "Failed to share prompts" },
			{ status: 500 }
		);
	}
}
