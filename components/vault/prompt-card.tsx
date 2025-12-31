"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, MoreVertical, Edit, Trash2, History, Sparkles, Share2 } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { extractVariables } from "@/lib/variables";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Tag {
	id: string;
	name: string;
	color: string;
}

interface PromptCardProps {
	id: string;
	title: string;
	description?: string;
	content: string;
	tags: Tag[];
	createdAt: Date;
	updatedAt: Date;
	isSelected?: boolean;
	sharedByLabel?: string;
	shareCount?: number;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	onHistory?: () => void;
	onAI?: () => void;
	onShare?: () => void;
	onClick?: (id: string) => void;
}

export function PromptCard({
	id,
	title,
	description,
	content,
	tags,
	updatedAt,
	isSelected,
	sharedByLabel,
	shareCount,
	onEdit,
	onDelete,
	onHistory,
	onAI,
	onShare,
	onClick,
}: PromptCardProps) {
	const variables = extractVariables(content);
	const contentPreview = content.slice(0, 150) + (content.length > 150 ? "..." : "");

	const handleCopy = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(content);
			toast.success("Copied to clipboard");
		} catch {
			toast.error("Failed to copy");
		}
	};

	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		onEdit?.(id);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		onDelete?.(id);
	};

	const handleHistory = (e: React.MouseEvent) => {
		e.stopPropagation();
		onHistory?.();
	};

	const handleAI = (e: React.MouseEvent) => {
		e.stopPropagation();
		onAI?.();
	};

	const handleShare = (e: React.MouseEvent) => {
		e.stopPropagation();
		onShare?.();
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.98 }}
			whileHover={{ y: -2 }}
			transition={{ duration: 0.15 }}
		>
			<Card
				className={cn(
					"cursor-pointer transition-all hover:shadow-lg hover:border-primary/20",
					"group relative overflow-hidden",
					isSelected && "ring-2 ring-primary"
				)}
				onClick={() => onClick?.(id)}
			>
				<CardHeader className="pb-2 pt-3 px-3">
					<div className="flex items-start justify-between gap-2">
						<CardTitle className="line-clamp-1 text-sm font-medium">
							{title}
						</CardTitle>
						{(onEdit || onDelete || onHistory || onAI || onShare) && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
										onClick={(e) => e.stopPropagation()}
									>
										<MoreVertical className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{onEdit && (
										<DropdownMenuItem onClick={handleEdit}>
											<Edit className="mr-2 h-4 w-4" />
											Edit
										</DropdownMenuItem>
									)}
									{onShare && (
										<DropdownMenuItem onClick={handleShare}>
											<Share2 className="mr-2 h-4 w-4" />
											Share
										</DropdownMenuItem>
									)}
									{onHistory && (
										<DropdownMenuItem onClick={handleHistory}>
											<History className="mr-2 h-4 w-4" />
											Version History
										</DropdownMenuItem>
									)}
									{onAI && (
										<DropdownMenuItem onClick={handleAI}>
											<Sparkles className="mr-2 h-4 w-4" />
											AI Suggestions
										</DropdownMenuItem>
									)}
									{onDelete && (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={handleDelete}
												className="text-destructive focus:text-destructive"
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Delete
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
					{description && (
						<p className="line-clamp-1 text-sm text-muted-foreground">
							{description}
						</p>
					)}
				</CardHeader>
				<CardContent className="space-y-2 px-3 pb-3 pt-0">
					{/* Content Preview */}
					<p className="line-clamp-2 text-xs text-muted-foreground font-mono leading-relaxed">
						{contentPreview}
					</p>

					{/* Variables Badge */}
					{variables.length > 0 && (
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							<span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">
								{variables.length} var{variables.length !== 1 ? "s" : ""}
							</span>
						</div>
					)}

					{/* Tags */}
					{tags.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{tags.slice(0, 2).map((tag) => (
								<Badge
									key={tag.id}
									variant="secondary"
									className="text-[10px] px-1.5 py-0"
									style={{
										backgroundColor: `${tag.color}15`,
										color: tag.color,
									}}
								>
									{tag.name}
								</Badge>
							))}
							{tags.length > 2 && (
								<Badge variant="secondary" className="text-[10px] px-1.5 py-0">
									+{tags.length - 2}
								</Badge>
							)}
						</div>
					)}

					{/* Shared By Label */}
					{sharedByLabel && (
						<div className="flex items-center gap-1 pt-1">
							<Share2 className="h-3 w-3 text-primary flex-shrink-0" />
							<span className="text-[10px] text-primary font-medium">
								{sharedByLabel}
							</span>
						</div>
					)}

					{/* Footer */}
					<div className="flex items-center justify-between pt-1 border-t border-border/50">
						<div className="flex items-center gap-2">
							<span className="text-[10px] text-muted-foreground">
								{new Date(updatedAt).toLocaleDateString()}
							</span>
							{shareCount !== undefined && shareCount > 0 && (
								<div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
									<Share2 className="h-2.5 w-2.5" />
									<span>{shareCount}</span>
								</div>
							)}
						</div>
						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
							onClick={handleCopy}
						>
							<Copy className="h-3 w-3" />
						</Button>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
