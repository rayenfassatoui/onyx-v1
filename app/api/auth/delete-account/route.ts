import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, vaults, prompts, tags, promptTags, promptVersions } from "@/db/schema";
import { getSession, clearSession } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// Get user's vault
		const [vault] = await db
			.select()
			.from(vaults)
			.where(eq(vaults.userId, session.userId));

		if (vault) {
			// Get all prompts in vault
			const vaultPrompts = await db
				.select({ id: prompts.id })
				.from(prompts)
				.where(eq(prompts.vaultId, vault.id));

			const promptIds = vaultPrompts.map((p) => p.id);

			if (promptIds.length > 0) {
				// Delete prompt versions
				await db
					.delete(promptVersions)
					.where(inArray(promptVersions.promptId, promptIds));

				// Delete prompt tags
				await db
					.delete(promptTags)
					.where(inArray(promptTags.promptId, promptIds));

				// Delete prompts
				await db
					.delete(prompts)
					.where(eq(prompts.vaultId, vault.id));
			}

			// Delete tags
			await db
				.delete(tags)
				.where(eq(tags.vaultId, vault.id));

			// Delete vault
			await db
				.delete(vaults)
				.where(eq(vaults.id, vault.id));
		}

		// Delete user
		await db
			.delete(users)
			.where(eq(users.id, session.userId));

		// Clear session
		await clearSession();

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Delete account error:", error);
		return NextResponse.json(
			{ error: "Failed to delete account" },
			{ status: 500 }
		);
	}
}
