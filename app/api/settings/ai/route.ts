import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vaults } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// GET /api/settings/ai - Get AI settings
export async function GET() {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const [vault] = await db
			.select({
				openrouterApiKey: vaults.openrouterApiKey,
				aiModel: vaults.aiModel,
			})
			.from(vaults)
			.where(eq(vaults.id, session.vaultId));

		if (!vault) {
			return NextResponse.json({ error: "Vault not found" }, { status: 404 });
		}

		// Mask the API key for security
		const maskedKey = vault.openrouterApiKey
			? `${vault.openrouterApiKey.slice(0, 8)}${"*".repeat(20)}${vault.openrouterApiKey.slice(-4)}`
			: null;

		return NextResponse.json({
			hasApiKey: !!vault.openrouterApiKey,
			maskedApiKey: maskedKey,
			aiModel: vault.aiModel || "openai/gpt-4o-mini",
		});
	} catch (error) {
		console.error("Error fetching AI settings:", error);
		return NextResponse.json(
			{ error: "Failed to fetch AI settings" },
			{ status: 500 }
		);
	}
}

// PATCH /api/settings/ai - Update AI settings
export async function PATCH(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { openrouterApiKey, aiModel } = body;

		const updateData: { openrouterApiKey?: string | null; aiModel?: string } = {};

		// Handle API key update
		if (openrouterApiKey !== undefined) {
			// Allow setting to null/empty to remove
			updateData.openrouterApiKey = openrouterApiKey || null;
		}

		// Handle model update
		if (aiModel !== undefined) {
			updateData.aiModel = aiModel;
		}

		if (Object.keys(updateData).length === 0) {
			return NextResponse.json(
				{ error: "No valid fields to update" },
				{ status: 400 }
			);
		}

		await db
			.update(vaults)
			.set(updateData)
			.where(eq(vaults.id, session.vaultId));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error updating AI settings:", error);
		return NextResponse.json(
			{ error: "Failed to update AI settings" },
			{ status: 500 }
		);
	}
}

// DELETE /api/settings/ai - Remove API key
export async function DELETE() {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await db
			.update(vaults)
			.set({ openrouterApiKey: null })
			.where(eq(vaults.id, session.vaultId));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error removing API key:", error);
		return NextResponse.json(
			{ error: "Failed to remove API key" },
			{ status: 500 }
		);
	}
}
