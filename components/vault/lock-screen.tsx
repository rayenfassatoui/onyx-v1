"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Lock, AlertCircle } from "lucide-react";


interface LockScreenProps {
	onUnlock: () => void;
	mode?: "login" | "register";
	onModeChange?: (mode: "login" | "register") => void;
}

export function LockScreen({ onUnlock, mode = "login", onModeChange }: LockScreenProps) {
	const [passcode, setPasscode] = React.useState("");
	const [confirmPasscode, setConfirmPasscode] = React.useState("");
	const [email, setEmail] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);
	const [isLoading, setIsLoading] = React.useState(false);
	const [shake, setShake] = React.useState(false);
	const [isUnlocking, setIsUnlocking] = React.useState(false);

	const handlePasscodeComplete = async (value: string) => {
		if (mode === "register") {
			if (!confirmPasscode) {
				return; // Wait for confirm passcode
			}
		}

		setIsLoading(true);
		setError(null);

		try {
			const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
			const body = mode === "login" 
				? { email, passcode: value }
				: { email, passcode: value, confirmPasscode };

			const response = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Authentication failed");
			}

			// Success - trigger unlock animation
			setIsUnlocking(true);
			setTimeout(() => {
				onUnlock();
			}, 600);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			setShake(true);
			setPasscode("");
			setConfirmPasscode("");
			setTimeout(() => setShake(false), 500);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (passcode.length !== 4) {
			setError("Please enter a 4-digit passcode");
			return;
		}

		if (mode === "register" && passcode !== confirmPasscode) {
			setError("Passcodes do not match");
			setShake(true);
			setTimeout(() => setShake(false), 500);
			return;
		}

		await handlePasscodeComplete(passcode);
	};

	return (
		<AnimatePresence>
			{!isUnlocking && (
				<motion.div
					initial={{ opacity: 1 }}
					exit={{ opacity: 0, scale: 1.1 }}
					transition={{ duration: 0.5, ease: "easeOut" }}
					className="fixed inset-0 z-50 flex items-center justify-center bg-background"
				>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: 0.1 }}
						className="flex flex-col items-center gap-8 p-8"
					>
						{/* Logo / Brand */}
						<div className="flex flex-col items-center gap-6">
							
							<div className="text-center space-y-2">
								<h1 className="text-3xl font-light tracking-[0.3em] uppercase text-foreground">Onyx Vault</h1>
								<p className="text-sm text-muted-foreground tracking-widest uppercase text-[10px]">
									{mode === "login" ? "System Locked" : "Initialize System"}
								</p>
							</div>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
							{/* Email Input */}
							<div className="w-full max-w-xs">
								<input
									type="email"
									placeholder="Enter your email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
									required
								/>
							</div>

							{/* Passcode Input */}
							<motion.div
								animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
								transition={{ duration: 0.4 }}
							>
								<div className="flex flex-col items-center gap-2">
									<label className="text-xs text-muted-foreground">
										{mode === "register" ? "Create Passcode" : "Passcode"}
									</label>
									<InputOTP
										maxLength={4}
										value={passcode}
										onChange={setPasscode}
										disabled={isLoading}
									>
										<InputOTPGroup>
											<InputOTPSlot index={0} className="h-14 w-14 text-xl" />
											<InputOTPSlot index={1} className="h-14 w-14 text-xl" />
											<InputOTPSlot index={2} className="h-14 w-14 text-xl" />
											<InputOTPSlot index={3} className="h-14 w-14 text-xl" />
										</InputOTPGroup>
									</InputOTP>
								</div>
							</motion.div>

							{/* Confirm Passcode (Register only) */}
							{mode === "register" && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
								>
									<div className="flex flex-col items-center gap-2">
										<label className="text-xs text-muted-foreground">Confirm Passcode</label>
										<InputOTP
											maxLength={4}
											value={confirmPasscode}
											onChange={setConfirmPasscode}
											disabled={isLoading}
										>
											<InputOTPGroup>
												<InputOTPSlot index={0} className="h-14 w-14 text-xl" />
												<InputOTPSlot index={1} className="h-14 w-14 text-xl" />
												<InputOTPSlot index={2} className="h-14 w-14 text-xl" />
												<InputOTPSlot index={3} className="h-14 w-14 text-xl" />
											</InputOTPGroup>
										</InputOTP>
									</div>
								</motion.div>
							)}

							{/* Error Message */}
							<AnimatePresence>
								{error && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										className="flex items-center gap-2 text-sm text-destructive"
									>
										<AlertCircle className="h-4 w-4" />
										{error}
									</motion.div>
								)}
							</AnimatePresence>

							{/* Submit Button */}
							<Button
								type="submit"
								disabled={isLoading || passcode.length !== 4 || (mode === "register" && confirmPasscode.length !== 4)}
								className="w-full max-w-xs"
							>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{mode === "login" ? "Unlocking..." : "Creating..."}
									</>
								) : (
									mode === "login" ? "Unlock Vault" : "Create Vault"
								)}
							</Button>
						</form>

						{/* Mode Toggle */}
						<div className="text-sm text-muted-foreground">
							{mode === "login" ? (
								<>
									Don't have an account?{" "}
									<button
										type="button"
										onClick={() => onModeChange?.("register")}
										className="text-primary underline-offset-4 hover:underline"
									>
										Create one
									</button>
								</>
							) : (
								<>
									Already have an account?{" "}
									<button
										type="button"
										onClick={() => onModeChange?.("login")}
										className="text-primary underline-offset-4 hover:underline"
									>
										Sign in
									</button>
								</>
							)}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
