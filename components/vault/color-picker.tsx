"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
	{ name: "Red", value: "#ef4444" },
	{ name: "Orange", value: "#f97316" },
	{ name: "Amber", value: "#f59e0b" },
	{ name: "Yellow", value: "#eab308" },
	{ name: "Lime", value: "#84cc16" },
	{ name: "Green", value: "#22c55e" },
	{ name: "Emerald", value: "#10b981" },
	{ name: "Teal", value: "#14b8a6" },
	{ name: "Cyan", value: "#06b6d4" },
	{ name: "Sky", value: "#0ea5e9" },
	{ name: "Blue", value: "#3b82f6" },
	{ name: "Indigo", value: "#6366f1" },
	{ name: "Violet", value: "#8b5cf6" },
	{ name: "Purple", value: "#a855f7" },
	{ name: "Fuchsia", value: "#d946ef" },
	{ name: "Pink", value: "#ec4899" },
	{ name: "Rose", value: "#f43f5e" },
	{ name: "Slate", value: "#64748b" },
];

interface ColorPickerProps {
	value: string;
	onChange: (color: string) => void;
	className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
	const [open, setOpen] = React.useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn("w-10 h-10 p-0 border-2", className)}
					style={{ backgroundColor: value }}
				>
					<span className="sr-only">Pick a color</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3" align="start">
				<div className="grid grid-cols-6 gap-2">
					{PRESET_COLORS.map((color) => (
						<button
							key={color.value}
							type="button"
							className={cn(
								"w-8 h-8 rounded-md border-2 transition-all hover:scale-110",
								value === color.value
									? "border-foreground ring-2 ring-offset-2 ring-foreground"
									: "border-transparent"
							)}
							style={{ backgroundColor: color.value }}
							onClick={() => {
								onChange(color.value);
								setOpen(false);
							}}
							title={color.name}
						/>
					))}
				</div>
				<div className="mt-3 pt-3 border-t">
					<label className="text-xs text-muted-foreground">Custom Color</label>
					<div className="flex gap-2 mt-1">
						<input
							type="color"
							value={value}
							onChange={(e) => onChange(e.target.value)}
							className="w-10 h-8 rounded border cursor-pointer"
						/>
						<input
							type="text"
							value={value}
							onChange={(e) => onChange(e.target.value)}
							className="flex-1 px-2 text-sm border rounded bg-background"
							placeholder="#000000"
						/>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
