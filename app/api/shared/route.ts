import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sharedPrompts, prompts, vaults, groupMembers, users, groups, notifications } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and, or, inArray } from "drizzle-orm";

// GET /api/shared - List prompts shared with current user
export async function GET() {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// Get user's group memberships
		const memberships = await db.query.groupMembers.findMany({
			where: eq(groupMembers.userId, session.userId),
			columns: { groupId: true },
		});
		const userGroupIds = memberships.map((m) => m.groupId);

		// Build conditions for shared prompts
		const conditions = [eq(sharedPrompts.sharedWithUserId, session.userId)];
		
		if (userGroupIds.length > 0) {
			conditions.push(inArray(sharedPrompts.sharedWithGroupId, userGroupIds));
		}

		// Get all shared prompts
		const shared = await db.query.sharedPrompts.findMany({
			where: or(...conditions),
			with: {
				prompt: {
					with: {
						vault: {
							columns: {
								id: true,
								name: true,
							},
						},
						promptTags: {
							with: {
								tag: true,
							},
						},
					},
				},
				sharedBy: {
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
			orderBy: (table, { desc }) => [desc(table.createdAt)],
		});

		// Format response
		const sharedPromptsList = shared.map((s) => ({
			shareId: s.id,
			sharedAt: s.createdAt,
			sharedBy: s.sharedBy,
			sharedVia: s.sharedWithGroup ? { type: "group", group: s.sharedWithGroup } : { type: "direct" },
			prompt: {
				id: s.prompt.id,
				title: s.prompt.title,
				description: s.prompt.description,
				content: s.prompt.content,
				createdAt: s.prompt.createdAt,
				updatedAt: s.prompt.updatedAt,
				tags: s.prompt.promptTags.map((pt) => pt.tag),
			},
		}));

		return NextResponse.json({ prompts: sharedPromptsList });
	} catch (error) {
		console.error("Failed to fetch shared prompts:", error);
		return NextResponse.json(
			{ error: "Failed to fetch shared prompts" },
			{ status: 500 }
		);
	}
}
