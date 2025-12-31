"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { SessionPayload } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/ui/logo";
import { Spinner } from "@/components/ui/spinner";
import {
	Users,
	Plus,
	MoreVertical,
	Trash2,
	Edit,
	UserPlus,
	UserMinus,
	ArrowLeft,
	Crown,
} from "lucide-react";
import { toast } from "sonner";

interface Group {
	id: string;
	name: string;
	description: string | null;
	creatorId: string;
	createdAt: string;
	memberCount?: number;
	members?: GroupMember[];
	currentUserRole?: "admin" | "member";
}

interface GroupMember {
	id: string;
	userId: string;
	email: string;
	role: "admin" | "member";
	joinedAt: string;
}

interface GroupsClientProps {
	session: SessionPayload;
}

export function GroupsClient({ session }: GroupsClientProps) {
	const router = useRouter();
	const [groups, setGroups] = React.useState<Group[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);
	const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(null);

	// Dialog states
	const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
	const [editDialogOpen, setEditDialogOpen] = React.useState(false);
	const [addMemberDialogOpen, setAddMemberDialogOpen] = React.useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

	// Form states
	const [groupName, setGroupName] = React.useState("");
	const [groupDescription, setGroupDescription] = React.useState("");
	const [memberEmail, setMemberEmail] = React.useState("");
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	// Fetch groups
	const fetchGroups = React.useCallback(async () => {
		try {
			const res = await fetch("/api/groups");
			if (res.ok) {
				const data = await res.json();
				setGroups(data.groups);
			}
		} catch (error) {
			console.error("Failed to fetch groups:", error);
			toast.error("Failed to load groups");
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Fetch group details with members
	const fetchGroupDetails = React.useCallback(async (groupId: string) => {
		try {
			const res = await fetch(`/api/groups/${groupId}`);
			if (res.ok) {
				const data = await res.json();
				setSelectedGroup(data.group);
			}
		} catch (error) {
			console.error("Failed to fetch group details:", error);
		}
	}, []);

	React.useEffect(() => {
		fetchGroups();
	}, [fetchGroups]);

	// Create group
	const handleCreateGroup = async () => {
		if (!groupName.trim()) return;

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/groups", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: groupName.trim(),
					description: groupDescription.trim() || undefined,
				}),
			});

			if (res.ok) {
				toast.success("Group created");
				setCreateDialogOpen(false);
				setGroupName("");
				setGroupDescription("");
				fetchGroups();
			} else {
				const data = await res.json();
				toast.error(data.error || "Failed to create group");
			}
		} catch (error) {
			toast.error("Failed to create group");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Update group
	const handleUpdateGroup = async () => {
		if (!selectedGroup || !groupName.trim()) return;

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/groups/${selectedGroup.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: groupName.trim(),
					description: groupDescription.trim() || null,
				}),
			});

			if (res.ok) {
				toast.success("Group updated");
				setEditDialogOpen(false);
				fetchGroups();
				if (selectedGroup) {
					fetchGroupDetails(selectedGroup.id);
				}
			} else {
				const data = await res.json();
				toast.error(data.error || "Failed to update group");
			}
		} catch (error) {
			toast.error("Failed to update group");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Delete group
	const handleDeleteGroup = async () => {
		if (!selectedGroup) return;

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/groups/${selectedGroup.id}`, {
				method: "DELETE",
			});

			if (res.ok) {
				toast.success("Group deleted");
				setDeleteDialogOpen(false);
				setSelectedGroup(null);
				fetchGroups();
			} else {
				const data = await res.json();
				toast.error(data.error || "Failed to delete group");
			}
		} catch (error) {
			toast.error("Failed to delete group");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Add member
	const handleAddMember = async () => {
		if (!selectedGroup || !memberEmail.trim()) return;

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/groups/${selectedGroup.id}/members`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: memberEmail.trim() }),
			});

			if (res.ok) {
				toast.success("Member added");
				setAddMemberDialogOpen(false);
				setMemberEmail("");
				fetchGroupDetails(selectedGroup.id);
			} else {
				const data = await res.json();
				toast.error(data.error || "Failed to add member");
			}
		} catch (error) {
			toast.error("Failed to add member");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Remove member
	const handleRemoveMember = async (userId: string) => {
		if (!selectedGroup) return;

		try {
			const res = await fetch(`/api/groups/${selectedGroup.id}/members/${userId}`, {
				method: "DELETE",
			});

			if (res.ok) {
				toast.success("Member removed");
				fetchGroupDetails(selectedGroup.id);
			} else {
				const data = await res.json();
				toast.error(data.error || "Failed to remove member");
			}
		} catch (error) {
			toast.error("Failed to remove member");
		}
	};

	const isGroupOwner = (group: Group) => group.creatorId === session.userId || group.currentUserRole === "admin";

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			{/* Header */}
			<header className="sticky top-0 z-40 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
				<div className="container flex h-16 items-center justify-between px-4 max-w-6xl mx-auto">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => router.push("/dashboard")}
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back
						</Button>
						<Separator orientation="vertical" className="h-6" />
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							<span className="font-medium">Groups</span>
						</div>
					</div>

					<Button onClick={() => setCreateDialogOpen(true)} size="sm">
						<Plus className="h-4 w-4 mr-2" />
						Create Group
					</Button>
				</div>
			</header>

			{/* Main Content */}
			<main className="container px-4 py-6 max-w-6xl mx-auto">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Groups List */}
					<div className="lg:col-span-1">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Your Groups</CardTitle>
								<CardDescription>
									Groups you own or are a member of
								</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoading ? (
									<div className="flex items-center justify-center py-8">
										<Spinner className="h-6 w-6" />
									</div>
								) : groups.length === 0 ? (
									<div className="text-center py-8">
										<Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
										<p className="mt-2 text-sm text-muted-foreground">
											No groups yet
										</p>
										<Button
											variant="outline"
											size="sm"
											className="mt-4"
											onClick={() => setCreateDialogOpen(true)}
										>
											<Plus className="h-4 w-4 mr-2" />
											Create your first group
										</Button>
									</div>
								) : (
									<div className="space-y-2">
										{groups.map((group) => (
											<div
												key={group.id}
												className={`p-3 rounded-lg border cursor-pointer transition-colors ${
													selectedGroup?.id === group.id
														? "border-primary bg-primary/5"
														: "hover:bg-muted/50"
												}`}
												onClick={() => fetchGroupDetails(group.id)}
											>
												<div className="flex items-start justify-between">
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2">
															<span className="font-medium text-sm truncate">
																{group.name}
															</span>
															{isGroupOwner(group) && (
																<Badge variant="secondary" className="text-[10px]">
																	<Crown className="h-3 w-3 mr-1" />
																	Owner
																</Badge>
															)}
														</div>
														{group.description && (
															<p className="text-xs text-muted-foreground truncate mt-0.5">
																{group.description}
															</p>
														)}
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Group Details */}
					<div className="lg:col-span-2">
						{selectedGroup ? (
							<Card>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div>
											<CardTitle className="flex items-center gap-2">
												{selectedGroup.name}
												{isGroupOwner(selectedGroup) && (
													<Badge variant="secondary" className="text-xs">
														<Crown className="h-3 w-3 mr-1" />
														Owner
													</Badge>
												)}
											</CardTitle>
											{selectedGroup.description && (
												<CardDescription className="mt-1">
													{selectedGroup.description}
												</CardDescription>
											)}
										</div>
										{isGroupOwner(selectedGroup) && (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm">
														<MoreVertical className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => {
															setGroupName(selectedGroup.name);
															setGroupDescription(selectedGroup.description || "");
															setEditDialogOpen(true);
														}}
													>
														<Edit className="h-4 w-4 mr-2" />
														Edit Group
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => setDeleteDialogOpen(true)}
														className="text-destructive"
													>
														<Trash2 className="h-4 w-4 mr-2" />
														Delete Group
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										)}
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-sm font-medium">
											Members ({selectedGroup.members?.length || 0})
										</h3>
										{isGroupOwner(selectedGroup) && (
											<Button
												size="sm"
												variant="outline"
												onClick={() => setAddMemberDialogOpen(true)}
											>
												<UserPlus className="h-4 w-4 mr-2" />
												Add Member
											</Button>
										)}
									</div>

									<ScrollArea className="h-[400px]">
										{selectedGroup.members && selectedGroup.members.length > 0 ? (
											<div className="space-y-2">
												{selectedGroup.members.map((member) => (
													<div
														key={member.id}
														className="flex items-center justify-between p-3 rounded-lg border"
													>
														<div className="flex items-center gap-3">
															<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
																<span className="text-xs font-medium text-primary">
																	{(member.email || "?").charAt(0).toUpperCase()}
																</span>
															</div>
															<div>
																<p className="text-sm font-medium">
																	{member.email || "Unknown"}
																</p>
																<p className="text-xs text-muted-foreground">
																	{member.role === "admin" ? "Admin" : "Member"} •{" "}
																	Joined {new Date(member.joinedAt).toLocaleDateString()}
																</p>
															</div>
														</div>
														{isGroupOwner(selectedGroup) && member.userId !== session.userId && (
															<Button
																size="sm"
																variant="ghost"
																onClick={() => handleRemoveMember(member.userId)}
															>
																<UserMinus className="h-4 w-4 text-destructive" />
															</Button>
														)}
													</div>
												))}
											</div>
										) : (
											<div className="text-center py-8">
												<p className="text-sm text-muted-foreground">
													No members yet. Add members to share prompts with them.
												</p>
											</div>
										)}
									</ScrollArea>
								</CardContent>
							</Card>
						) : (
							<Card>
								<CardContent className="flex flex-col items-center justify-center py-16">
									<Users className="h-12 w-12 text-muted-foreground/30" />
									<p className="mt-4 text-muted-foreground">
										Select a group to view details
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</main>

			{/* Create Group Dialog */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Create Group</DialogTitle>
						<DialogDescription>
							Create a new group to share prompts with multiple users
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">Group Name</Label>
							<Input
								id="name"
								placeholder="My Team"
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Description (optional)</Label>
							<Input
								id="description"
								placeholder="A group for my team's prompts"
								value={groupDescription}
								onChange={(e) => setGroupDescription(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleCreateGroup} disabled={isSubmitting || !groupName.trim()}>
							{isSubmitting && <Spinner className="h-4 w-4 mr-2" />}
							Create
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Group Dialog */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Edit Group</DialogTitle>
						<DialogDescription>
							Update the group's name and description
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="edit-name">Group Name</Label>
							<Input
								id="edit-name"
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-description">Description</Label>
							<Input
								id="edit-description"
								value={groupDescription}
								onChange={(e) => setGroupDescription(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleUpdateGroup} disabled={isSubmitting || !groupName.trim()}>
							{isSubmitting && <Spinner className="h-4 w-4 mr-2" />}
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Add Member Dialog */}
			<Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Add Member</DialogTitle>
						<DialogDescription>
							Add a user to this group by their email address
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="member-email">Email Address</Label>
							<Input
								id="member-email"
								type="email"
								placeholder="user@example.com"
								value={memberEmail}
								onChange={(e) => setMemberEmail(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleAddMember} disabled={isSubmitting || !memberEmail.trim()}>
							{isSubmitting && <Spinner className="h-4 w-4 mr-2" />}
							Add
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Group Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Group</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{selectedGroup?.name}"? This action cannot be
							undone. All shared prompts in this group will be unshared.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDeleteGroup} disabled={isSubmitting}>
							{isSubmitting && <Spinner className="h-4 w-4 mr-2" />}
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
