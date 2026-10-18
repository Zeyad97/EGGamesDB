import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EGGameDB: Egyptian Games Database",
    short_name: "EGGameDB",
    description: "Discover games made in Egypt and Egyptian indie games.",
    start_url: "/en",
    display: "standalone",
    background_color: "#12100d",
    theme_color: "#12100d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
