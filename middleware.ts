import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
	process.env.JWT_SECRET || "onyx-vault-secret-key-change-in-production"
);

const SESSION_COOKIE_NAME = "onyx-session";

// Routes that don't require authentication
const publicRoutes = ["/", "/api/auth/login", "/api/auth/register"];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/"];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

	// Check if route is public
	const isPublicRoute = publicRoutes.some(
		(route) => pathname === route || pathname.startsWith("/api/auth/")
	);

	// Verify token if present
	let isAuthenticated = false;
	if (token) {
		try {
			await jwtVerify(token, JWT_SECRET);
			isAuthenticated = true;
		} catch {
			// Token is invalid, clear it
			const response = NextResponse.redirect(new URL("/", request.url));
			response.cookies.delete(SESSION_COOKIE_NAME);
			return response;
		}
	}

	// If authenticated and trying to access auth routes, redirect to dashboard
	if (isAuthenticated && authRoutes.includes(pathname)) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// If not authenticated and trying to access protected route
	if (!isAuthenticated && !isPublicRoute) {
		// For API routes, return 401
		if (pathname.startsWith("/api/")) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}
		// For pages, redirect to login
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public files
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
