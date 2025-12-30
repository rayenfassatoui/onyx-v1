"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	History,
	RotateCcw,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Clock,
	ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Version {
	id: string;
	versionNumber: number;
	content: string;
	metadata: Record<string, unknown> | null;
	createdAt: Date;
}

interface VersionHistoryProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	promptId: string;
	promptTitle: string;
	currentContent: string;
	onRestore: () => void;
}

export function VersionHistory({
	open,
	onOpenChange,
	promptId,
	promptTitle,
	currentContent,
	onRestore,
}: VersionHistoryProps) {
	const [versions, setVersions] = React.useState<Version[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);
	const [selectedVersion, setSelectedVersion] = React.useState<Version | null>(null);
	const [compareMode, setCompareMode] = React.useState(false);
	const [compareVersion, setCompareVersion] = React.useState<Version | null>(null);
	const [isRestoring, setIsRestoring] = React.useState(false);
	const [showRestoreConfirm, setShowRestoreConfirm] = React.useState(false);

	// Fetch versions when dialog opens
	React.useEffect(() => {
		if (open && promptId) {
			fetchVersions();
		}
	}, [open, promptId]);

	const fetchVersions = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/prompts/${promptId}/versions`);
			if (res.ok) {
				const data = await res.json();
				setVersions(data.versions);
				if (data.versions.length > 0) {
					setSelectedVersion(data.versions[0]);
				}
			}
		} catch (error) {
			console.error("Failed to fetch versions:", error);
			toast.error("Failed to load version history");
		} finally {
			setIsLoading(false);
		}
	};

	const handleRestore = async () => {
		if (!selectedVersion) return;

		setIsRestoring(true);
		try {
			const res = await fetch(
				`/api/prompts/${promptId}/versions/${selectedVersion.id}/restore`,
				{ method: "POST" }
			);

			if (res.ok) {
				toast.success(`Restored to version ${selectedVersion.versionNumber}`);
				onRestore();
				onOpenChange(false);
			} else {
				toast.error("Failed to restore version");
			}
		} catch (error) {
			toast.error("Failed to restore version");
		} finally {
			setIsRestoring(false);
			setShowRestoreConfirm(false);
		}
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	// Compute diff between two versions
	const computeDiff = (oldText: string, newText: string) => {
		const oldLines = oldText.split("\n");
		const newLines = newText.split("\n");
		const diff: { type: "same" | "added" | "removed"; line: string }[] = [];

		let i = 0;
		let j = 0;

		while (i < oldLines.length || j < newLines.length) {
			if (i >= oldLines.length) {
				diff.push({ type: "added", line: newLines[j] });
				j++;
			} else if (j >= newLines.length) {
				diff.push({ type: "removed", line: oldLines[i] });
				i++;
			} else if (oldLines[i] === newLines[j]) {
				diff.push({ type: "same", line: oldLines[i] });
				i++;
				j++;
			} else {
				// Simple diff - mark old as removed, new as added
				diff.push({ type: "removed", line: oldLines[i] });
				diff.push({ type: "added", line: newLines[j] });
				i++;
				j++;
			}
		}

		return diff;
	};

	const navigateVersion = (direction: "prev" | "next") => {
		if (!selectedVersion) return;
		const currentIndex = versions.findIndex((v) => v.id === selectedVersion.id);
		const newIndex = direction === "prev" ? currentIndex + 1 : currentIndex - 1;
		if (newIndex >= 0 && newIndex < versions.length) {
			setSelectedVersion(versions[newIndex]);
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-2xl max-h-[70vh]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<History className="h-5 w-5" />
							Version History
						</DialogTitle>
						<DialogDescription>
							{promptTitle} - {versions.length} version{versions.length !== 1 ? "s" : ""}
						</DialogDescription>
					</DialogHeader>

					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : versions.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<History className="h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-muted-foreground">No version history yet</p>
							<p className="text-sm text-muted-foreground">
								Versions are created when you edit and save a prompt
							</p>
						</div>
					) : (
						<div className="grid grid-cols-[160px_1fr] gap-3 h-[350px]">
							{/* Version List */}
							<ScrollArea className="h-full border rounded-lg bg-muted/30">
								<div className="p-1.5 space-y-1">
									{versions.map((version) => (
										<button
											key={version.id}
											type="button"
											onClick={() => setSelectedVersion(version)}
											className={`w-full text-left p-2 rounded-md transition-all text-xs ${
												selectedVersion?.id === version.id
													? "bg-primary text-primary-foreground shadow-sm"
													: "hover:bg-muted"
											}`}
										>
											<div className="flex items-center justify-between">
												<span className="font-semibold">
													v{version.versionNumber}
												</span>
												{compareMode && compareVersion?.id === version.id && (
													<Badge variant="secondary" className="text-[10px] px-1">
														Compare
													</Badge>
												)}
											</div>
											<div className="text-[10px] opacity-70 mt-0.5">
												<Clock className="inline h-2.5 w-2.5 mr-0.5" />
												{formatDate(version.createdAt)}
											</div>
										</button>
									))}
								</div>
							</ScrollArea>

							{/* Version Content */}
							<div className="flex flex-col h-full">
								{/* Controls */}
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="sm"
											className="h-7 w-7 p-0"
											onClick={() => navigateVersion("prev")}
											disabled={
												!selectedVersion ||
												versions.findIndex((v) => v.id === selectedVersion.id) ===
													versions.length - 1
											}
										>
											<ChevronLeft className="h-4 w-4" />
										</Button>
										<span className="text-xs font-medium px-2">
											{selectedVersion && `Version ${selectedVersion.versionNumber}`}
										</span>
										<Button
											variant="ghost"
											size="sm"
											className="h-7 w-7 p-0"
											onClick={() => navigateVersion("next")}
											disabled={
												!selectedVersion ||
												versions.findIndex((v) => v.id === selectedVersion.id) === 0
											}
										>
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>

									<div className="flex items-center gap-1">
										<Button
											variant={compareMode ? "secondary" : "ghost"}
											size="sm"
											className="h-7 text-xs"
											onClick={() => {
												setCompareMode(!compareMode);
												if (!compareMode && versions.length > 1) {
													const currentIdx = versions.findIndex(
														(v) => v.id === selectedVersion?.id
													);
													setCompareVersion(
														versions[currentIdx + 1] || versions[0]
													);
												}
											}}
										>
											<ArrowLeftRight className="mr-1 h-3 w-3" />
											Compare
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="h-7 text-xs"
											onClick={() => setShowRestoreConfirm(true)}
											disabled={!selectedVersion}
										>
											<RotateCcw className="mr-1 h-3 w-3" />
											Restore
										</Button>
									</div>
								</div>

								{/* Content Display */}
								<ScrollArea className="flex-1 border rounded-lg p-3 bg-muted/20">
									{compareMode && compareVersion && selectedVersion ? (
										<div className="font-mono text-xs space-y-0.5">
											{computeDiff(
												compareVersion.content,
												selectedVersion.content
											).map((line, i) => (
												<div
													key={i}
													className={`px-2 py-0.5 rounded text-xs ${
														line.type === "added"
															? "bg-green-500/20 text-green-400"
															: line.type === "removed"
															? "bg-red-500/20 text-red-400"
															: ""
													}`}
												>
													<span className="select-none mr-2 opacity-50">
														{line.type === "added"
															? "+"
															: line.type === "removed"
															? "-"
															: " "}
													</span>
													{line.line || " "}
												</div>
											))}
										</div>
									) : (
										<pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
											{selectedVersion?.content}
										</pre>
									)}
								</ScrollArea>

								{/* Compare selector */}
								{compareMode && (
									<div className="mt-2 flex items-center gap-2 text-xs">
										<span className="text-muted-foreground">Compare with:</span>
										<select
											value={compareVersion?.id || ""}
											onChange={(e) => {
												const v = versions.find((v) => v.id === e.target.value);
												setCompareVersion(v || null);
											}}
											className="bg-background border rounded px-2 py-1"
										>
											{versions
												.filter((v) => v.id !== selectedVersion?.id)
												.map((v) => (
													<option key={v.id} value={v.id}>
														Version {v.versionNumber}
													</option>
												))}
										</select>
									</div>
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Restore Confirmation */}
			<AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Restore Version?</AlertDialogTitle>
						<AlertDialogDescription>
							This will restore version {selectedVersion?.versionNumber} and create a
							new version from the current content. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
							{isRestoring ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Restoring...
								</>
							) : (
								<>
									<RotateCcw className="mr-2 h-4 w-4" />
									Restore
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
