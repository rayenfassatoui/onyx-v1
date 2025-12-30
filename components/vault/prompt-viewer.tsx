"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
	extractVariables,
	resolveTemplate,
	validateVariables,
	createVariableSchema,
} from "@/lib/variables";
import { cn } from "@/lib/utils";

interface Tag {
	id: string;
	name: string;
	color: string;
}

interface PromptViewerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	prompt: {
		id: string;
		title: string;
		description: string;
		content: string;
		tags: Tag[];
		createdAt: Date;
		updatedAt: Date;
		versionCount?: number;
	} | null;
	onEdit?: () => void;
}

export function PromptViewer({
	open,
	onOpenChange,
	prompt,
	onEdit,
}: PromptViewerProps) {
	const [variableValues, setVariableValues] = React.useState<Record<string, string>>({});
	const [copied, setCopied] = React.useState(false);

	// Reset variable values when prompt changes
	React.useEffect(() => {
		setVariableValues({});
		setCopied(false);
	}, [prompt?.id]);

	if (!prompt) return null;

	const variables = extractVariables(prompt.content);
	const variableSchema = createVariableSchema(prompt.content);
	const hasVars = variables.length > 0;
	const resolvedContent = resolveTemplate(prompt.content, variableValues);
	const validation = validateVariables(prompt.content, variableValues);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(resolvedContent);
			setCopied(true);
			toast.success("Copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy");
		}
	};

	const handleVariableChange = (name: string, value: string) => {
		setVariableValues((prev) => ({ ...prev, [name]: value }));
	};

	const handleClearVariables = () => {
		setVariableValues({});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
				<DialogHeader>
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-1">
							<DialogTitle className="text-xl">{prompt.title}</DialogTitle>
							{prompt.description && (
								<p className="text-sm text-muted-foreground">
									{prompt.description}
								</p>
							)}
						</div>
						<div className="flex gap-2">
							{onEdit && (
								<Button variant="outline" size="sm" onClick={onEdit}>
									Edit
								</Button>
							)}
							<Button
								size="sm"
								onClick={handleCopy}
								className={cn(
									copied && "bg-green-600 hover:bg-green-600"
								)}
							>
								{copied ? (
									<>
										<Check className="mr-2 h-4 w-4" />
										Copied
									</>
								) : (
									<>
										<Copy className="mr-2 h-4 w-4" />
										Copy
									</>
								)}
							</Button>
						</div>
					</div>

					{/* Tags */}
					{prompt.tags.length > 0 && (
						<div className="flex flex-wrap gap-1 pt-2">
							{prompt.tags.map((tag) => (
								<Badge
									key={tag.id}
									variant="secondary"
									style={{
										backgroundColor: `${tag.color}20`,
										color: tag.color,
									}}
								>
									{tag.name}
								</Badge>
							))}
						</div>
					)}
				</DialogHeader>

				<div className="flex-1 overflow-hidden">
					<div className={cn(
						"grid gap-4 h-full",
						hasVars ? "grid-cols-[1fr_280px]" : "grid-cols-1"
					)}>
						{/* Content Preview */}
						<ScrollArea className="h-[400px] rounded-lg border bg-muted/30 p-4">
							<pre className="whitespace-pre-wrap font-mono text-sm">
								{resolvedContent}
							</pre>
						</ScrollArea>

						{/* Variable Form */}
						{hasVars && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Sparkles className="h-4 w-4 text-primary" />
										<span className="text-sm font-medium">Variables</span>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={handleClearVariables}
										className="h-7 text-xs"
									>
										Clear All
									</Button>
								</div>

								<Separator />

								<ScrollArea className="h-[320px] pr-4">
									<div className="space-y-4">
										{variableSchema.map((variable) => (
											<div key={variable.name} className="space-y-1.5">
												<Label
													htmlFor={variable.name}
													className="text-sm"
												>
													{variable.label}
												</Label>
												<Input
													id={variable.name}
													placeholder={`Enter ${variable.label.toLowerCase()}`}
													value={variableValues[variable.name] || ""}
													onChange={(e) =>
														handleVariableChange(variable.name, e.target.value)
													}
													className="h-9"
												/>
											</div>
										))}
									</div>
								</ScrollArea>

								{/* Validation Warning */}
								{!validation.valid && (
									<div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 p-2 text-xs text-yellow-600 dark:text-yellow-400">
										<AlertCircle className="h-4 w-4 flex-shrink-0" />
										<span>
											{validation.missing.length} unfilled variable
											{validation.missing.length !== 1 ? "s" : ""}
										</span>
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Footer Metadata */}
				<div className="flex items-center justify-between pt-4 text-xs text-muted-foreground border-t">
					<span>
						Created {new Date(prompt.createdAt).toLocaleDateString()}
					</span>
					<div className="flex gap-4">
						{prompt.versionCount !== undefined && (
							<span>{prompt.versionCount} version{prompt.versionCount !== 1 ? "s" : ""}</span>
						)}
						<span>
							Updated {new Date(prompt.updatedAt).toLocaleDateString()}
						</span>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
