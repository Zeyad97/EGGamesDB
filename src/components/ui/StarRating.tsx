"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  max?: number;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({ value = 0, onChange, max = 10, readonly, size = "md" }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const display = hovered || value;

  return (
    <div className="flex gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn(
            "transition-all duration-100",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
            size === "sm" && "text-base",
            size === "md" && "text-xl",
            size === "lg" && "text-2xl"
          )}
        >
          <span className={star <= display ? "text-eg-gold" : "text-eg-muted"}>★</span>
        </button>
      ))}
    </div>
  );
}
