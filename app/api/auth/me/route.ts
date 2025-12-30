import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
	try {
		const session = await getSession();

		if (!session) {
			return NextResponse.json(
				{ authenticated: false },
				{ status: 401 }
			);
		}

		return NextResponse.json({
			authenticated: true,
			user: {
				id: session.userId,
				email: session.email,
				vaultId: session.vaultId,
			},
		});
	} catch (error) {
		console.error("Session check error:", error);
		return NextResponse.json(
			{ authenticated: false, error: "Session invalid" },
			{ status: 401 }
		);
	}
}
