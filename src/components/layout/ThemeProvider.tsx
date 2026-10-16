"use client";
import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("eggamedb-theme", "dark");
  }, []);

  return <>{children}</>;
}
