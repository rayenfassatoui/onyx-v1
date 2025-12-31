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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2, Shield, Download, Upload, Trash2, Bot, Eye, EyeOff, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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



interface VaultSettingsProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userEmail: string;
	onExport: (format: "json" | "markdown") => void;
	onImport: () => void;
	onLogout: () => void;
}

export function VaultSettings({
	open,
	onOpenChange,
	userEmail,
	onExport,
	onImport,
	onLogout,
}: VaultSettingsProps) {
	const [currentPasscode, setCurrentPasscode] = React.useState("");
	const [newPasscode, setNewPasscode] = React.useState("");
	const [confirmPasscode, setConfirmPasscode] = React.useState("");
	const [isChangingPasscode, setIsChangingPasscode] = React.useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
	const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
	const [darkMode, setDarkMode] = React.useState(() => {
		if (typeof window !== "undefined") {
			return document.documentElement.classList.contains("dark");
		}
		return true;
	});

	// AI Settings
	const [apiKey, setApiKey] = React.useState("");
	const [showApiKey, setShowApiKey] = React.useState(false);
	const [aiModel, setAiModel] = React.useState("openai/gpt-4o-mini");
	const [recentAiModels, setRecentAiModels] = React.useState<string[]>([]);
	const [openModelCombobox, setOpenModelCombobox] = React.useState(false);
	const [modelSearch, setModelSearch] = React.useState("");
	const [hasApiKey, setHasApiKey] = React.useState(false);
	const [maskedApiKey, setMaskedApiKey] = React.useState<string | null>(null);
	const [isSavingAiSettings, setIsSavingAiSettings] = React.useState(false);
	const [isLoadingAiSettings, setIsLoadingAiSettings] = React.useState(true);

	// Fetch AI settings on mount
	React.useEffect(() => {
		if (open) {
			fetchAiSettings();
		}
	}, [open]);

	const fetchAiSettings = async () => {
		setIsLoadingAiSettings(true);
		try {
			const res = await fetch("/api/settings/ai");
			if (res.ok) {
				const data = await res.json();
				setHasApiKey(data.hasApiKey);
				setMaskedApiKey(data.maskedApiKey);
				setAiModel(data.aiModel || "openai/gpt-4o-mini");
				setRecentAiModels(data.recentAiModels || []);
			}
		} catch (error) {
			console.error("Failed to fetch AI settings:", error);
		} finally {
			setIsLoadingAiSettings(false);
		}
	};

	const handleSaveAiSettings = async () => {
		setIsSavingAiSettings(true);
		try {
			const updateData: { openrouterApiKey?: string; aiModel?: string } = {
				aiModel,
			};

			// Only update API key if user entered a new one
			if (apiKey) {
				updateData.openrouterApiKey = apiKey;
			}

			const res = await fetch("/api/settings/ai", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updateData),
			});

			if (res.ok) {
				toast.success("AI settings saved");
				setApiKey("");
				fetchAiSettings();
			} else {
				toast.error("Failed to save AI settings");
			}
		} catch (error) {
			toast.error("Failed to save AI settings");
		} finally {
			setIsSavingAiSettings(false);
		}
	};

	const handleRemoveApiKey = async () => {
		try {
			const res = await fetch("/api/settings/ai", {
				method: "DELETE",
			});

			if (res.ok) {
				toast.success("API key removed");
				setHasApiKey(false);
				setMaskedApiKey(null);
			} else {
				toast.error("Failed to remove API key");
			}
		} catch (error) {
			toast.error("Failed to remove API key");
		}
	};

	const handleChangePasscode = async () => {
		if (!currentPasscode || !newPasscode || !confirmPasscode) {
			toast.error("All fields are required");
			return;
		}

		if (newPasscode !== confirmPasscode) {
			toast.error("New passcodes do not match");
			return;
		}

		if (newPasscode.length < 4) {
			toast.error("Passcode must be at least 4 characters");
			return;
		}

		setIsChangingPasscode(true);
		try {
			const res = await fetch("/api/auth/change-passcode", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					currentPasscode,
					newPasscode,
				}),
			});

			if (res.ok) {
				toast.success("Passcode changed successfully");
				setCurrentPasscode("");
				setNewPasscode("");
				setConfirmPasscode("");
			} else {
				const data = await res.json();
				toast.error(data.error || "Failed to change passcode");
			}
		} catch (error) {
			toast.error("Failed to change passcode");
		} finally {
			setIsChangingPasscode(false);
		}
	};

	const handleDeleteAccount = async () => {
		setIsDeletingAccount(true);
		try {
			const res = await fetch("/api/auth/delete-account", {
				method: "DELETE",
			});

			if (res.ok) {
				toast.success("Account deleted");
				onLogout();
			} else {
				toast.error("Failed to delete account");
			}
		} catch (error) {
			toast.error("Failed to delete account");
		} finally {
			setIsDeletingAccount(false);
			setShowDeleteConfirm(false);
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Vault Settings</DialogTitle>
						<DialogDescription>
							Manage your vault preferences and security settings.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6 py-4">
						{/* Account Info */}
						<div className="space-y-2">
							<Label className="text-muted-foreground text-xs uppercase tracking-wide">
								Account
							</Label>
							<div className="flex items-center justify-between rounded-lg border p-3">
								<span className="text-sm">{userEmail}</span>
								<Button variant="ghost" size="sm" onClick={onLogout}>
									Sign Out
								</Button>
							</div>
						</div>

						<Separator />

						{/* Security */}
						<div className="space-y-4">
							<Label className="text-muted-foreground text-xs uppercase tracking-wide">
								Security
							</Label>
							<div className="space-y-3">
								<div className="space-y-2">
									<Label htmlFor="current-passcode">Current Passcode</Label>
									<Input
										id="current-passcode"
										type="password"
										value={currentPasscode}
										onChange={(e) => setCurrentPasscode(e.target.value)}
										placeholder="Enter current passcode"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="new-passcode">New Passcode</Label>
									<Input
										id="new-passcode"
										type="password"
										value={newPasscode}
										onChange={(e) => setNewPasscode(e.target.value)}
										placeholder="Enter new passcode"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="confirm-passcode">Confirm New Passcode</Label>
									<Input
										id="confirm-passcode"
										type="password"
										value={confirmPasscode}
										onChange={(e) => setConfirmPasscode(e.target.value)}
										placeholder="Confirm new passcode"
									/>
								</div>
								<Button
									onClick={handleChangePasscode}
									disabled={isChangingPasscode}
									className="w-full"
								>
									{isChangingPasscode ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Changing...
										</>
									) : (
										<>
											<Shield className="mr-2 h-4 w-4" />
											Change Passcode
										</>
									)}
								</Button>
							</div>
						</div>

						<Separator />

						{/* AI Settings */}
						<div className="space-y-4">
							<Label className="text-muted-foreground text-xs uppercase tracking-wide">
								AI Integration
							</Label>
							<p className="text-xs text-muted-foreground">
								Connect your OpenRouter API key to enable AI-powered prompt analysis and variant generation.{" "}
								<a
									href="https://openrouter.ai/keys"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline"
								>
									Get your API key
								</a>
							</p>

							{isLoadingAiSettings ? (
								<div className="flex items-center justify-center py-4">
									<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
								</div>
							) : (
								<div className="space-y-3">
									{/* API Key Status */}
									{hasApiKey && maskedApiKey && (
										<div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/10 p-3">
											<div className="flex items-center gap-2">
												<Check className="h-4 w-4 text-green-500" />
												<span className="text-sm font-mono">{maskedApiKey}</span>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={handleRemoveApiKey}
												className="text-destructive hover:text-destructive"
											>
												Remove
											</Button>
										</div>
									)}

									{/* API Key Input */}
									<div className="space-y-2">
										<Label htmlFor="api-key">
											{hasApiKey ? "Update API Key" : "OpenRouter API Key"}
										</Label>
										<div className="relative">
											<Input
												id="api-key"
												type={showApiKey ? "text" : "password"}
												value={apiKey}
												onChange={(e) => setApiKey(e.target.value)}
												placeholder={hasApiKey ? "Enter new API key to update" : "sk-or-v1-..."}
												className="pr-10"
											/>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
												onClick={() => setShowApiKey(!showApiKey)}
											>
												{showApiKey ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
											</Button>
										</div>
									</div>

							{/* Model Input */}
							<div className="space-y-2">
								<Label htmlFor="ai-model">AI Model</Label>
								<Popover open={openModelCombobox} onOpenChange={setOpenModelCombobox}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											role="combobox"
											aria-expanded={openModelCombobox}
											className="w-full justify-between"
										>
											{aiModel || "Select model..."}
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-[400px] p-0" align="start">
										<Command>
											<CommandInput
												placeholder="Search or enter model..."
												onValueChange={setModelSearch}
											/>
											<CommandList>
												<CommandEmpty>No recent models found.</CommandEmpty>
												<CommandGroup heading="Recent Models">
													{recentAiModels.map((model) => (
														<CommandItem
															key={model}
															value={model}
															onSelect={() => {
																setAiModel(model);
																setOpenModelCombobox(false);
															}}
														>
															<Check
																className={cn(
																	"mr-2 h-4 w-4",
																	aiModel === model
																		? "opacity-100"
																		: "opacity-0",
																)}
															/>
															{model}
														</CommandItem>
													))}
													{modelSearch && !recentAiModels.includes(modelSearch) && (
														<CommandItem
															value={modelSearch}
															onSelect={() => {
																setAiModel(modelSearch);
																setOpenModelCombobox(false);
															}}
														>
															<Check className="mr-2 h-4 w-4 opacity-0" />
															Use "{modelSearch}"
														</CommandItem>
													)}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
								<p className="text-xs text-muted-foreground">
									Enter model ID from{" "}
									<a
										href="https://openrouter.ai/models"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary underline"
									>
										OpenRouter Models
									</a>
								</p>
							</div>									<Button
										onClick={handleSaveAiSettings}
										disabled={isSavingAiSettings}
										className="w-full"
									>
										{isSavingAiSettings ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Bot className="mr-2 h-4 w-4" />
												Save AI Settings
											</>
										)}
									</Button>
								</div>
							)}
						</div>

						<Separator />

						{/* Appearance */}
						<div className="space-y-4">
							<Label className="text-muted-foreground text-xs uppercase tracking-wide">
								Appearance
							</Label>
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Dark Mode</Label>
									<p className="text-xs text-muted-foreground">
										Use dark theme for the interface
									</p>
								</div>
								<Switch
									checked={darkMode}
									onCheckedChange={(checked) => {
										setDarkMode(checked);
										if (checked) {
											document.documentElement.classList.add("dark");
											localStorage.setItem("theme", "dark");
										} else {
											document.documentElement.classList.remove("dark");
											localStorage.setItem("theme", "light");
										}
									}}
								/>
							</div>
						</div>

						<Separator />

						{/* Data Management */}
						<div className="space-y-4">
							<Label className="text-muted-foreground text-xs uppercase tracking-wide">
								Data
							</Label>
							<div className="grid grid-cols-2 gap-2">
								<Button
									variant="outline"
									onClick={() => onExport("json")}
								>
									<Download className="mr-2 h-4 w-4" />
									Export JSON
								</Button>
								<Button
									variant="outline"
									onClick={() => onExport("markdown")}
								>
									<Download className="mr-2 h-4 w-4" />
									Export MD
								</Button>
								<Button
									variant="outline"
									className="col-span-2"
									onClick={onImport}
								>
									<Upload className="mr-2 h-4 w-4" />
									Import Prompts
								</Button>
							</div>
						</div>

						<Separator />

						{/* Danger Zone */}
						<div className="space-y-4">
							<Label className="text-destructive text-xs uppercase tracking-wide">
								Danger Zone
							</Label>
							<Button
								variant="destructive"
								className="w-full"
								onClick={() => setShowDeleteConfirm(true)}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete Account
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Account?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete your
							account and remove all your prompts, tags, and version history.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteAccount}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={isDeletingAccount}
						>
							{isDeletingAccount ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete Account"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
