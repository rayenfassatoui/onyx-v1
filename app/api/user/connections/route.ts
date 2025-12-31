import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { userConnections, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET - List all users connected to the current user
export async function GET() {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get all connections where the current user is the userId
		const connections = await db
			.select({
				id: users.id,
				email: users.email,
				connectedAt: userConnections.createdAt,
			})
			.from(userConnections)
			.innerJoin(users, eq(users.id, userConnections.connectedUserId))
			.where(eq(userConnections.userId, session.userId));

		return NextResponse.json({ connections });
	} catch (error) {
		console.error("Failed to fetch connections:", error);
		return NextResponse.json(
			{ error: "Failed to fetch connections" },
			{ status: 500 }
		);
	}
}
