"use client";
import { useEffect } from "react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import type { Profile } from "@/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Skip auth entirely if Supabase isn't configured yet
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile(data as Profile | null);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
