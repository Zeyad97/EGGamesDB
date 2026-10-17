import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#12100d", color: "#d6b15a", fontSize: 86, fontWeight: 800, border: "12px solid #ce3041", borderRadius: 40 }}>EG</div>,
    { ...size },
  );
}
