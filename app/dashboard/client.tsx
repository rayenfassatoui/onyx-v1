"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { SessionPayload } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Search, Settings, ArrowUpDown, Keyboard, Download, Users, Share2, Link2, Copy, Check, CheckSquare, Square, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { PromptCard } from "@/components/vault/prompt-card";
import { PromptEditor } from "@/components/vault/prompt-editor";
import { PromptViewer } from "@/components/vault/prompt-viewer";
import { DeleteConfirmDialog } from "@/components/vault/delete-confirm-dialog";
import { TagRail } from "@/components/vault/tag-rail";
import { VaultSettings } from "@/components/vault/vault-settings";
import { KeyboardShortcuts } from "@/components/vault/keyboard-shortcuts";
import { ImportDialog } from "@/components/vault/import-dialog";
import { VersionHistory } from "@/components/vault/version-history";
import { AISuggestions } from "@/components/vault/ai-suggestions";
import { SharePromptDialog } from "@/components/vault/share-prompt-dialog";
import { BulkShareDialog } from "@/components/vault/bulk-share-dialog";
import { NotificationBell } from "@/components/vault/notification-bell";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AnimatePresence } from "motion/react";
import { Logo } from "@/components/ui/logo";

interface Tag {
	id: string;
	name: string;
	color: string;
}

interface Prompt {
	id: string;
	title: string;
	description: string;
	content: string;
	tags: Tag[];
	createdAt: Date;
	updatedAt: Date;
	versionCount?: number;
	// For shared prompts
	isShared?: boolean;
	sharedBy?: {
		id: string;
		email: string;
	};
	sharedByGroup?: {
		id: string;
		name: string;
	};
}

interface DashboardClientProps {
	session: SessionPayload;
}

