import { Suspense } from "react";
import { InviteClient } from "./client";

interface InvitePageProps {
	params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
	const { token } = await params;
	
	return (
		<Suspense fallback={<InviteLoading />}>
			<InviteClient token={token} />
		</Suspense>
	);
}

function InviteLoading() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
			<div className="animate-pulse text-center">
				<div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4" />
				<div className="h-6 w-48 bg-muted rounded mx-auto mb-2" />
				<div className="h-4 w-32 bg-muted rounded mx-auto" />
			</div>
		</div>
	);
}
