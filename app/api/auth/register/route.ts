import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, vaults } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
	hashPasscode,
	validatePasscode,
	validateEmail,
	createSession,
	setSessionCookie,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, passcode, confirmPasscode } = body;

		// Validate email
		const emailValidation = validateEmail(email);
		if (!emailValidation.valid) {
			return NextResponse.json(
				{ error: emailValidation.error },
				{ status: 400 }
			);
		}

		// Validate passcode
		const passcodeValidation = validatePasscode(passcode);
		if (!passcodeValidation.valid) {
			return NextResponse.json(
				{ error: passcodeValidation.error },
				{ status: 400 }
			);
		}

		// Validate confirm passcode matches
		if (passcode !== confirmPasscode) {
			return NextResponse.json(
				{ error: "Passcodes do not match" },
				{ status: 400 }
			);
		}

		// Check if user already exists
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase()),
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "An account with this email already exists" },
				{ status: 409 }
			);
		}

		// Hash passcode
		const passcodeHash = await hashPasscode(passcode);

		// Create user
		const [newUser] = await db
			.insert(users)
			.values({
				email: email.toLowerCase(),
				passcodeHash,
			})
			.returning();

		// Create vault for user
		const [newVault] = await db
			.insert(vaults)
			.values({
				userId: newUser.id,
				name: "My Vault",
			})
			.returning();

		// Create session
		const token = await createSession({
			userId: newUser.id,
			vaultId: newVault.id,
			email: newUser.email,
		});

		// Set session cookie
		await setSessionCookie(token);

		return NextResponse.json({
			success: true,
			user: {
				id: newUser.id,
				email: newUser.email,
			},
		});
	} catch (error) {
		console.error("Registration error:", error);
		return NextResponse.json(
			{ error: "An unexpected error occurred" },
			{ status: 500 }
		);
	}
}
