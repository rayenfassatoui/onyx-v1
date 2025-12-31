import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { userInvites } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// POST - Create a new user invite link
export async function POST(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json().catch(() => ({}));
		const { expiresIn, maxUses } = body;

		// Calculate expiration
		let expiresAt: Date | null = null;
		if (expiresIn) {
			const now = new Date();
			switch (expiresIn) {
				case "1h":
					expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
					break;
				case "24h":
					expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
					break;
				case "7d":
					expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
					break;
				case "30d":
					expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
					break;
			}
		}

		// Generate unique token
		const token = nanoid(21);

		// Create invite
		const [invite] = await db
			.insert(userInvites)
			.values({
				token,
				createdById: session.userId,
				expiresAt,
				maxUses: maxUses || null,
			})
			.returning();

		return NextResponse.json({ invite }, { status: 201 });
	} catch (error) {
		console.error("Failed to create user invite:", error);
		return NextResponse.json(
			{ error: "Failed to create invite" },
			{ status: 500 }
		);
	}
}

// GET - List all user invites created by the current user
export async function GET() {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const invites = await db
			.select()
			.from(userInvites)
			.where(eq(userInvites.createdById, session.userId))
			.orderBy(desc(userInvites.createdAt));

		return NextResponse.json({ invites });
	} catch (error) {
		console.error("Failed to fetch user invites:", error);
		return NextResponse.json(
			{ error: "Failed to fetch invites" },
			{ status: 500 }
		);
	}
}
