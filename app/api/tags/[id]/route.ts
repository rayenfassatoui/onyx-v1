import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

interface RouteParams {
	params: Promise<{ id: string }>;
}

// PATCH /api/tags/[id] - Update a tag
export async function PATCH(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const body = await request.json();
		const { name, color } = body;

		// Check tag exists and belongs to user's vault
		const existingTag = await db.query.tags.findFirst({
			where: and(eq(tags.id, id), eq(tags.vaultId, session.vaultId)),
		});

		if (!existingTag) {
			return NextResponse.json({ error: "Tag not found" }, { status: 404 });
		}

		// Validate name if provided
		if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
			return NextResponse.json(
				{ error: "Tag name cannot be empty" },
				{ status: 400 }
			);
		}

		// Check for duplicate name if name is being changed
		if (name && name.trim() !== existingTag.name) {
			const duplicateTag = await db.query.tags.findFirst({
				where: and(
					eq(tags.vaultId, session.vaultId),
					eq(tags.name, name.trim())
				),
			});

			if (duplicateTag) {
				return NextResponse.json(
					{ error: "A tag with this name already exists" },
					{ status: 409 }
				);
			}
		}

		// Update tag
		const updateData: Partial<typeof tags.$inferInsert> = {};
		if (name !== undefined) updateData.name = name.trim();
		if (color !== undefined) updateData.color = color;

		const [updatedTag] = await db
			.update(tags)
			.set(updateData)
			.where(eq(tags.id, id))
			.returning();

		return NextResponse.json({ tag: updatedTag });
	} catch (error) {
		console.error("Error updating tag:", error);
		return NextResponse.json(
			{ error: "Failed to update tag" },
			{ status: 500 }
		);
	}
}

// DELETE /api/tags/[id] - Delete a tag
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		// Check tag exists and belongs to user's vault
		const existingTag = await db.query.tags.findFirst({
			where: and(eq(tags.id, id), eq(tags.vaultId, session.vaultId)),
		});

		if (!existingTag) {
			return NextResponse.json({ error: "Tag not found" }, { status: 404 });
		}

		// Delete tag (cascade will handle prompt_tags junction)
		await db.delete(tags).where(eq(tags.id, id));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting tag:", error);
		return NextResponse.json(
			{ error: "Failed to delete tag" },
			{ status: 500 }
		);
	}
}
