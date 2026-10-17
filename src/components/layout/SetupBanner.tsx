"use client";
import { supabaseConfigured } from "@/lib/supabase/client";
import { AlertTriangle } from "lucide-react";

export function SetupBanner() {
  if (supabaseConfigured) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-amber-900/95 border-t border-amber-500/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
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
            className="underline text-amber-300 hover:text-amber-100"
          >
            Get free Supabase →
          </a>
        </p>
      </div>
    </div>
  );
}
