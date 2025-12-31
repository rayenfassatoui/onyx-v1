import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({ className, textClassName, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center select-none", className)}>
      {showText && (
        <span className={cn("font-mono text-xl font-bold tracking-[0.2em] uppercase text-foreground", textClassName)}>
          Onyx
        </span>
      )}
    </div>
  );
}
