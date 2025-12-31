import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { userInvites, userConnections, notifications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteParams {
	params: Promise<{ token: string }>;
}

// POST - Accept invite and create connection
export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { token } = await params;

		// Find the invite
		const invite = await db.query.userInvites.findFirst({
			where: eq(userInvites.token, token),
			with: {
				createdBy: true,
			},
		});

		if (!invite) {
			return NextResponse.json(
				{ error: "Invite not found" },
				{ status: 404 }
			);
		}

		// Check if expired
		if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
			return NextResponse.json(
				{ error: "This invite has expired" },
				{ status: 410 }
			);
		}

		// Check if max uses reached
		if (invite.maxUses && invite.uses >= invite.maxUses) {
			return NextResponse.json(
				{ error: "This invite has reached its maximum uses" },
				{ status: 410 }
			);
		}

		// Can't connect to yourself
		if (invite.createdById === session.userId) {
			return NextResponse.json(
				{ error: "You cannot connect to yourself" },
				{ status: 400 }
			);
		}

		// Check if already connected
		const existingConnection = await db.query.userConnections.findFirst({
			where: and(
				eq(userConnections.userId, invite.createdById),
				eq(userConnections.connectedUserId, session.userId)
			),
		});

		if (existingConnection) {
			return NextResponse.json(
				{ error: "You are already connected to this user" },
				{ status: 400 }
			);
		}

		// Create bidirectional connections
		await db.insert(userConnections).values([
			{
				userId: invite.createdById,
				connectedUserId: session.userId,
			},
			{
				userId: session.userId,
				connectedUserId: invite.createdById,
			},
		]);

		// Increment uses
		await db
			.update(userInvites)
			.set({ uses: invite.uses + 1 })
			.where(eq(userInvites.id, invite.id));

		// Fetch the accepting user's email for notification
		const acceptingUser = await db.query.users.findFirst({
			where: eq(users.id, session.userId),
			columns: { email: true },
		});

		// Create notification for the inviter
		await db.insert(notifications).values({
			userId: invite.createdById,
			type: "user_connected",
			title: "New Connection",
			message: `${acceptingUser?.email || "A user"} connected with you via your invite link`,
			metadata: { connectedUserId: session.userId },
		});

		return NextResponse.json({
			success: true,
			message: `Connected with ${invite.createdBy.email}`,
		});
	} catch (error) {
		console.error("Failed to accept user invite:", error);
		return NextResponse.json(
			{ error: "Failed to accept invite" },
			{ status: 500 }
		);
	}
}
