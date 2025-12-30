import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// GET /api/tags - List all tags
export async function GET() {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const tagList = await db.query.tags.findMany({
			where: eq(tags.vaultId, session.vaultId),
			orderBy: (tags, { asc }) => [asc(tags.name)],
		});

		return NextResponse.json({ tags: tagList });
	} catch (error) {
		console.error("Error fetching tags:", error);
		return NextResponse.json(
			{ error: "Failed to fetch tags" },
			{ status: 500 }
		);
	}
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { name, color = "#6366f1" } = body;

		// Validate name
		if (!name || typeof name !== "string" || name.trim() === "") {
			return NextResponse.json(
				{ error: "Tag name is required" },
				{ status: 400 }
			);
		}

		// Check for duplicate name in vault
		const existingTag = await db.query.tags.findFirst({
			where: and(
				eq(tags.vaultId, session.vaultId),
				eq(tags.name, name.trim())
			),
		});

		if (existingTag) {
			return NextResponse.json(
				{ error: "A tag with this name already exists" },
				{ status: 409 }
			);
		}

		// Create tag
		const [newTag] = await db
			.insert(tags)
			.values({
				vaultId: session.vaultId,
				name: name.trim(),
				color,
			})
			.returning();

		return NextResponse.json({ tag: newTag }, { status: 201 });
	} catch (error) {
		console.error("Error creating tag:", error);
		return NextResponse.json(
			{ error: "Failed to create tag" },
			{ status: 500 }
		);
	}
}
