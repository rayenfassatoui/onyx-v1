import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and, desc } from "drizzle-orm";

// GET /api/notifications - List user notifications
export async function GET(request: NextRequest) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const searchParams = request.nextUrl.searchParams;
		const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
		const offset = parseInt(searchParams.get("offset") || "0");
		const unreadOnly = searchParams.get("unreadOnly") === "true";

		const whereClause = unreadOnly
			? and(eq(notifications.userId, session.userId), eq(notifications.read, false))
			: eq(notifications.userId, session.userId);

		const userNotifications = await db.query.notifications.findMany({
			where: whereClause,
			orderBy: [desc(notifications.createdAt)],
			limit,
			offset,
		});

		// Get unread count
		const unreadNotifications = await db.query.notifications.findMany({
			where: and(
				eq(notifications.userId, session.userId),
				eq(notifications.read, false)
			),
			columns: { id: true },
		});

		return NextResponse.json({
			notifications: userNotifications,
			unreadCount: unreadNotifications.length,
		});
	} catch (error) {
		console.error("Failed to fetch notifications:", error);
		return NextResponse.json(
			{ error: "Failed to fetch notifications" },
			{ status: 500 }
		);
	}
}
