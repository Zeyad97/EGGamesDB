"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { PlayCircle } from "lucide-react";
import type { Video } from "@/types";

interface GameVideosProps {
  videos: Video[];
  title: string;
}

function videoEmbedUrl(video: Video): string | null {
  if (video.youtube_id) {
    return `https://www.youtube-nocookie.com/embed/${video.youtube_id}?rel=0&autoplay=1`;
  }
  if (video.vimeo_id) {
    return `https://player.vimeo.com/video/${video.vimeo_id}?autoplay=1`;
  }
  return null;
}

export function GameVideos({ videos, title }: GameVideosProps) {
  const t = useTranslations("games");
  const [active, setActive] = useState(0);

  if (!videos.length) return null;

  const playable = videos.filter(
    (v) => videoEmbedUrl(v) || v.mp4_url || v.webm_url
  );
  if (!playable.length) return null;

  const current = playable[active];
  const embedUrl = videoEmbedUrl(current);

  return (
    <div id="video" className="scroll-mt-28">
      <h2 className="store-title mb-3">{t("videos")}</h2>

      {/* Player */}
      <div className="relative aspect-video overflow-hidden border border-eg-border bg-black">
        <div className="absolute inset-0">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`${title} video ${active + 1}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : current.mp4_url || current.webm_url ? (
            <video
              key={current.mp4_url ?? current.webm_url ?? ""}
              src={current.mp4_url ?? current.webm_url ?? undefined}
              poster={current.thumbnail ?? undefined}
              controls
              autoPlay
              playsInline
              className="h-full w-full"
            />
          ) : null}
        </div>
      </div>

      {/* Thumbnails */}
      {playable.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {playable.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className={`relative aspect-video w-36 shrink-0 overflow-hidden border transition-opacity ${
                i === active
                  ? "border-eg-blue opacity-100"
                  : "border-eg-border opacity-60 hover:opacity-100"
              }`}
            >
              {v.thumbnail ? (
                <Image src={v.thumbnail} alt="" fill sizes="144px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-eg-surface">
                  <PlayCircle size={20} className="text-eg-muted" aria-hidden="true" />
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                <PlayCircle size={24} className="text-white" aria-hidden="true" />
              </span>
              {v.name && (
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                  {v.name}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
