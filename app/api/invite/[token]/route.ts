import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { groupInvites } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/invite/[token] - Validate invite and get group info
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ token: string }> }
) {
	const { token } = await params;

	try {
		const invite = await db.query.groupInvites.findFirst({
			where: eq(groupInvites.token, token),
			with: {
				group: {
					columns: {
						id: true,
						name: true,
						description: true,
					},
				},
				createdBy: {
					columns: {
						email: true,
					},
				},
			},
		});

		if (!invite) {
			return NextResponse.json(
				{ error: "Invalid invite link", valid: false },
				{ status: 404 }
			);
		}

		// Check if expired
		if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
			return NextResponse.json(
				{ error: "This invite link has expired", valid: false },
				{ status: 410 }
			);
		}

		// Check if max uses reached
		if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
			return NextResponse.json(
				{ error: "This invite link has reached its maximum uses", valid: false },
				{ status: 410 }
			);
		}

		return NextResponse.json({
			valid: true,
			group: invite.group,
			invitedBy: invite.createdBy?.email,
			expiresAt: invite.expiresAt,
			usesRemaining: invite.maxUses ? invite.maxUses - invite.uses : null,
		});
	} catch (error) {
		console.error("Failed to validate invite:", error);
		return NextResponse.json(
			{ error: "Failed to validate invite" },
			{ status: 500 }
		);
	}
}
