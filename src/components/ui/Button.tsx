"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-eg-blue text-eg-darker hover:bg-eg-accent-hover",
  secondary: "border border-eg-border bg-eg-surface text-eg-text hover:border-eg-border-strong hover:text-eg-heading",
  ghost: "text-eg-text-sub hover:bg-white/[0.06] hover:text-eg-heading",
  danger: "bg-eg-red text-white hover:bg-[#e04a56]",
  outline: "border border-eg-blue/50 text-eg-blue hover:bg-eg-blue/10",
  success: "bg-eg-green text-[#131c0c] font-semibold hover:bg-[#b4dd63]",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-9 px-3.5 text-[13px]",
  lg: "h-11 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      )}
      <span className={cn("inline-flex items-center gap-2", loading && "opacity-0")}>{children}</span>
    </button>
  )
);
Button.displayName = "Button";
