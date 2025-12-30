"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface Tag {
	id: string;
	name: string;
	color: string;
}

interface TagRailProps {
	tags: Tag[];
	selectedTagIds: string[];
	onTagToggle: (tagId: string) => void;
	onClearAll?: () => void;
}

export function TagRail({ tags, selectedTagIds, onTagToggle, onClearAll }: TagRailProps) {
	if (tags.length === 0) return null;

	const hasSelection = selectedTagIds.length > 0;

	return (
		<div className="flex items-center gap-2">
			<ScrollArea className="flex-1 whitespace-nowrap">
				<div className="flex gap-1.5 py-1">
					{tags.map((tag) => {
						const isSelected = selectedTagIds.includes(tag.id);
						return (
							<Badge
								key={tag.id}
								variant={isSelected ? "default" : "outline"}
								className={cn(
									"cursor-pointer transition-all hover:opacity-80",
									isSelected && "ring-2 ring-offset-1"
								)}
								style={{
									backgroundColor: isSelected ? tag.color : "transparent",
									borderColor: tag.color,
									color: isSelected ? "white" : tag.color,
									// @ts-expect-error CSS custom property
									"--tw-ring-color": tag.color,
								}}
								onClick={() => onTagToggle(tag.id)}
							>
								{tag.name}
							</Badge>
						);
					})}
				</div>
				<ScrollBar orientation="horizontal" className="h-1.5" />
			</ScrollArea>

			{hasSelection && onClearAll && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onClearAll}
					className="h-7 flex-shrink-0 text-xs text-muted-foreground"
				>
					<X className="mr-1 h-3 w-3" />
					Clear
				</Button>
			)}
		</div>
	);
}
