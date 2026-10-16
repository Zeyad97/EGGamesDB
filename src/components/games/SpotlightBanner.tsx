import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronRight, Gamepad2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Game } from "@/types";

interface SpotlightBannerProps {
  game: Game;
  locale: string;
}

/** Compact featured strip above catalog results — one row, never a hero. */
export function SpotlightBanner({ game, locale }: SpotlightBannerProps) {
  const t = useTranslations("home");
  const tg = useTranslations("games");
  const title = locale === "ar" && game.title_ar ? game.title_ar : game.title;
  const image = game.screenshots?.[0]?.path_full || game.header_image || game.capsule_image;

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group mb-5 flex items-center gap-3 border border-eg-border bg-eg-card p-2.5 transition-colors hover:border-eg-border-strong"
    >
      <div className="relative aspect-[231/87] w-32 shrink-0 overflow-hidden bg-eg-surface sm:w-40">
        {image ? (
          <Image src={image} alt="" fill sizes="160px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-eg-muted">
            <Gamepad2 size={18} aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] text-eg-muted">{t("spotlight")}</p>
        <h2 className="truncate text-sm font-semibold text-eg-heading transition-colors group-hover:text-eg-blue">
          {title}
        </h2>
        <p className="truncate text-[11px] text-eg-muted">{game.developer_name}</p>
      </div>

      <span className="ms-auto hidden shrink-0 items-center gap-1 pe-1 text-xs text-eg-blue sm:flex">
        {tg("view_game")}
        <ChevronRight size={13} className="rtl:rotate-180" aria-hidden="true" />
      </span>
    </Link>
  );
}
