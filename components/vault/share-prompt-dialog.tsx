"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Share2,
	Users,
	User,
	Loader2,
	X,
	Check,
	Mail,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Group {
	id: string;
	name: string;
	memberCount: number;
}

interface Share {
	id: string;
	sharedWithUser?: {
		id: string;
		email: string;
	};
	sharedWithGroup?: {
		id: string;
		name: string;
	};
	createdAt: Date;
}

interface SharePromptDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	promptId: string;
	promptTitle: string;
}

export function SharePromptDialog({
	open,
	onOpenChange,
	promptId,
	promptTitle,
}: SharePromptDialogProps) {
	const [activeTab, setActiveTab] = React.useState<"user" | "group">("user");
	const [email, setEmail] = React.useState("");
	const [isSharing, setIsSharing] = React.useState(false);
	const [groups, setGroups] = React.useState<Group[]>([]);
	const [shares, setShares] = React.useState<Share[]>([]);
	const [isLoadingGroups, setIsLoadingGroups] = React.useState(false);
	const [isLoadingShares, setIsLoadingShares] = React.useState(false);
	const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);

	// Fetch user's groups
	React.useEffect(() => {
		if (open) {
			fetchGroups();
			fetchShares();
		}
	}, [open, promptId]);

	const fetchGroups = async () => {
		setIsLoadingGroups(true);
		try {
			const res = await fetch("/api/groups");
			if (res.ok) {
				const data = await res.json();
				setGroups(data.groups);
			}
		} catch (error) {
			console.error("Failed to fetch groups:", error);
		} finally {
			setIsLoadingGroups(false);
		}
	};

	const fetchShares = async () => {
		setIsLoadingShares(true);
		try {
			const res = await fetch(`/api/prompts/${promptId}/share`);
			if (res.ok) {
				const data = await res.json();
				setShares(data.shares);
			}
		} catch (error) {
			console.error("Failed to fetch shares:", error);
		} finally {
			setIsLoadingShares(false);
		}
	};

	const handleShareWithUser = async () => {
		if (!email.trim()) {
			toast.error("Please enter an email address");
			return;
		}

		setIsSharing(true);
		try {
			const res = await fetch(`/api/prompts/${promptId}/share`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim() }),
			});

			if (res.ok) {
				toast.success("Prompt shared successfully");
				setEmail("");
				fetchShares();
			} else {
				const data = await res.json();
				toast.error(data.error || "Failed to share prompt");
			}
		} catch (error) {
			toast.error("Failed to share prompt");
		} finally {
			setIsSharing(false);
		}
	};

	const handleShareWithGroup = async (groupId: string) => {
		setSelectedGroupId(groupId);
		setIsSharing(true);
		try {
			const res = await fetch(`/api/prompts/${promptId}/share`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ groupId }),
			});

			if (res.ok) {
				toast.success("Prompt shared with group");
				fetchShares();
			} else {
				const data = await res.json();
				toast.error(data.error || "Failed to share prompt");
			}
		} catch (error) {
			toast.error("Failed to share prompt");
		} finally {
			setIsSharing(false);
			setSelectedGroupId(null);
		}
	};

	const handleRevokeShare = async (shareId: string) => {
		try {
			const res = await fetch(`/api/prompts/${promptId}/share/${shareId}`, {
				method: "DELETE",
			});

			if (res.ok) {
				toast.success("Share revoked");
				fetchShares();
			} else {
				toast.error("Failed to revoke share");
			}
		} catch (error) {
			toast.error("Failed to revoke share");
		}
	};

	// Check if already shared with a group
	const isSharedWithGroup = (groupId: string) => {
		return shares.some((s) => s.sharedWithGroup?.id === groupId);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg bg-zinc-950 border-white/10 p-0 gap-0">
				<DialogHeader className="px-6 py-4 border-b border-white/10 bg-white/5">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
							<Share2 className="h-5 w-5 text-indigo-400" />
						</div>
						<div>
							<DialogTitle className="text-lg font-semibold">Share Prompt</DialogTitle>
							<DialogDescription className="text-muted-foreground/80">
								Share "{promptTitle}" with others
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "user" | "group")} className="flex-1">
					<div className="px-6 pt-4">
						<TabsList className="grid w-full grid-cols-2 bg-white/5">
							<TabsTrigger value="user" className="data-[state=active]:bg-indigo-500">
								<User className="h-4 w-4 mr-2" />
								User
							</TabsTrigger>
							<TabsTrigger value="group" className="data-[state=active]:bg-indigo-500">
								<Users className="h-4 w-4 mr-2" />
								Group
							</TabsTrigger>
						</TabsList>
					</div>

					<div className="p-6">
						<TabsContent value="user" className="mt-0 space-y-4">
							<div className="space-y-2">
								<Label>Share with user by email</Label>
								<div className="flex gap-2">
									<div className="relative flex-1">
										<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											placeholder="user@example.com"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="pl-9"
											onKeyDown={(e) => e.key === "Enter" && handleShareWithUser()}
										/>
									</div>
									<Button
										onClick={handleShareWithUser}
										disabled={isSharing || !email.trim()}
									>
										{isSharing ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											"Share"
										)}
									</Button>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="group" className="mt-0 space-y-4">
							<Label>Share with a group</Label>
							{isLoadingGroups ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							) : groups.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
									<p className="text-sm">You're not in any groups yet</p>
									<Button variant="link" size="sm" className="mt-2" asChild>
										<a href="/groups">Create a group</a>
									</Button>
								</div>
							) : (
								<div className="space-y-2">
									{groups.map((group) => {
										const alreadyShared = isSharedWithGroup(group.id);
										return (
											<div
												key={group.id}
												className={cn(
													"flex items-center justify-between p-3 rounded-lg border transition-colors",
													alreadyShared
														? "border-green-500/30 bg-green-500/5"
														: "border-white/10 bg-white/5 hover:bg-white/10"
												)}
											>
												<div className="flex items-center gap-3">
													<div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
														<Users className="h-4 w-4 text-purple-400" />
													</div>
													<div>
														<p className="font-medium text-sm">{group.name}</p>
														<p className="text-xs text-muted-foreground">
															{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
														</p>
													</div>
												</div>
												{alreadyShared ? (
													<Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
														<Check className="h-3 w-3 mr-1" />
														Shared
													</Badge>
												) : (
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleShareWithGroup(group.id)}
														disabled={isSharing && selectedGroupId === group.id}
													>
														{isSharing && selectedGroupId === group.id ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															"Share"
														)}
													</Button>
												)}
											</div>
										);
									})}
								</div>
							)}
						</TabsContent>
					</div>
				</Tabs>

				{/* Current Shares */}
				{shares.length > 0 && (
					<div className="px-6 pb-6">
						<div className="border-t border-white/10 pt-4">
							<Label className="text-xs text-muted-foreground uppercase tracking-wider">
								Currently shared with
							</Label>
							<ScrollArea className="max-h-32 mt-2">
								<div className="space-y-2">
									{shares.map((share) => (
										<div
											key={share.id}
											className="flex items-center justify-between p-2 rounded-lg bg-white/5"
										>
											<div className="flex items-center gap-2">
												{share.sharedWithUser ? (
													<>
														<User className="h-4 w-4 text-indigo-400" />
														<span className="text-sm">{share.sharedWithUser.email}</span>
													</>
												) : (
													<>
														<Users className="h-4 w-4 text-purple-400" />
														<span className="text-sm">{share.sharedWithGroup?.name}</span>
													</>
												)}
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleRevokeShare(share.id)}
												className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							</ScrollArea>
						</div>
					</div>
				)}

				<DialogFooter className="px-6 py-4 border-t border-white/10 bg-white/5">
					<Button variant="ghost" onClick={() => onOpenChange(false)}>
						Done
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
