import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPasscode(passcode: string): Promise<string> {
	return bcrypt.hash(passcode, SALT_ROUNDS);
}

export async function verifyPasscode(
	passcode: string,
	hash: string
): Promise<boolean> {
	return bcrypt.compare(passcode, hash);
}

export function validatePasscode(passcode: string): { valid: boolean; error?: string } {
	if (!passcode || typeof passcode !== "string") {
		return { valid: false, error: "Passcode is required" };
	}

	if (passcode.length !== 4) {
		return { valid: false, error: "Passcode must be exactly 4 digits" };
	}

	if (!/^\d{4}$/.test(passcode)) {
		return { valid: false, error: "Passcode must contain only digits" };
	}

	return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
	if (!email || typeof email !== "string") {
		return { valid: false, error: "Email is required" };
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return { valid: false, error: "Invalid email format" };
	}

	return { valid: true };
}
