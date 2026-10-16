import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Restrained demo-catalog notice: a single thin gold-accented line that
 * matches the storefront, never a banner. Shown only while demo listings
 * stand in for an empty or unreachable database.
 */
export function DemoNotice({ className }: { className?: string }) {
  const t = useTranslations("demo");

  return (
    <p
      role="note"
      className={cn(
        "border-s-2 border-eg-gold bg-eg-card/60 px-2.5 py-1.5 text-[11px] leading-5 text-eg-text-sub",
        className
      )}
    >
      {t("notice")}
    </p>
  );
}
