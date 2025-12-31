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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
	Share2,
	Users,
	User,
	Loader2,
	Mail,
	Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Group {
	id: string;
	name: string;
	memberCount: number;
}

interface ConnectedUser {
	id: string;
	email: string;
}

interface BulkShareDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedPromptIds: string[];
	onSuccess?: () => void;
}

export function BulkShareDialog({
	open,
	onOpenChange,
	selectedPromptIds,
	onSuccess,
}: BulkShareDialogProps) {
	const [activeTab, setActiveTab] = React.useState<"user" | "group">("user");
	const [email, setEmail] = React.useState("");
	const [isSharing, setIsSharing] = React.useState(false);
	const [groups, setGroups] = React.useState<Group[]>([]);
	const [connectedUsers, setConnectedUsers] = React.useState<ConnectedUser[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);
	const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);
	const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);

	// Fetch groups and connections
	React.useEffect(() => {
		if (open) {
			fetchData();
		}
	}, [open]);

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const [groupsRes, connectionsRes] = await Promise.all([
				fetch("/api/groups"),
				fetch("/api/user/connections"),
			]);

			if (groupsRes.ok) {
				const data = await groupsRes.json();
				setGroups(data.groups);
			}

			if (connectionsRes.ok) {
				const data = await connectionsRes.json();
				setConnectedUsers(data.connections);
			}
		} catch (error) {
			console.error("Failed to fetch data:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleShare = async (targetEmail?: string, targetGroupId?: string) => {
		if (!targetEmail && !targetGroupId && !email.trim()) {
			toast.error("Please enter an email or select a group");
			return;
		}

		setIsSharing(true);
		if (targetGroupId) {
			setSelectedGroupId(targetGroupId);
		} else if (targetEmail) {
			const user = connectedUsers.find(u => u.email === targetEmail);
			if (user) setSelectedUserId(user.id);
		}

		try {
			const body: { promptIds: string[]; email?: string; groupId?: string } = {
				promptIds: selectedPromptIds,
			};

			if (targetGroupId) {
				body.groupId = targetGroupId;
			} else {
				body.email = targetEmail || email.trim();
			}

			const res = await fetch("/api/prompts/share/bulk", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = await res.json();

			if (res.ok) {
				toast.success(`Shared ${data.sharedCount} prompt${data.sharedCount > 1 ? "s" : ""} successfully`);
				setEmail("");
				onOpenChange(false);
				onSuccess?.();
			} else {
				toast.error(data.error || "Failed to share prompts");
			}
		} catch (error) {
			toast.error("Failed to share prompts");
		} finally {
			setIsSharing(false);
			setSelectedGroupId(null);
			setSelectedUserId(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg p-0 gap-0">
				<DialogHeader className="px-6 py-4 border-b">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
							<Share2 className="h-5 w-5 text-indigo-500" />
						</div>
						<div>
							<DialogTitle className="text-lg font-semibold">Share Multiple Prompts</DialogTitle>
							<DialogDescription>
								Share {selectedPromptIds.length} selected prompt{selectedPromptIds.length > 1 ? "s" : ""}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "user" | "group")} className="flex-1">
					<div className="px-6 pt-4">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="user" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
								<User className="h-4 w-4 mr-2" />
								User
							</TabsTrigger>
							<TabsTrigger value="group" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
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
											onKeyDown={(e) => e.key === "Enter" && handleShare()}
										/>
									</div>
									<Button
										onClick={() => handleShare()}
										disabled={isSharing || !email.trim()}
									>
										{isSharing && !selectedUserId && !selectedGroupId ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											"Share"
										)}
									</Button>
								</div>
							</div>

							{/* Connected Users */}
							{connectedUsers.length > 0 && (
								<div className="space-y-2">
									<Label className="text-muted-foreground">Or share with a connection</Label>
									<ScrollArea className="h-[150px]">
										<div className="space-y-2">
											{connectedUsers.map((user) => (
												<div
													key={user.id}
													className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors"
												>
													<div className="flex items-center gap-3">
														<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
															<span className="text-xs font-medium text-primary">
																{user.email.charAt(0).toUpperCase()}
															</span>
														</div>
														<div>
															<p className="font-medium text-sm">{user.email}</p>
															<p className="text-xs text-muted-foreground">Connected</p>
														</div>
													</div>
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleShare(user.email)}
														disabled={isSharing && selectedUserId === user.id}
													>
														{isSharing && selectedUserId === user.id ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															"Share"
														)}
													</Button>
												</div>
											))}
										</div>
									</ScrollArea>
								</div>
							)}

							{isLoading && (
								<div className="flex items-center justify-center py-4">
									<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
								</div>
							)}
						</TabsContent>

						<TabsContent value="group" className="mt-0 space-y-4">
							<Label>Share with a group</Label>
							{isLoading ? (
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
								<ScrollArea className="h-[200px]">
									<div className="space-y-2">
										{groups.map((group) => (
											<div
												key={group.id}
												className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors"
											>
												<div className="flex items-center gap-3">
													<div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
														<Users className="h-4 w-4 text-purple-500" />
													</div>
													<div>
														<p className="font-medium text-sm">{group.name}</p>
														<p className="text-xs text-muted-foreground">
															{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
														</p>
													</div>
												</div>
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleShare(undefined, group.id)}
													disabled={isSharing && selectedGroupId === group.id}
												>
													{isSharing && selectedGroupId === group.id ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : (
														"Share"
													)}
												</Button>
											</div>
										))}
									</div>
								</ScrollArea>
							)}
						</TabsContent>
					</div>
				</Tabs>

				<DialogFooter className="px-6 py-4 border-t">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
