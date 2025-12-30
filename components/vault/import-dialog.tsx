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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
	Upload,
	FileJson,
	AlertTriangle,
	CheckCircle2,
	XCircle,
	Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ImportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

type ConflictResolution = "overwrite" | "duplicate" | "skip";

interface ImportPreview {
	prompts: Array<{
		title: string;
		hasConflict: boolean;
	}>;
	tags: string[];
	totalPrompts: number;
	conflictCount: number;
}

interface ImportResult {
	imported: number;
	skipped: number;
	overwritten: number;
	duplicated: number;
	errors: string[];
}

export function ImportDialog({
	open,
	onOpenChange,
	onSuccess,
}: ImportDialogProps) {
	const [step, setStep] = React.useState<"upload" | "preview" | "importing" | "complete">("upload");
	const [file, setFile] = React.useState<File | null>(null);
	const [importData, setImportData] = React.useState<unknown>(null);
	const [preview, setPreview] = React.useState<ImportPreview | null>(null);
	const [conflictResolution, setConflictResolution] = React.useState<ConflictResolution>("skip");
	const [progress, setProgress] = React.useState(0);
	const [result, setResult] = React.useState<ImportResult | null>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const reset = () => {
		setStep("upload");
		setFile(null);
		setImportData(null);
		setPreview(null);
		setConflictResolution("skip");
		setProgress(0);
		setResult(null);
	};

	React.useEffect(() => {
		if (!open) {
			reset();
		}
	}, [open]);

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile) return;

		if (!selectedFile.name.endsWith(".json")) {
			toast.error("Please select a JSON file");
			return;
		}

		setFile(selectedFile);

		try {
			const text = await selectedFile.text();
			const data = JSON.parse(text);

			if (!data.prompts || !Array.isArray(data.prompts)) {
				toast.error("Invalid import file format");
				return;
			}

			setImportData(data);

			// Check for conflicts
			const res = await fetch("/api/prompts");
			const existingData = await res.json();
			const existingTitles = new Set(
				existingData.prompts.map((p: { title: string }) => p.title.toLowerCase())
			);

			const promptsPreview = data.prompts.map((p: { title: string }) => ({
				title: p.title,
				hasConflict: existingTitles.has(p.title.toLowerCase()),
			}));

			setPreview({
				prompts: promptsPreview,
				tags: data.tags?.map((t: { name: string }) => t.name) || [],
				totalPrompts: data.prompts.length,
				conflictCount: promptsPreview.filter((p: { hasConflict: boolean }) => p.hasConflict).length,
			});

			setStep("preview");
		} catch (error) {
			console.error("Parse error:", error);
			toast.error("Failed to parse import file");
		}
	};

	const handleImport = async () => {
		if (!importData) return;

		setStep("importing");
		setProgress(10);

		try {
			setProgress(30);

			const res = await fetch("/api/prompts/import", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					data: importData,
					conflictResolution,
				}),
			});

			setProgress(80);

			if (!res.ok) {
				throw new Error("Import failed");
			}

			const data = await res.json();
			setResult(data.results);
			setProgress(100);
			setStep("complete");
			onSuccess();
		} catch (error) {
			console.error("Import error:", error);
			toast.error("Import failed");
			setStep("preview");
		}
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		const droppedFile = e.dataTransfer.files[0];
		if (droppedFile) {
			const input = fileInputRef.current;
			if (input) {
				const dt = new DataTransfer();
				dt.items.add(droppedFile);
				input.files = dt.files;
				input.dispatchEvent(new Event("change", { bubbles: true }));
			}
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Import Prompts</DialogTitle>
					<DialogDescription>
						{step === "upload" && "Upload a JSON file exported from Onyx Vault"}
						{step === "preview" && "Review the import and configure conflict handling"}
						{step === "importing" && "Importing your prompts..."}
						{step === "complete" && "Import completed"}
					</DialogDescription>
				</DialogHeader>

				{step === "upload" && (
					<div
						className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
						onDrop={handleDrop}
						onDragOver={(e) => e.preventDefault()}
						onClick={() => fileInputRef.current?.click()}
						onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
					>
						<input
							ref={fileInputRef}
							type="file"
							accept=".json"
							onChange={handleFileSelect}
							className="hidden"
						/>
						<Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
						<p className="text-sm text-muted-foreground">
							Drag and drop a JSON file here, or click to browse
						</p>
						<p className="text-xs text-muted-foreground mt-2">
							Supports Onyx Vault export format
						</p>
					</div>
				)}

				{step === "preview" && preview && (
					<div className="space-y-4">
						{/* Summary */}
						<div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
							<FileJson className="h-8 w-8 text-primary" />
							<div>
								<p className="font-medium">{file?.name}</p>
								<p className="text-sm text-muted-foreground">
									{preview.totalPrompts} prompt{preview.totalPrompts !== 1 ? "s" : ""}
									{preview.tags.length > 0 && `, ${preview.tags.length} tags`}
								</p>
							</div>
						</div>

						{/* Conflicts Warning */}
						{preview.conflictCount > 0 && (
							<div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
								<AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
								<div>
									<p className="font-medium text-yellow-500">
										{preview.conflictCount} conflict{preview.conflictCount !== 1 ? "s" : ""} detected
									</p>
									<p className="text-sm text-muted-foreground">
										Some prompts have the same title as existing ones
									</p>
								</div>
							</div>
						)}

						{/* Conflict Resolution */}
						{preview.conflictCount > 0 && (
							<div className="space-y-3">
								<Label>How to handle conflicts?</Label>
								<RadioGroup
									value={conflictResolution}
									onValueChange={(v) => setConflictResolution(v as ConflictResolution)}
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="skip" id="skip" />
										<Label htmlFor="skip" className="font-normal">
											Skip conflicting prompts
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="duplicate" id="duplicate" />
										<Label htmlFor="duplicate" className="font-normal">
											Create duplicates with "(imported)" suffix
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="overwrite" id="overwrite" />
										<Label htmlFor="overwrite" className="font-normal">
											Overwrite existing prompts
										</Label>
									</div>
								</RadioGroup>
							</div>
						)}

						{/* Preview List */}
						<div>
							<Label className="text-xs text-muted-foreground uppercase tracking-wide">
								Prompts to import
							</Label>
							<ScrollArea className="h-40 mt-2 border rounded-lg">
								<div className="p-2 space-y-1">
									{preview.prompts.map((p, i) => (
										<div
											key={i}
											className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted"
										>
											<span className="text-sm truncate">{p.title}</span>
											{p.hasConflict && (
												<Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
													Conflict
												</Badge>
											)}
										</div>
									))}
								</div>
							</ScrollArea>
						</div>
					</div>
				)}

				{step === "importing" && (
					<div className="py-8 space-y-4">
						<Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
						<Progress value={progress} className="h-2" />
						<p className="text-center text-sm text-muted-foreground">
							Importing prompts...
						</p>
					</div>
				)}

				{step === "complete" && result && (
					<div className="py-4 space-y-4">
						<div className="flex items-center justify-center">
							<CheckCircle2 className="h-16 w-16 text-green-500" />
						</div>
						<div className="text-center space-y-1">
							<p className="font-medium">Import Complete!</p>
							<div className="text-sm text-muted-foreground space-y-0.5">
								{result.imported > 0 && (
									<p className="text-green-500">
										{result.imported} prompt{result.imported !== 1 ? "s" : ""} imported
									</p>
								)}
								{result.overwritten > 0 && (
									<p className="text-yellow-500">
										{result.overwritten} prompt{result.overwritten !== 1 ? "s" : ""} overwritten
									</p>
								)}
								{result.duplicated > 0 && (
									<p className="text-blue-500">
										{result.duplicated} duplicate{result.duplicated !== 1 ? "s" : ""} created
									</p>
								)}
								{result.skipped > 0 && (
									<p className="text-muted-foreground">
										{result.skipped} prompt{result.skipped !== 1 ? "s" : ""} skipped
									</p>
								)}
							</div>
						</div>
						{result.errors.length > 0 && (
							<div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
								<div className="flex items-center gap-2 text-red-500 mb-2">
									<XCircle className="h-4 w-4" />
									<span className="text-sm font-medium">
										{result.errors.length} error{result.errors.length !== 1 ? "s" : ""}
									</span>
								</div>
								<ScrollArea className="max-h-20">
									{result.errors.map((err, i) => (
										<p key={i} className="text-xs text-red-400">
											{err}
										</p>
									))}
								</ScrollArea>
							</div>
						)}
					</div>
				)}

				<DialogFooter>
					{step === "upload" && (
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
					)}
					{step === "preview" && (
						<>
							<Button variant="outline" onClick={reset}>
								Back
							</Button>
							<Button onClick={handleImport}>
								Import {preview?.totalPrompts} Prompt{preview?.totalPrompts !== 1 ? "s" : ""}
							</Button>
						</>
					)}
					{step === "complete" && (
						<Button onClick={() => onOpenChange(false)}>Done</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
