import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EGGameDB — Egyptian Games Database",
    short_name: "EGGameDB",
    description: "Discover games made in Egypt and Egyptian indie games.",
    start_url: "/en",
    display: "standalone",
    background_color: "#12100d",
    theme_color: "#12100d",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}
