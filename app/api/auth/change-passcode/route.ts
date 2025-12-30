import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hashPasscode, verifyPasscode } from "@/lib/auth/passcode";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { currentPasscode, newPasscode } = await request.json();

		if (!currentPasscode || !newPasscode) {
			return NextResponse.json(
				{ error: "Both current and new passcode are required" },
				{ status: 400 }
			);
		}

		if (newPasscode.length < 4) {
			return NextResponse.json(
				{ error: "Passcode must be at least 4 characters" },
				{ status: 400 }
			);
		}

		// Get user
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, session.userId));

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Validate current passcode
		const isValid = await verifyPasscode(currentPasscode, user.passcodeHash);
		if (!isValid) {
			return NextResponse.json(
				{ error: "Current passcode is incorrect" },
				{ status: 401 }
			);
		}

		// Hash new passcode
		const newHash = await hashPasscode(newPasscode);

		// Update user
		await db
			.update(users)
			.set({
				passcodeHash: newHash,
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.userId));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Change passcode error:", error);
		return NextResponse.json(
			{ error: "Failed to change passcode" },
			{ status: 500 }
		);
	}
}
