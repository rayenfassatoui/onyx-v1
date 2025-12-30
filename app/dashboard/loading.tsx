import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
	return (
		<div className="min-h-screen bg-background">
			{/* Header Skeleton */}
			<header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
				<div className="container flex h-16 items-center justify-between px-4">
					<Skeleton className="h-6 w-32" />
					<div className="flex items-center gap-2">
						<Skeleton className="h-9 w-64 hidden md:block" />
						<Skeleton className="h-9 w-9 rounded-md" />
						<Skeleton className="h-9 w-9 rounded-md" />
						<Skeleton className="h-9 w-9 rounded-md" />
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container px-4 py-6">
				{/* Tag Rail Skeleton */}
				<div className="mb-6 flex gap-2 overflow-hidden">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
					))}
				</div>

				{/* Controls Skeleton */}
				<div className="mb-6 flex justify-between items-center">
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-10 w-36" />
				</div>

				{/* Grid Skeleton */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 9 }).map((_, i) => (
						<div
							key={i}
							className="rounded-lg border bg-card p-4 space-y-3"
						>
							<div className="flex items-start justify-between">
								<Skeleton className="h-5 w-3/4" />
								<Skeleton className="h-8 w-8 rounded-md" />
							</div>
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-16 w-full" />
							<div className="flex gap-2">
								<Skeleton className="h-6 w-16 rounded-full" />
								<Skeleton className="h-6 w-20 rounded-full" />
							</div>
							<div className="flex items-center justify-between pt-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-7 w-7 rounded-md" />
							</div>
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
