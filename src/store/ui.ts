import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  crtEffect: boolean;
  scanlines: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleCRT: () => void;
  toggleScanlines: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      crtEffect: false,
      scanlines: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleCRT: () => set((s) => ({ crtEffect: !s.crtEffect })),
      toggleScanlines: () => set((s) => ({ scanlines: !s.scanlines })),
    }),
    { name: "eggamedb-ui" }
  )
);
