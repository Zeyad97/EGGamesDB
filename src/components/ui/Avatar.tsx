import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 };
const textSizes = { xs: "text-xs", sm: "text-xs", md: "text-sm", lg: "text-lg", xl: "text-2xl" };

export function Avatar({ src, name = "?", size = "md", className }: AvatarProps) {
  const px = sizes[size];
  const initials = getInitials(name);

  return (
    <div
      style={{ width: px, height: px }}
      className={cn("relative rounded-full overflow-hidden flex-shrink-0 border border-eg-border", className)}
    >
      {src ? (
        <Image src={src} alt={name} fill className="object-cover" />
      ) : (
        <div className={cn("w-full h-full flex items-center justify-center bg-eg-surface font-semibold text-eg-text-sub", textSizes[size])}>
          {initials}
        </div>
      )}
    </div>
  );
}
