import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#12100d", color: "#d6b15a", fontSize: 30, fontWeight: 800, border: "5px solid #ce3041", borderRadius: 14 }}>EG</div>,
    { ...size },
  );
}
