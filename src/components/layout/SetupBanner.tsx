"use client";
import { supabaseConfigured } from "@/lib/supabase/client";
import { AlertTriangle } from "lucide-react";

export function SetupBanner() {
  if (supabaseConfigured) return null;

  return (
    <div className="z-50 bg-amber-900/95 border-t border-amber-500/50 backdrop-blur-sm sm:fixed sm:bottom-0 sm:inset-x-0">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 sm:py-3 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
        <p className="text-amber-200 text-sm">
          <span className="font-bold text-amber-400">Setup required:</span>{" "}
          Add your Supabase credentials to{" "}
          <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-300 font-mono text-xs">.env.local</code>{" "}
          The UI is fully rendered, but auth and data features won&apos;t work yet.{" "}
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center underline text-amber-300 hover:text-amber-100 sm:min-h-0"
          >
            Get free Supabase →
          </a>
        </p>
      </div>
    </div>
  );
}
