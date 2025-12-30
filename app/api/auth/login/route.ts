import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, vaults } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
	verifyPasscode,
	validatePasscode,
	validateEmail,
	createSession,
	setSessionCookie,
} from "@/lib/auth";

// Simple in-memory rate limiting (use Redis in production)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60 * 1000; // 1 minute

function checkRateLimit(email: string): { allowed: boolean; retryAfter?: number } {
	const now = Date.now();
	const attempts = loginAttempts.get(email);

	if (!attempts) {
		return { allowed: true };
	}

	// Reset if lockout period has passed
	if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
		loginAttempts.delete(email);
		return { allowed: true };
	}

	if (attempts.count >= MAX_ATTEMPTS) {
		const retryAfter = Math.ceil((LOCKOUT_DURATION - (now - attempts.lastAttempt)) / 1000);
		return { allowed: false, retryAfter };
	}

	return { allowed: true };
}

function recordFailedAttempt(email: string): void {
	const now = Date.now();
	const attempts = loginAttempts.get(email);

	if (!attempts) {
		loginAttempts.set(email, { count: 1, lastAttempt: now });
	} else {
		loginAttempts.set(email, { count: attempts.count + 1, lastAttempt: now });
	}
}

function clearAttempts(email: string): void {
	loginAttempts.delete(email);
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, passcode } = body;

		// Validate email
		const emailValidation = validateEmail(email);
		if (!emailValidation.valid) {
			return NextResponse.json(
				{ error: emailValidation.error },
				{ status: 400 }
			);
		}

		// Validate passcode format
		const passcodeValidation = validatePasscode(passcode);
		if (!passcodeValidation.valid) {
			return NextResponse.json(
				{ error: passcodeValidation.error },
				{ status: 400 }
			);
		}

		const normalizedEmail = email.toLowerCase();

		// Check rate limit
		const rateLimitCheck = checkRateLimit(normalizedEmail);
		if (!rateLimitCheck.allowed) {
			return NextResponse.json(
				{ 
					error: `Too many failed attempts. Please try again in ${rateLimitCheck.retryAfter} seconds.`,
					retryAfter: rateLimitCheck.retryAfter,
				},
				{ status: 429 }
			);
		}

		// Find user
		const user = await db.query.users.findFirst({
			where: eq(users.email, normalizedEmail),
		});

		if (!user) {
			recordFailedAttempt(normalizedEmail);
			return NextResponse.json(
				{ error: "Invalid email or passcode" },
				{ status: 401 }
			);
		}

		// Verify passcode
		const isValid = await verifyPasscode(passcode, user.passcodeHash);

		if (!isValid) {
			recordFailedAttempt(normalizedEmail);
			return NextResponse.json(
				{ error: "Invalid email or passcode" },
				{ status: 401 }
			);
		}

		// Clear failed attempts on successful login
		clearAttempts(normalizedEmail);

		// Get user's vault
		const vault = await db.query.vaults.findFirst({
			where: eq(vaults.userId, user.id),
		});

		if (!vault) {
			return NextResponse.json(
				{ error: "Vault not found" },
				{ status: 500 }
			);
		}

		// Create session
		const token = await createSession({
			userId: user.id,
			vaultId: vault.id,
			email: user.email,
		});

		// Set session cookie
		await setSessionCookie(token);

		return NextResponse.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json(
			{ error: "An unexpected error occurred" },
			{ status: 500 }
		);
	}
}
