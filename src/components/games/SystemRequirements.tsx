"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Monitor } from "lucide-react";
import type { SystemRequirements as SysReq } from "@/types";

interface SystemRequirementsProps {
  windows?: SysReq | null;
  mac?: SysReq | null;
  linux?: SysReq | null;
  locale?: string;
}

function parseReqs(html: string) {
  // Strip HTML tags and split by strong tags
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<strong>/gi, "**")
    .replace(/<\/strong>/gi, "**")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function ReqColumn({ title, content }: { title: string; content: string }) {
  const lines = content.split("\n").filter(Boolean);
  return (
    <div className="req-block flex-1">
      <h4 className="mb-2 text-xs font-semibold text-eg-heading">{title}</h4>
      <ul>
        {lines.map((line, i) => {
          if (line.startsWith("**") && line.endsWith("**")) {
            return <li key={i} className="py-0.5 text-xs font-semibold text-eg-text">{line.slice(2, -2)}</li>;
          }
          return <li key={i} className="py-0.5 text-xs text-eg-text-sub">{line}</li>;
        })}
      </ul>
    </div>
  );
}

export function SystemRequirements({ windows, mac, linux }: SystemRequirementsProps) {
  const t = useTranslations("games");
  const [tab, setTab] = useState<"windows" | "mac" | "linux">("windows");

  const tabs = [
    { key: "windows" as const, label: "Windows", data: windows },
    { key: "mac" as const, label: "macOS", data: mac },
    { key: "linux" as const, label: "Linux", data: linux },
  ].filter((entry) => entry.data);

  if (!tabs.length) return null;

  const active = tabs.find((entry) => entry.key === tab) ?? tabs[0];

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Monitor size={14} className="text-eg-muted" aria-hidden="true" />
        <h2 className="text-[13px] font-semibold text-eg-heading">{t("system_requirements")}</h2>
      </div>

      {tabs.length > 1 && (
        <div className="mb-3 flex gap-1">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              type="button"
              onClick={() => setTab(tabItem.key)}
              aria-pressed={tab === tabItem.key}
              className={
                "rounded-sm border px-2.5 py-1 text-[11px] transition-colors " +
                (tab === tabItem.key
                  ? "border-eg-blue bg-eg-blue/15 text-white"
                  : "border-eg-border bg-eg-card text-eg-text-sub hover:text-white")
              }
            >
              {tabItem.label}
            </button>
          ))}
        </div>
      )}

      {active?.data && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ReqColumn title={t("minimum")} content={parseReqs(active.data.minimum)} />
          {active.data.recommended && (
            <ReqColumn title={t("recommended")} content={parseReqs(active.data.recommended)} />
          )}
        </div>
      )}
    </div>
  );
}
