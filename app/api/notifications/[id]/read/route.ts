import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";

// PUT /api/notifications/[id]/read - Mark notification as read
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
		// Verify ownership
		const notification = await db.query.notifications.findFirst({
			where: and(
				eq(notifications.id, id),
				eq(notifications.userId, session.userId)
			),
		});

		if (!notification) {
			return NextResponse.json(
				{ error: "Notification not found" },
				{ status: 404 }
			);
		}

		// Mark as read
		const [updated] = await db
			.update(notifications)
			.set({ read: true })
			.where(eq(notifications.id, id))
			.returning();

		return NextResponse.json({ notification: updated });
	} catch (error) {
		console.error("Failed to mark notification as read:", error);
		return NextResponse.json(
			{ error: "Failed to update notification" },
			{ status: 500 }
		);
	}
}
