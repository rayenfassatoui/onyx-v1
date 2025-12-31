import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { groups, groupMembers, users } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";

// GET /api/groups - List groups user belongs to
export async function GET() {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// Get all groups where user is a member
		const memberships = await db.query.groupMembers.findMany({
			where: eq(groupMembers.userId, session.userId),
			with: {
				group: {
					with: {
						creator: {
							columns: {
								id: true,
								email: true,
							},
						},
						members: {
							with: {
								user: {
									columns: {
										id: true,
										email: true,
									},
								},
							},
						},
					},
				},
			},
		});

		const userGroups = memberships.map((m) => ({
			...m.group,
			role: m.role,
			memberCount: m.group.members.length,
		}));

		return NextResponse.json({ groups: userGroups });
	} catch (error) {
		console.error("Failed to fetch groups:", error);
		return NextResponse.json(
			{ error: "Failed to fetch groups" },
			{ status: 500 }
		);
	}
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, description } = body;

		if (!name || typeof name !== "string" || name.trim().length === 0) {
			return NextResponse.json(
				{ error: "Group name is required" },
				{ status: 400 }
			);
		}

		// Create the group
		const [newGroup] = await db
			.insert(groups)
			.values({
				name: name.trim(),
				description: description?.trim() || null,
				creatorId: session.userId,
			})
			.returning();

		// Add creator as admin member
		await db.insert(groupMembers).values({
			groupId: newGroup.id,
			userId: session.userId,
			role: "admin",
		});

		return NextResponse.json({ group: newGroup }, { status: 201 });
	} catch (error) {
		console.error("Failed to create group:", error);
		return NextResponse.json(
			{ error: "Failed to create group" },
			{ status: 500 }
		);
	}
}
