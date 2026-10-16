import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "gold" | "green" | "red" | "blue" | "outline";
  className?: string;
}

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "border-eg-border bg-white/[0.04] text-eg-text-sub",
  gold: "border-eg-gold/40 bg-eg-gold/10 text-eg-gold",
  green: "border-eg-green/30 bg-eg-green/10 text-eg-green",
  red: "border-eg-red/40 bg-eg-red/10 text-red-300",
  blue: "border-eg-blue/30 bg-eg-blue/10 text-eg-blue",
  outline: "border-eg-border text-eg-muted",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] leading-4",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
