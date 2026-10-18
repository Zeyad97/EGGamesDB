import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

interface StudioLogoProps {
  name: string;
  logoUrl: string | null;
  className?: string;
  /** Rendered size hint for the image optimizer. */
  sizes?: string;
}

/**
 * Square logo tile. `object-contain` keeps the whole mark visible on a subtle
 * surface. Without a logo it shows a gold monogram of the studio initials.
 * Local `/studios/*` and Supabase storage URLs go through next/image; any other
 * https URL is served unoptimized so an unexpected host can never break the page.
 */
export function StudioLogo({ name, logoUrl, className, sizes = "96px" }: StudioLogoProps) {
  const optimizable = !!logoUrl && (logoUrl.startsWith("/") || /\.supabase\.co\/storage\/v1\/object\/public\//.test(logoUrl));
  return (
    <div className={cn("relative aspect-square overflow-hidden border border-eg-border bg-eg-surface", className)}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          fill
          sizes={sizes}
          unoptimized={!optimizable}
          className="object-contain p-1.5"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-lg font-black tracking-wide text-eg-gold" aria-hidden="true">
          {getInitials(name) || "?"}
        </span>
      )}
    </div>
  );
}
