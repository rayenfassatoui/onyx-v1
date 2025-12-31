import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";

// PUT /api/notifications/read-all - Mark all notifications as read
export async function PUT() {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		await db
			.update(notifications)
			.set({ read: true })
			.where(
				and(
					eq(notifications.userId, session.userId),
					eq(notifications.read, false)
				)
			);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to mark all notifications as read:", error);
		return NextResponse.json(
			{ error: "Failed to update notifications" },
			{ status: 500 }
		);
	}
}
