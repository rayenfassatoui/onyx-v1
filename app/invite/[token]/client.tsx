"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Users, Check, X, LogIn, UserPlus } from "lucide-react";

interface InviteData {
	valid: boolean;
	error?: string;
	group?: {
		id: number;
		name: string;
		description: string | null;
	};
}

interface User {
	id: number;
	email: string;
}

interface InviteClientProps {
	token: string;
}

export function InviteClient({ token }: InviteClientProps) {
	const router = useRouter();
	const [inviteData, setInviteData] = useState<InviteData | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [accepting, setAccepting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// Check if user is authenticated and fetch invite data
	useEffect(() => {
		async function fetchData() {
			try {
				// Check auth status
				const authRes = await fetch("/api/auth/me");
				if (authRes.ok) {
					const authData = await authRes.json();
					setUser(authData.user);
				}

				// Fetch invite data
				const inviteRes = await fetch(`/api/invite/${token}`);
				const data = await inviteRes.json();
				setInviteData(data);
			} catch {
				setError("Failed to load invite");
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [token]);

	const handleAccept = async () => {
		if (!user) {
			// Store the invite URL to redirect back after login
			sessionStorage.setItem("pendingInvite", token);
			router.push("/");
			return;
		}

		setAccepting(true);
		setError(null);

		try {
			const res = await fetch(`/api/invite/${token}/accept`, {
				method: "POST",
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Failed to join group");
				return;
			}

			setSuccess(true);
			// Redirect to groups page after 2 seconds
			setTimeout(() => {
				router.push("/groups");
			}, 2000);
		} catch {
			setError("Failed to join group");
		} finally {
			setAccepting(false);
		}
	};

	const handleLogin = () => {
		sessionStorage.setItem("pendingInvite", token);
		router.push("/");
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	// Invalid invite
	if (!inviteData?.valid || !inviteData.group) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
							<X className="h-8 w-8 text-destructive" />
						</div>
						<CardTitle className="text-2xl">Invalid Invite</CardTitle>
						<CardDescription>
							{inviteData?.error || "This invite link is invalid or has expired."}
						</CardDescription>
					</CardHeader>
					<CardFooter className="justify-center">
						<Button variant="outline" onClick={() => router.push("/")}>
							Go to Home
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	// Success state
	if (success) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
							<Check className="h-8 w-8 text-green-500" />
						</div>
						<CardTitle className="text-2xl">Welcome to {inviteData.group.name}!</CardTitle>
						<CardDescription>
							You have successfully joined the group. Redirecting to your groups...
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	// Valid invite - show join UI
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<Users className="h-8 w-8 text-primary" />
					</div>
					<CardTitle className="text-2xl">
						You&apos;re invited to join
					</CardTitle>
					<div className="mt-4 p-4 bg-muted rounded-lg">
						<h3 className="text-xl font-semibold">{inviteData.group.name}</h3>
						{inviteData.group.description && (
							<p className="text-sm text-muted-foreground mt-2">
								{inviteData.group.description}
							</p>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
							{error}
						</div>
					)}
					
					{!user && (
						<div className="text-center text-sm text-muted-foreground mb-4">
							You need to sign in or create an account to join this group.
						</div>
					)}
				</CardContent>
				<CardFooter className="flex flex-col gap-3">
					{user ? (
						<>
							<Button 
								className="w-full" 
								size="lg"
								onClick={handleAccept}
								disabled={accepting}
							>
								{accepting ? (
									<>
										<Spinner className="h-4 w-4 mr-2" />
										Joining...
									</>
								) : (
									<>
										<Check className="mr-2 h-5 w-5" />
										Join Group
									</>
								)}
							</Button>
							<p className="text-xs text-muted-foreground text-center">
								Signed in as {user.email}
							</p>
						</>
					) : (
						<div className="w-full space-y-3">
							<Button 
								className="w-full" 
								size="lg"
								onClick={handleLogin}
							>
								<LogIn className="mr-2 h-5 w-5" />
								Sign In to Join
							</Button>
							<Button 
								className="w-full" 
								size="lg"
								variant="outline"
								onClick={handleLogin}
							>
								<UserPlus className="mr-2 h-5 w-5" />
								Create Account to Join
							</Button>
						</div>
					)}
				</CardFooter>
			</Card>
		</div>
	);
}
