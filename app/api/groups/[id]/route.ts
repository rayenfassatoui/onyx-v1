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

// GET /api/groups/[id] - Get group details
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;

	try {
		// Check if user is a member
		const membership = await db.query.groupMembers.findFirst({
			where: and(
				eq(groupMembers.groupId, id),
				eq(groupMembers.userId, session.userId)
			),
		});

		if (!membership) {
			return NextResponse.json(
				{ error: "Group not found or access denied" },
				{ status: 404 }
			);
		}

		const group = await db.query.groups.findFirst({
			where: eq(groups.id, id),
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
		});

		if (!group) {
			return NextResponse.json({ error: "Group not found" }, { status: 404 });
		}

		// Transform members to flatten user data
		const transformedMembers = group.members.map((member) => ({
			id: member.id,
			userId: member.userId,
			email: member.user?.email || "",
			role: member.role,
			joinedAt: member.joinedAt,
		}));

		return NextResponse.json({
			group: {
				...group,
				members: transformedMembers,
				currentUserRole: membership.role,
			},
		});
	} catch (error) {
		console.error("Failed to fetch group:", error);
		return NextResponse.json(
			{ error: "Failed to fetch group" },
			{ status: 500 }
		);
	}
}

// PUT /api/groups/[id] - Update group (admin only)
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;

	try {
		// Check admin permission
		if (!(await isGroupAdmin(id, session.userId))) {
			return NextResponse.json(
				{ error: "Only admins can update the group" },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { name, description } = body;

		if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
			return NextResponse.json(
				{ error: "Group name cannot be empty" },
				{ status: 400 }
			);
		}

		const updateData: Partial<{ name: string; description: string | null; updatedAt: Date }> = {
			updatedAt: new Date(),
		};

		if (name !== undefined) {
			updateData.name = name.trim();
		}
		if (description !== undefined) {
			updateData.description = description?.trim() || null;
		}

		const [updatedGroup] = await db
			.update(groups)
			.set(updateData)
			.where(eq(groups.id, id))
			.returning();

		return NextResponse.json({ group: updatedGroup });
	} catch (error) {
		console.error("Failed to update group:", error);
		return NextResponse.json(
			{ error: "Failed to update group" },
			{ status: 500 }
		);
	}
}

// DELETE /api/groups/[id] - Delete group (admin only)
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;

	try {
		// Check admin permission
		if (!(await isGroupAdmin(id, session.userId))) {
			return NextResponse.json(
				{ error: "Only admins can delete the group" },
				{ status: 403 }
			);
		}

		await db.delete(groups).where(eq(groups.id, id));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete group:", error);
		return NextResponse.json(
			{ error: "Failed to delete group" },
			{ status: 500 }
		);
	}
}
