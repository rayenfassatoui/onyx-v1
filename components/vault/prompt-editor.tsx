"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Plus } from "lucide-react";
import { toast } from "sonner";

interface Tag {
	id: string;
	name: string;
	color: string;
}

interface PromptEditorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	prompt?: {
		id: string;
		title: string;
		description: string;
		content: string;
		tags: Tag[];
	};
	availableTags: Tag[];
	onSave: (data: {
		title: string;
		description: string;
		content: string;
		tagIds: string[];
	}) => Promise<void>;
	onCreateTag?: (name: string) => Promise<Tag>;
}

export function PromptEditor({
	open,
	onOpenChange,
	prompt,
	availableTags,
	onSave,
	onCreateTag,
}: PromptEditorProps) {
	const [title, setTitle] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [content, setContent] = React.useState("");
	const [selectedTags, setSelectedTags] = React.useState<Tag[]>([]);
	const [newTagName, setNewTagName] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [showTagInput, setShowTagInput] = React.useState(false);

	const isEditing = !!prompt;

	// Reset form when prompt changes
	React.useEffect(() => {
		if (prompt) {
			setTitle(prompt.title);
			setDescription(prompt.description || "");
			setContent(prompt.content);
			setSelectedTags(prompt.tags);
		} else {
			setTitle("");
			setDescription("");
			setContent("");
			setSelectedTags([]);
		}
	}, [prompt, open]);

	const handleSave = async () => {
		if (!title.trim()) {
			toast.error("Title is required");
			return;
		}

		if (!content.trim()) {
			toast.error("Content is required");
			return;
		}

		setIsLoading(true);
		try {
			await onSave({
				title: title.trim(),
				description: description.trim(),
				content,
				tagIds: selectedTags.map((t) => t.id),
			});
			toast.success(isEditing ? "Prompt updated" : "Prompt created");
			onOpenChange(false);
		} catch (error) {
			toast.error(isEditing ? "Failed to update prompt" : "Failed to create prompt");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddTag = (tag: Tag) => {
		if (!selectedTags.find((t) => t.id === tag.id)) {
			setSelectedTags([...selectedTags, tag]);
		}
	};

	const handleRemoveTag = (tagId: string) => {
		setSelectedTags(selectedTags.filter((t) => t.id !== tagId));
	};

	const handleCreateTag = async () => {
		if (!newTagName.trim() || !onCreateTag) return;

		try {
			const newTag = await onCreateTag(newTagName.trim());
			setSelectedTags([...selectedTags, newTag]);
			setNewTagName("");
			setShowTagInput(false);
			toast.success("Tag created");
		} catch (error) {
			toast.error("Failed to create tag");
			console.error(error);
		}
	};

	const unselectedTags = availableTags.filter(
		(tag) => !selectedTags.find((t) => t.id === tag.id)
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Prompt" : "Create Prompt"}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Title */}
					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							placeholder="Enter prompt title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label htmlFor="description">Description (optional)</Label>
						<Input
							id="description"
							placeholder="Brief description of the prompt"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					{/* Content */}
					<div className="space-y-2">
						<Label htmlFor="content">
							Content
							<span className="ml-2 text-xs text-muted-foreground">
								Use {"{{variable}}"} for dynamic values
							</span>
						</Label>
						<Textarea
							id="content"
							placeholder="Enter your prompt template..."
							value={content}
							onChange={(e) => setContent(e.target.value)}
							className="min-h-[200px] font-mono text-sm"
						/>
					</div>

					{/* Tags */}
					<div className="space-y-2">
						<Label>Tags</Label>
						
						{/* Selected Tags */}
						<div className="flex flex-wrap gap-1">
							{selectedTags.map((tag) => (
								<Badge
									key={tag.id}
									variant="secondary"
									className="gap-1"
									style={{
										backgroundColor: `${tag.color}20`,
										color: tag.color,
									}}
								>
									{tag.name}
									<button
										type="button"
										onClick={() => handleRemoveTag(tag.id)}
										className="ml-1 hover:opacity-70"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							))}
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="h-6 text-xs"
								onClick={() => setShowTagInput(!showTagInput)}
							>
								<Plus className="mr-1 h-3 w-3" />
								Add Tag
							</Button>
						</div>

						{/* Add Tag Input */}
						{showTagInput && (
							<div className="flex flex-wrap gap-2 pt-2">
								{/* Existing Tags */}
								{unselectedTags.length > 0 && (
									<div className="flex flex-wrap gap-1">
										{unselectedTags.map((tag) => (
											<Badge
												key={tag.id}
												variant="outline"
												className="cursor-pointer hover:opacity-80"
												style={{ borderColor: tag.color, color: tag.color }}
												onClick={() => handleAddTag(tag)}
											>
												{tag.name}
											</Badge>
										))}
									</div>
								)}

								{/* Create New Tag */}
								{onCreateTag && (
									<div className="flex gap-2 w-full mt-2">
										<Input
											placeholder="New tag name"
											value={newTagName}
											onChange={(e) => setNewTagName(e.target.value)}
											className="h-8 text-sm"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleCreateTag();
												}
											}}
										/>
										<Button
											type="button"
											size="sm"
											onClick={handleCreateTag}
											disabled={!newTagName.trim()}
										>
											Create
										</Button>
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isLoading}>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{isEditing ? "Save Changes" : "Create Prompt"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
