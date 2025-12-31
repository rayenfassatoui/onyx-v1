import * as React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({ className, textClassName, showText = true, ...props }: LogoProps) {
  return (
    <div className="flex items-center gap-3 select-none">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("text-primary", className)}
        {...props}
      >
        <path
          d="M16 2L2 9V23L16 30L30 23V9L16 2Z"
          className="fill-primary/10 stroke-primary"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M16 6L6 11.5V20.5L16 26L26 20.5V11.5L16 6Z"
          className="fill-primary/20"
        />
        <path
          d="M16 10L10 13.5V18.5L16 22L22 18.5V13.5L16 10Z"
          className="fill-primary"
        />
      </svg>
      {showText && (
        <span className={cn("font-mono text-xl font-bold tracking-[0.2em] uppercase text-foreground", textClassName)}>
          Onyx
        </span>
      )}
    </div>
  );
}