export function DashboardClient({ session }: DashboardClientProps) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = React.useState("");
	const [sortBy, setSortBy] = React.useState<"updatedAt" | "createdAt">("updatedAt");
	const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
	
	// Data state
	const [prompts, setPrompts] = React.useState<Prompt[]>([]);
	const [tags, setTags] = React.useState<Tag[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);
	
	// Dialog state
	const [editorOpen, setEditorOpen] = React.useState(false);
	const [editingPrompt, setEditingPrompt] = React.useState<Prompt | undefined>();
	const [viewerOpen, setViewerOpen] = React.useState(false);
	const [viewingPrompt, setViewingPrompt] = React.useState<Prompt | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
	const [deletingPromptId, setDeletingPromptId] = React.useState<string | null>(null);
	const [isDeleting, setIsDeleting] = React.useState(false);
	
	// New dialog states
	const [settingsOpen, setSettingsOpen] = React.useState(false);
	const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
	const [importOpen, setImportOpen] = React.useState(false);
	const [versionHistoryOpen, setVersionHistoryOpen] = React.useState(false);
	const [aiSuggestionsOpen, setAiSuggestionsOpen] = React.useState(false);
	const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
	const [selectedPromptForHistory, setSelectedPromptForHistory] = React.useState<Prompt | null>(null);
	const [selectedPromptForAI, setSelectedPromptForAI] = React.useState<Prompt | null>(null);
	const [selectedPromptForShare, setSelectedPromptForShare] = React.useState<Prompt | null>(null);
	
	// User invite link states
	const [userInviteDialogOpen, setUserInviteDialogOpen] = React.useState(false);
	const [userInviteLink, setUserInviteLink] = React.useState<string | null>(null);
	const [userInviteExpiry, setUserInviteExpiry] = React.useState<string>("7d");
	const [userInviteMaxUses, setUserInviteMaxUses] = React.useState<string>("unlimited");
	const [isCreatingUserInvite, setIsCreatingUserInvite] = React.useState(false);
	const [userInviteLinkCopied, setUserInviteLinkCopied] = React.useState(false);
	
	// Multi-select state
	const [isMultiSelectMode, setIsMultiSelectMode] = React.useState(false);
	const [selectedPromptIds, setSelectedPromptIds] = React.useState<Set<string>>(new Set());
	const [bulkShareDialogOpen, setBulkShareDialogOpen] = React.useState(false);
	
	// Shared prompts
	const [sharedPrompts, setSharedPrompts] = React.useState<Prompt[]>([]);
	
	// Keyboard navigation
	const [selectedIndex, setSelectedIndex] = React.useState(-1);
	const searchInputRef = React.useRef<HTMLInputElement>(null);

	// Fetch data
	const fetchData = React.useCallback(async () => {
		try {
			const [promptsRes, tagsRes, sharedRes] = await Promise.all([
				fetch(`/api/prompts?sortBy=${sortBy}`),
				fetch("/api/tags"),
				fetch("/api/shared"),
			]);

			if (promptsRes.ok) {
				const data = await promptsRes.json();
				setPrompts(data.prompts);
			}

			if (tagsRes.ok) {
				const data = await tagsRes.json();
				setTags(data.tags);
			}

			if (sharedRes.ok) {
				const data = await sharedRes.json();
				// Transform shared prompts to include sharing info
				const transformedShared: Prompt[] = (data.sharedPrompts || []).map((sp: any) => ({
					id: sp.prompt.id,
					title: sp.prompt.title,
					description: sp.prompt.description || "",
					content: sp.prompt.content,
					tags: sp.prompt.tags || [],
					createdAt: sp.prompt.createdAt,
					updatedAt: sp.prompt.updatedAt,
					isShared: true,
					sharedBy: sp.sharedBy ? { id: sp.sharedBy.id, email: sp.sharedBy.email } : undefined,
					sharedByGroup: sp.sharedVia?.type === "group" && sp.sharedVia.group 
						? { id: sp.sharedVia.group.id, name: sp.sharedVia.group.name } 
						: undefined,
				}));
				setSharedPrompts(transformedShared);
			}
		} catch (error) {
			console.error("Failed to fetch data:", error);
			toast.error("Failed to load data");
		} finally {
			setIsLoading(false);
		}
	}, [sortBy]);

	React.useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Check for pending invite after login
	React.useEffect(() => {
		const pendingInvite = sessionStorage.getItem("pendingInvite");
		if (pendingInvite) {
			sessionStorage.removeItem("pendingInvite");
			router.push(`/invite/${pendingInvite}`);
			return;
		}
		
		const pendingUserInvite = sessionStorage.getItem("pendingUserInvite");
		if (pendingUserInvite) {
			sessionStorage.removeItem("pendingUserInvite");
			router.push(`/invite/user/${pendingUserInvite}`);
		}
	}, [router]);

	// Combine own prompts with shared prompts
	const allPrompts = React.useMemo(() => {
		return [...prompts, ...sharedPrompts];
	}, [prompts, sharedPrompts]);

	// Filter prompts
	const filteredPrompts = React.useMemo(() => {
		let filtered = allPrompts;

		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(p) =>
					p.title.toLowerCase().includes(query) ||
					p.content.toLowerCase().includes(query) ||
					p.description?.toLowerCase().includes(query) ||
					p.tags.some((t) => t.name.toLowerCase().includes(query))
			);
		}

		// Tag filter
		if (selectedTagIds.length > 0) {
			filtered = filtered.filter((p) =>
				p.tags.some((t) => selectedTagIds.includes(t.id))
			);
		}

		return filtered;
	}, [allPrompts, searchQuery, selectedTagIds]);

	// Separate own and shared prompts for display
	const ownFilteredPrompts = React.useMemo(() => {
		return filteredPrompts.filter(p => !p.isShared);
	}, [filteredPrompts]);

	const sharedFilteredPrompts = React.useMemo(() => {
		return filteredPrompts.filter(p => p.isShared);
	}, [filteredPrompts]);

	// Handlers
	const handleLogout = async () => {
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/");
	};

	const handleCreatePrompt = () => {
		setEditingPrompt(undefined);
		setEditorOpen(true);
	};

	const handleEditPrompt = (id: string) => {
		const prompt = prompts.find((p) => p.id === id);
		if (prompt) {
			setEditingPrompt(prompt);
			setEditorOpen(true);
		}
	};

	const handleViewPrompt = async (id: string) => {
		// First check if we already have the prompt data (including shared prompts)
		const existingPrompt = allPrompts.find(p => p.id === id);
		if (existingPrompt) {
			setViewingPrompt(existingPrompt);
			setViewerOpen(true);
			return;
		}

		// Fallback to fetching from API
		try {
			const res = await fetch(`/api/prompts/${id}`);
			if (res.ok) {
				const data = await res.json();
				setViewingPrompt(data.prompt);
				setViewerOpen(true);
			}
		} catch (error) {
			console.error("Failed to fetch prompt:", error);
			toast.error("Failed to load prompt");
		}
	};

	const handleDeletePrompt = (id: string) => {
		setDeletingPromptId(id);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!deletingPromptId) return;

		setIsDeleting(true);
		try {
			const res = await fetch(`/api/prompts/${deletingPromptId}`, {
				method: "DELETE",
			});

			if (res.ok) {
				toast.success("Prompt deleted");
				fetchData();
			} else {
				toast.error("Failed to delete prompt");
			}
		} catch (error) {
			console.error("Delete error:", error);
			toast.error("Failed to delete prompt");
		} finally {
			setIsDeleting(false);
			setDeletingPromptId(null);
		}
	};

	const handleSavePrompt = async (data: {
		title: string;
		description: string;
		content: string;
		tagIds: string[];
	}) => {
		const url = editingPrompt
			? `/api/prompts/${editingPrompt.id}`
			: "/api/prompts";
		const method = editingPrompt ? "PATCH" : "POST";

		const res = await fetch(url, {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});

		if (!res.ok) {
			throw new Error("Failed to save prompt");
		}

		fetchData();
	};

	const handleCreateTag = async (name: string): Promise<Tag> => {
		const res = await fetch("/api/tags", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name }),
		});

		if (!res.ok) {
			throw new Error("Failed to create tag");
		}

		const data = await res.json();
		setTags((prev) => [...prev, data.tag]);
		return data.tag;
	};

	const handleTagToggle = (tagId: string) => {
		setSelectedTagIds((prev) =>
			prev.includes(tagId)
				? prev.filter((id) => id !== tagId)
				: [...prev, tagId]
		);
	};

	// Export handler
	const handleExport = async (format: "json" | "markdown") => {
		try {
			const res = await fetch(`/api/prompts/export?format=${format}`);
			if (res.ok) {
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `onyx-vault-${Date.now()}.${format === "json" ? "json" : "md"}`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				toast.success(`Exported as ${format.toUpperCase()}`);
			} else {
				toast.error("Export failed");
			}
		} catch (error) {
			toast.error("Export failed");
		}
	};

	// Version history handler
	const handleOpenVersionHistory = (prompt: Prompt) => {
		setSelectedPromptForHistory(prompt);
		setVersionHistoryOpen(true);
	};

	// AI suggestions handler
	const handleOpenAISuggestions = (prompt: Prompt) => {
		setSelectedPromptForAI(prompt);
		setAiSuggestionsOpen(true);
	};

	// Share prompt handler
	const handleOpenShare = (prompt: Prompt) => {
		setSelectedPromptForShare(prompt);
		setShareDialogOpen(true);
	};

	// Create user invite link
	const handleCreateUserInviteLink = async () => {
		setIsCreatingUserInvite(true);
		try {
			const body: { expiresIn?: string; maxUses?: number } = {};
			if (userInviteExpiry !== "never") {
				body.expiresIn = userInviteExpiry;
			}
			if (userInviteMaxUses !== "unlimited") {
				body.maxUses = parseInt(userInviteMaxUses);
			}

			const res = await fetch("/api/user/invite", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (res.ok) {
				const data = await res.json();
				const fullLink = `${window.location.origin}/invite/user/${data.invite.token}`;
				setUserInviteLink(fullLink);
			} else {
				const data = await res.json();
				toast.error(data.error || "Failed to create invite link");
			}
		} catch {
			toast.error("Failed to create invite link");
		} finally {
			setIsCreatingUserInvite(false);
		}
	};

	// Copy user invite link
	const handleCopyUserInviteLink = async () => {
		if (!userInviteLink) return;

		try {
			await navigator.clipboard.writeText(userInviteLink);
			setUserInviteLinkCopied(true);
			toast.success("Invite link copied!");
			setTimeout(() => setUserInviteLinkCopied(false), 2000);
		} catch {
			toast.error("Failed to copy link");
		}
	};

	// Multi-select handlers
	const toggleMultiSelectMode = () => {
		setIsMultiSelectMode(!isMultiSelectMode);
		setSelectedPromptIds(new Set());
	};

	const togglePromptSelection = (promptId: string) => {
		const newSelection = new Set(selectedPromptIds);
		if (newSelection.has(promptId)) {
			newSelection.delete(promptId);
		} else {
			newSelection.add(promptId);
		}
		setSelectedPromptIds(newSelection);
	};

	const selectAllPrompts = () => {
		const allIds = new Set(filteredPrompts.filter(p => !p.isShared).map(p => p.id));
		setSelectedPromptIds(allIds);
	};

	const clearSelection = () => {
		setSelectedPromptIds(new Set());
	};

	const handleBulkShare = () => {
		if (selectedPromptIds.size === 0) {
			toast.error("Select at least one prompt to share");
			return;
		}
		setBulkShareDialogOpen(true);
	};

	// Apply AI variant
	const handleApplyVariant = async (content: string) => {
		if (selectedPromptForAI) {
			const res = await fetch(`/api/prompts/${selectedPromptForAI.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content }),
			});
			if (res.ok) {
				toast.success("Variant applied and saved");
				fetchData();
			}
		}
	};

	// Keyboard navigation
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if typing in input
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				if (e.key === "Escape") {
					(e.target as HTMLElement).blur();
					setSelectedIndex(-1);
				}
				return;
			}

			switch (e.key) {
				case "/":
					e.preventDefault();
					searchInputRef.current?.focus();
					break;
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) =>
						prev < filteredPrompts.length - 1 ? prev + 1 : prev
					);
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
					break;
				case "Enter":
					if (selectedIndex >= 0 && filteredPrompts[selectedIndex]) {
						handleViewPrompt(filteredPrompts[selectedIndex].id);
					}
					break;
				case "Escape":
					setSelectedIndex(-1);
					break;
				case "n":
					if (e.metaKey || e.ctrlKey) {
						e.preventDefault();
						handleCreatePrompt();
					}
					break;
				case "e":
					if ((e.metaKey || e.ctrlKey) && selectedIndex >= 0) {
						e.preventDefault();
						handleEditPrompt(filteredPrompts[selectedIndex].id);
					}
					break;
				case "s":
				case "S":
					if ((e.metaKey || e.ctrlKey) && e.shiftKey && selectedIndex >= 0) {
						e.preventDefault();
						handleOpenShare(filteredPrompts[selectedIndex]);
					}
					break;
				case ",":
					if (e.metaKey || e.ctrlKey) {
						e.preventDefault();
						setSettingsOpen(true);
					}
					break;
				case "?":
					e.preventDefault();
					setShortcutsOpen(true);
					break;
				case "g":
				case "G":
					if (!e.metaKey && !e.ctrlKey) {
						e.preventDefault();
						router.push("/groups");
					}
					break;
				case "i":
				case "I":
					if (!e.metaKey && !e.ctrlKey) {
						e.preventDefault();
						setUserInviteLink(null);
						setUserInviteDialogOpen(true);
					}
					break;
				case "m":
				case "M":
					if (!e.metaKey && !e.ctrlKey) {
						e.preventDefault();
						toggleMultiSelectMode();
					}
					break;
				case "Delete":
				case "Backspace":
					if (selectedIndex >= 0 && !e.metaKey && !e.ctrlKey) {
						handleDeletePrompt(filteredPrompts[selectedIndex].id);
					}
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [filteredPrompts, selectedIndex]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			{/* Header */}
			<header className="sticky top-0 z-40 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
				<div className="container flex h-16 items-center justify-between px-4 max-w-6xl mx-auto">
					<div className="flex items-center gap-4">
						<Logo className="h-8 w-8" textClassName="text-lg tracking-[0.25em]" />
					</div>

					<div className="flex items-center gap-2">
						{/* Search */}
						<div className="relative hidden md:block">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								ref={searchInputRef}
								placeholder="Search prompts... (/)"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-64 pl-9"
							/>
						</div>

						{/* Sort */}
						<Tooltip>
							<TooltipTrigger asChild>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm">
											<ArrowUpDown className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => setSortBy("updatedAt")}>
											Last Updated {sortBy === "updatedAt" && "✓"}
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => setSortBy("createdAt")}>
											Created Date {sortBy === "createdAt" && "✓"}
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TooltipTrigger>
							<TooltipContent>Sort prompts</TooltipContent>
						</Tooltip>

						{/* Export */}
						<Tooltip>
							<TooltipTrigger asChild>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm">
											<Download className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => handleExport("json")}>
											Export as JSON
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => handleExport("markdown")}>
											Export as Markdown
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={() => setImportOpen(true)}>
											Import Prompts...
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TooltipTrigger>
							<TooltipContent>Export & Import</TooltipContent>
						</Tooltip>

						{/* Keyboard Shortcuts */}
						<Tooltip>
							<TooltipTrigger asChild>
								<Button size="sm" variant="ghost" onClick={() => setShortcutsOpen(true)}>
									<Keyboard className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Keyboard shortcuts (?)</TooltipContent>
						</Tooltip>

						{/* Groups */}
						<Tooltip>
							<TooltipTrigger asChild>
								<Button size="sm" variant="ghost" onClick={() => router.push("/groups")}>
									<Users className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Groups</TooltipContent>
						</Tooltip>

						{/* Invite Link */}
						<Tooltip>
							<TooltipTrigger asChild>
								<Button 
									size="sm" 
									variant="ghost" 
									onClick={() => {
										setUserInviteLink(null);
										setUserInviteExpiry("7d");
										setUserInviteMaxUses("unlimited");
										setUserInviteDialogOpen(true);
									}}
								>
									<Link2 className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Create invite link</TooltipContent>
						</Tooltip>

						{/* Notifications */}
						<Tooltip>
							<TooltipTrigger asChild>
								<NotificationBell />
							</TooltipTrigger>
							<TooltipContent>Notifications</TooltipContent>
						</Tooltip>

						{/* Settings */}
						<Tooltip>
							<TooltipTrigger asChild>
								<Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)}>
									<Settings className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Settings (⌘,)</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button size="sm" variant="ghost" onClick={handleLogout}>
									<LogOut className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Log out</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container px-4 py-6 max-w-6xl mx-auto">
				{/* Mobile Search */}
				<div className="mb-4 md:hidden">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search prompts..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 bg-muted/50"
						/>
					</div>
				</div>

				{/* Tag Rail */}
				{tags.length > 0 && (
					<div className="mb-4">
						<TagRail
							tags={tags}
							selectedTagIds={selectedTagIds}
							onTagToggle={handleTagToggle}
							onClearAll={() => setSelectedTagIds([])}
						/>
					</div>
				)}

				{/* Create Button and Multi-Select Controls */}
				<div className="mb-4 flex justify-between items-center">
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">
							{ownFilteredPrompts.length} prompt{ownFilteredPrompts.length !== 1 ? "s" : ""}
							{sharedFilteredPrompts.length > 0 && ` • ${sharedFilteredPrompts.length} shared`}
						</span>
						{isMultiSelectMode && selectedPromptIds.size > 0 && (
							<span className="text-sm font-medium text-primary">
								({selectedPromptIds.size} selected)
							</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						{isMultiSelectMode ? (
							<>
								<Button variant="outline" size="sm" onClick={selectAllPrompts}>
									<CheckSquare className="mr-1.5 h-4 w-4" />
									Select All
								</Button>
								<Button 
									size="sm" 
									onClick={handleBulkShare}
									disabled={selectedPromptIds.size === 0}
								>
									<Share2 className="mr-1.5 h-4 w-4" />
									Share ({selectedPromptIds.size})
								</Button>
								<Button variant="ghost" size="sm" onClick={toggleMultiSelectMode}>
									<X className="h-4 w-4" />
								</Button>
							</>
						) : (
							<>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button variant="outline" size="sm" onClick={toggleMultiSelectMode}>
											<CheckSquare className="mr-1.5 h-4 w-4" />
											Select
										</Button>
									</TooltipTrigger>
									<TooltipContent>Multi-select prompts (M)</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button onClick={handleCreatePrompt} size="sm">
											<Plus className="mr-1.5 h-4 w-4" />
											Create Prompt
										</Button>
									</TooltipTrigger>
									<TooltipContent>Create new prompt (⌘N)</TooltipContent>
								</Tooltip>
							</>
						)}
					</div>
				</div>

				{/* Prompt Grid or Empty State */}
				{isLoading ? (
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{[...Array(8)].map((_, i) => (
							<div
								key={i}
								className="h-40 animate-pulse rounded-lg bg-muted/50 border"
							/>
						))}
					</div>
				) : ownFilteredPrompts.length > 0 || sharedFilteredPrompts.length > 0 ? (
					<div className="space-y-8">
						{/* Own Prompts Section */}
						{ownFilteredPrompts.length > 0 && (
							<div>
								{sharedFilteredPrompts.length > 0 && (
									<h3 className="text-sm font-medium text-muted-foreground mb-3">Your Prompts</h3>
								)}
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									<AnimatePresence>
										{ownFilteredPrompts.map((prompt, index) => (
											<div key={prompt.id} className="relative">
												{isMultiSelectMode && (
													<div 
														className="absolute top-2 left-2 z-10 cursor-pointer"
														onClick={(e) => {
															e.stopPropagation();
															togglePromptSelection(prompt.id);
														}}
													>
														{selectedPromptIds.has(prompt.id) ? (
															<div className="h-5 w-5 rounded bg-primary flex items-center justify-center">
																<Check className="h-3 w-3 text-primary-foreground" />
															</div>
														) : (
															<div className="h-5 w-5 rounded border-2 border-muted-foreground/50 bg-background/80" />
														)}
													</div>
												)}
												<PromptCard
													{...prompt}
													isSelected={index === selectedIndex}
													onClick={isMultiSelectMode ? () => togglePromptSelection(prompt.id) : handleViewPrompt}
													onEdit={handleEditPrompt}
													onDelete={handleDeletePrompt}
													onHistory={() => handleOpenVersionHistory(prompt)}
													onAI={() => handleOpenAISuggestions(prompt)}
													onShare={() => handleOpenShare(prompt)}
												/>
											</div>
										))}
									</AnimatePresence>
								</div>
							</div>
						)}

						{/* Shared Prompts Section */}
						{sharedFilteredPrompts.length > 0 && (
							<div>
								<h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
									<Share2 className="h-4 w-4" />
									Shared with you
								</h3>
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									<AnimatePresence>
										{sharedFilteredPrompts.map((prompt, index) => (
											<PromptCard
												key={prompt.id}
												{...prompt}
												isSelected={false}
												sharedByLabel={
													prompt.sharedByGroup 
														? `via ${prompt.sharedByGroup.name}`
														: `by ${prompt.sharedBy?.email?.split("@")[0] || "someone"}`
												}
												onClick={handleViewPrompt}
												onEdit={undefined}
												onDelete={undefined}
												onHistory={undefined}
												onAI={undefined}
												onShare={undefined}
											/>
										))}
									</AnimatePresence>
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-20">
						<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 border border-dashed">
							<Plus className="h-8 w-8 text-muted-foreground/50" />
						</div>
						<h2 className="mt-4 text-lg font-medium">No prompts yet</h2>
						<p className="mt-1 text-sm text-center text-muted-foreground">
							Create your first prompt template to get started.
						</p>
						<Button className="mt-6" onClick={handleCreatePrompt}>
							<Plus className="mr-2 h-4 w-4" />
							Create Prompt
						</Button>
					</div>
				)}
			</main>

			{/* Dialogs */}
			<PromptEditor
				open={editorOpen}
				onOpenChange={setEditorOpen}
				prompt={editingPrompt}
				availableTags={tags}
				onSave={handleSavePrompt}
				onCreateTag={handleCreateTag}
			/>

			<PromptViewer
				open={viewerOpen}
				onOpenChange={setViewerOpen}
				prompt={viewingPrompt}
				onEdit={viewingPrompt?.isShared ? undefined : () => {
					setViewerOpen(false);
					if (viewingPrompt) {
						handleEditPrompt(viewingPrompt.id);
					}
				}}
			/>

			<DeleteConfirmDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={confirmDelete}
				isLoading={isDeleting}
			/>

			<VaultSettings
				open={settingsOpen}
				onOpenChange={setSettingsOpen}
				userEmail={session.email}
				onExport={handleExport}
				onImport={() => {
					setSettingsOpen(false);
					setImportOpen(true);
				}}
				onLogout={handleLogout}
			/>

			<KeyboardShortcuts
				open={shortcutsOpen}
				onOpenChange={setShortcutsOpen}
			/>

			<ImportDialog
				open={importOpen}
				onOpenChange={setImportOpen}
				onSuccess={fetchData}
			/>

			{selectedPromptForHistory && (
				<VersionHistory
					open={versionHistoryOpen}
					onOpenChange={setVersionHistoryOpen}
					promptId={selectedPromptForHistory.id}
					promptTitle={selectedPromptForHistory.title}
					currentContent={selectedPromptForHistory.content}
					onRestore={fetchData}
				/>
			)}

			{selectedPromptForAI && (
				<AISuggestions
					open={aiSuggestionsOpen}
					onOpenChange={setAiSuggestionsOpen}
					promptId={selectedPromptForAI.id}
					promptTitle={selectedPromptForAI.title}
					promptContent={selectedPromptForAI.content}
					onApplyVariant={handleApplyVariant}
				/>
			)}

			{selectedPromptForShare && (
				<SharePromptDialog
					open={shareDialogOpen}
					onOpenChange={setShareDialogOpen}
					promptId={selectedPromptForShare.id}
					promptTitle={selectedPromptForShare.title}
				/>
			)}

			{/* User Invite Link Dialog */}
			<Dialog open={userInviteDialogOpen} onOpenChange={setUserInviteDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Create Invite Link</DialogTitle>
						<DialogDescription>
							Generate a shareable link to connect with other users. Connected users can share prompts directly with each other.
						</DialogDescription>
					</DialogHeader>
					
					{!userInviteLink ? (
						<>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="invite-expiry">Link Expires</Label>
									<Select value={userInviteExpiry} onValueChange={setUserInviteExpiry}>
										<SelectTrigger>
											<SelectValue placeholder="Select expiry" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="1h">1 hour</SelectItem>
											<SelectItem value="24h">24 hours</SelectItem>
											<SelectItem value="7d">7 days</SelectItem>
											<SelectItem value="30d">30 days</SelectItem>
											<SelectItem value="never">Never</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="invite-max-uses">Max Uses</Label>
									<Select value={userInviteMaxUses} onValueChange={setUserInviteMaxUses}>
										<SelectTrigger>
											<SelectValue placeholder="Select max uses" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="1">1 use</SelectItem>
											<SelectItem value="5">5 uses</SelectItem>
											<SelectItem value="10">10 uses</SelectItem>
											<SelectItem value="25">25 uses</SelectItem>
											<SelectItem value="100">100 uses</SelectItem>
											<SelectItem value="unlimited">Unlimited</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setUserInviteDialogOpen(false)}>
									Cancel
								</Button>
								<Button onClick={handleCreateUserInviteLink} disabled={isCreatingUserInvite}>
									{isCreatingUserInvite && <Spinner className="h-4 w-4 mr-2" />}
									Generate Link
								</Button>
							</DialogFooter>
						</>
					) : (
						<>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label>Invite Link</Label>
									<div className="flex gap-2">
										<Input
											readOnly
											value={userInviteLink}
											className="flex-1 font-mono text-xs"
										/>
										<Button
											size="icon"
											variant="outline"
											onClick={handleCopyUserInviteLink}
										>
											{userInviteLinkCopied ? (
												<Check className="h-4 w-4 text-green-500" />
											) : (
												<Copy className="h-4 w-4" />
											)}
										</Button>
									</div>
									<p className="text-xs text-muted-foreground">
										Share this link with others to connect with them.
									</p>
								</div>
							</div>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => {
										setUserInviteLink(null);
									}}
								>
									Create Another
								</Button>
								<Button onClick={() => setUserInviteDialogOpen(false)}>
									Done
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			{/* Bulk Share Dialog */}
			<BulkShareDialog
				open={bulkShareDialogOpen}
				onOpenChange={setBulkShareDialogOpen}
				selectedPromptIds={Array.from(selectedPromptIds)}
				onSuccess={() => {
					setSelectedPromptIds(new Set());
					setIsMultiSelectMode(false);
				}}
			/>

			{/* User Info */}
			<div className="fixed bottom-4 left-4 flex items-center gap-2 rounded-full bg-muted/80 backdrop-blur px-3 py-1.5 text-xs text-muted-foreground shadow-sm border">
				<div className="h-2 w-2 rounded-full bg-green-500" />
				{session.email}
			</div>
		</div>
	);
}
