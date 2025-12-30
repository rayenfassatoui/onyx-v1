"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

interface KeyboardShortcutsProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const shortcuts = [
	{
		category: "Navigation",
		items: [
			{ keys: ["↑", "↓"], description: "Navigate between prompts" },
			{ keys: ["Enter"], description: "Open selected prompt" },
			{ keys: ["Esc"], description: "Close dialog / Clear selection" },
			{ keys: ["/"], description: "Focus search" },
		],
	},
	{
		category: "Actions",
		items: [
			{ keys: ["⌘", "N"], description: "Create new prompt" },
			{ keys: ["⌘", "E"], description: "Edit selected prompt" },
			{ keys: ["⌘", "C"], description: "Copy prompt content" },
			{ keys: ["⌘", "S"], description: "Save prompt (in editor)" },
			{ keys: ["Del"], description: "Delete selected prompt" },
		],
	},
	{
		category: "View",
		items: [
			{ keys: ["⌘", "K"], description: "Open command palette" },
			{ keys: ["⌘", ","], description: "Open settings" },
			{ keys: ["?"], description: "Show keyboard shortcuts" },
		],
	},
];

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Keyboard Shortcuts</DialogTitle>
					<DialogDescription>
						Quick actions to navigate and manage your prompts
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{shortcuts.map((section) => (
						<div key={section.category}>
							<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
								{section.category}
							</h4>
							<div className="space-y-2">
								{section.items.map((shortcut, i) => (
									<div
										key={i}
										className="flex items-center justify-between py-1"
									>
										<span className="text-sm">{shortcut.description}</span>
										<div className="flex items-center gap-1">
											{shortcut.keys.map((key, j) => (
												<React.Fragment key={j}>
													<Kbd>{key}</Kbd>
													{j < shortcut.keys.length - 1 && (
														<span className="text-muted-foreground text-xs">+</span>
													)}
												</React.Fragment>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
