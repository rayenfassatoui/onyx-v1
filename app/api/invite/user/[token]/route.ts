import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userInvites, users } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
	params: Promise<{ token: string }>;
}

// GET - Validate invite token and return inviter info
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
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
				{ valid: false, error: "Invite not found" },
				{ status: 404 }
			);
		}

		// Check if expired
		if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
			return NextResponse.json(
				{ valid: false, error: "This invite has expired" },
				{ status: 410 }
			);
		}

		// Check if max uses reached
		if (invite.maxUses && invite.uses >= invite.maxUses) {
			return NextResponse.json(
				{ valid: false, error: "This invite has reached its maximum uses" },
				{ status: 410 }
			);
		}

		return NextResponse.json({
			valid: true,
			inviter: {
				id: invite.createdBy.id,
				email: invite.createdBy.email,
			},
		});
	} catch (error) {
		console.error("Failed to validate user invite:", error);
		return NextResponse.json(
			{ valid: false, error: "Failed to validate invite" },
			{ status: 500 }
		);
	}
}
