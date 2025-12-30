"use client";

import { FileText, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

interface EmptyStateProps {
	hasSearch?: boolean;
	hasTagFilter?: boolean;
	onCreateNew: () => void;
}

export function EmptyState({
	hasSearch = false,
	hasTagFilter = false,
	onCreateNew,
}: EmptyStateProps) {
	if (hasSearch || hasTagFilter) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col items-center justify-center py-16 px-4 text-center"
			>
				<div className="rounded-full bg-muted p-4 mb-4">
					<FileText className="h-8 w-8 text-muted-foreground" />
				</div>
				<h3 className="text-lg font-semibold mb-2">No prompts found</h3>
				<p className="text-muted-foreground text-sm max-w-sm mb-4">
					{hasSearch && hasTagFilter
						? "No prompts match your search and filter criteria."
						: hasSearch
							? "No prompts match your search query."
							: "No prompts match the selected tags."}
				</p>
				<Button variant="outline" onClick={onCreateNew}>
					<Plus className="h-4 w-4 mr-2" />
					Create New Prompt
				</Button>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.3 }}
			className="flex flex-col items-center justify-center py-20 px-4 text-center"
		>
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
				className="relative mb-6"
			>
				<div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-6">
					<Sparkles className="h-12 w-12 text-primary" />
				</div>
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
					className="absolute inset-0 rounded-full border border-dashed border-primary/30"
				/>
			</motion.div>

			<h2 className="text-2xl font-bold mb-2">Welcome to Onyx Prompt Vault</h2>
			<p className="text-muted-foreground max-w-md mb-6">
				Your personal vault for storing, organizing, and enhancing your AI
				prompts. Start by creating your first prompt.
			</p>

			<div className="flex flex-col sm:flex-row gap-3">
				<Button onClick={onCreateNew} size="lg">
					<Plus className="h-4 w-4 mr-2" />
					Create Your First Prompt
				</Button>
			</div>

			<div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="text-center p-4"
				>
					<div className="rounded-lg bg-muted p-3 w-fit mx-auto mb-3">
						<FileText className="h-5 w-5 text-muted-foreground" />
					</div>
					<h4 className="font-medium text-sm mb-1">Save Prompts</h4>
					<p className="text-xs text-muted-foreground">
						Store and organize your best prompts
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="text-center p-4"
				>
					<div className="rounded-lg bg-muted p-3 w-fit mx-auto mb-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="h-5 w-5 text-muted-foreground"
						>
							<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
							<path d="M7 7h.01" />
						</svg>
					</div>
					<h4 className="font-medium text-sm mb-1">Tag & Filter</h4>
					<p className="text-xs text-muted-foreground">
						Organize with tags for quick access
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="text-center p-4"
				>
					<div className="rounded-lg bg-muted p-3 w-fit mx-auto mb-3">
						<Sparkles className="h-5 w-5 text-muted-foreground" />
					</div>
					<h4 className="font-medium text-sm mb-1">AI Suggestions</h4>
					<p className="text-xs text-muted-foreground">
						Get AI-powered improvements
					</p>
				</motion.div>
			</div>
		</motion.div>
	);
}
