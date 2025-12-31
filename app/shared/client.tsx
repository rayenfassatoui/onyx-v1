"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Copy,
	Search,
	Share2,
	Users,
	Clock,
	X,
	Loader2,
	ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Tag {
	id: string;
	name: string;
	color: string;
}

interface SharedPrompt {
	shareId: string;
	sharedAt: Date;
	sharedBy: {
		id: string;
		email: string;
	};
	sharedVia: {
		type: "direct" | "group";
		group?: {
			id: string;
			name: string;
		};
	};
	prompt: {
		id: string;
		title: string;
		description: string;
		content: string;
		createdAt: Date;
		updatedAt: Date;
		tags: Tag[];
	};
}

export function SharedPromptsClient() {
	const [prompts, setPrompts] = React.useState<SharedPrompt[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [selectedPrompt, setSelectedPrompt] = React.useState<SharedPrompt | null>(null);
	const [viewerOpen, setViewerOpen] = React.useState(false);

	// Fetch shared prompts
	React.useEffect(() => {
		async function fetchSharedPrompts() {
			try {
				const res = await fetch("/api/shared");
				if (res.ok) {
					const data = await res.json();
					setPrompts(data.prompts);
				}
			} catch (error) {
				console.error("Failed to fetch shared prompts:", error);
				toast.error("Failed to load shared prompts");
			} finally {
				setIsLoading(false);
			}
		}
		fetchSharedPrompts();
	}, []);

	// Filter prompts
	const filteredPrompts = React.useMemo(() => {
		if (!searchQuery) return prompts;
		const query = searchQuery.toLowerCase();
		return prompts.filter(
			(p) =>
				p.prompt.title.toLowerCase().includes(query) ||
				p.prompt.content.toLowerCase().includes(query) ||
				p.sharedBy.email.toLowerCase().includes(query)
		);
	}, [prompts, searchQuery]);

	const handleCopy = async (content: string) => {
		await navigator.clipboard.writeText(content);
		toast.success("Copied to clipboard");
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			{/* Header */}
			<header className="sticky top-0 z-40 border-b border-border/40 bg-background/60 backdrop-blur-xl">
				<div className="container flex h-16 items-center gap-4 px-4 max-w-6xl mx-auto">
					<Link href="/dashboard">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Dashboard
						</Button>
					</Link>
					<div className="flex-1" />
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search shared prompts..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-64 pl-9"
						/>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container px-4 py-6 max-w-6xl mx-auto">
				<div className="mb-6">
					<h1 className="text-2xl font-bold flex items-center gap-3">
						<Share2 className="h-6 w-6 text-indigo-500" />
						Shared with Me
					</h1>
					<p className="text-muted-foreground mt-1">
						Prompts that others have shared with you
					</p>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
					</div>
				) : filteredPrompts.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20">
						<div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
							<Share2 className="h-8 w-8 text-muted-foreground/50" />
						</div>
						<h2 className="text-lg font-medium">No shared prompts</h2>
						<p className="text-sm text-muted-foreground mt-1">
							When someone shares a prompt with you, it will appear here.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filteredPrompts.map((shared) => (
							<div
								key={shared.shareId}
								className="group relative rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all cursor-pointer"
								onClick={() => {
									setSelectedPrompt(shared);
									setViewerOpen(true);
								}}
							>
								<div className="flex items-start justify-between gap-2 mb-3">
									<h3 className="font-semibold text-white line-clamp-1">
										{shared.prompt.title}
									</h3>
									<Badge
										variant="outline"
										className={cn(
											"shrink-0 text-[10px]",
											shared.sharedVia.type === "group"
												? "bg-purple-500/10 text-purple-400 border-purple-500/20"
												: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
										)}
									>
										{shared.sharedVia.type === "group" ? (
											<>
												<Users className="h-3 w-3 mr-1" />
												{shared.sharedVia.group?.name}
											</>
										) : (
											"Direct"
										)}
									</Badge>
								</div>

								{shared.prompt.description && (
									<p className="text-sm text-muted-foreground line-clamp-2 mb-3">
										{shared.prompt.description}
									</p>
								)}

								<pre className="text-xs text-muted-foreground/70 font-mono bg-black/20 rounded-lg p-3 line-clamp-3 mb-3">
									{shared.prompt.content}
								</pre>

								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span>From: {shared.sharedBy.email}</span>
									<span className="flex items-center gap-1">
										<Clock className="h-3 w-3" />
										{formatDate(shared.sharedAt)}
									</span>
								</div>

								{shared.prompt.tags.length > 0 && (
									<div className="flex flex-wrap gap-1 mt-3">
										{shared.prompt.tags.map((tag) => (
											<Badge
												key={tag.id}
												variant="outline"
												className="text-[10px] px-1.5 py-0"
												style={{
													backgroundColor: `${tag.color}15`,
													borderColor: `${tag.color}30`,
													color: tag.color,
												}}
											>
												{tag.name}
											</Badge>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</main>

			{/* Prompt Viewer Dialog */}
			<Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
				<DialogContent className="max-w-[90vw] md:max-w-4xl max-h-[90vh] flex flex-col bg-zinc-950 border-white/10 p-0 gap-0">
					<DialogHeader className="px-6 py-4 border-b border-white/10 bg-white/5">
						<div className="flex items-start justify-between">
							<div>
								<DialogTitle className="text-xl font-bold text-white">
									{selectedPrompt?.prompt.title}
								</DialogTitle>
								<DialogDescription className="mt-1">
									Shared by {selectedPrompt?.sharedBy.email}
									{selectedPrompt?.sharedVia.type === "group" && (
										<> via <span className="text-purple-400">{selectedPrompt.sharedVia.group?.name}</span></>
									)}
								</DialogDescription>
							</div>
							<Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
								Read Only
							</Badge>
						</div>
					</DialogHeader>

					<ScrollArea className="flex-1 p-6">
						{selectedPrompt?.prompt.description && (
							<div className="mb-4">
								<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
									Description
								</h4>
								<p className="text-sm text-muted-foreground">
									{selectedPrompt.prompt.description}
								</p>
							</div>
						)}

						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Content
								</h4>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => selectedPrompt && handleCopy(selectedPrompt.prompt.content)}
								>
									<Copy className="h-4 w-4 mr-2" />
									Copy
								</Button>
							</div>
							<pre className="text-sm font-mono bg-black/30 rounded-xl p-4 whitespace-pre-wrap border border-white/5">
								{selectedPrompt?.prompt.content}
							</pre>
						</div>

						{selectedPrompt?.prompt.tags && selectedPrompt.prompt.tags.length > 0 && (
							<div>
								<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
									Tags
								</h4>
								<div className="flex flex-wrap gap-2">
									{selectedPrompt.prompt.tags.map((tag) => (
										<Badge
											key={tag.id}
											variant="outline"
											style={{
												backgroundColor: `${tag.color}15`,
												borderColor: `${tag.color}30`,
												color: tag.color,
											}}
										>
											{tag.name}
										</Badge>
									))}
								</div>
							</div>
						)}
					</ScrollArea>
				</DialogContent>
			</Dialog>
		</div>
	);
}
