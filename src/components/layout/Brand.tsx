import { cn } from "@/lib/utils";

/**
 * Compact Egyptian flag with a gold Eagle of Saladin centered in the white band.
 * It stays decorative because the surrounding wordmark or label provides its identity.
 */
export function EgyptFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 13"
      className={cn("inline-block h-[13px] w-5 shrink-0 text-eg-gold", className)}
      aria-hidden="true"
      focusable="false"
      shapeRendering="geometricPrecision"
    >
      <rect width="20" height="4" fill="#c8102e" />
      <rect y="4" width="20" height="5" fill="#f4f4f4" />
      <rect y="9" width="20" height="4" fill="#151515" />
      <g fill="currentColor">
        <path d="M9.55 5.35 8.15 5.05 6.15 4.9l.82.67-1.38-.26 1.4.82-1.08-.03 2.36.67 1.2-.39Z" />
        <path d="m10.45 5.35 1.4-.3 2-.15-.82.67 1.38-.26-1.4.82 1.08-.03-2.36.67-1.2-.39Z" />
        <path d="M9.63 5.38c.1-.38.24-.58.37-.7c.13.12.27.32.37.7l-.17.27.16 1.62.7.78H8.94l.7-.78.16-1.62-.17-.27Z" />
        <circle cx="10" cy="5.1" r="0.32" />
        <path d="m9.68 7.48-.78.88L10 8.1l1.1.26-.78-.88Z" />
      </g>
    </svg>
  );
}

/** Original EGGameDB wordmark: plain type, no mascot, no badge. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="text-[15px] font-semibold leading-none tracking-tight text-white">
        EG<span className="text-eg-blue">Game</span>DB
      </span>
      <EgyptFlag />
    </span>
  );
}
