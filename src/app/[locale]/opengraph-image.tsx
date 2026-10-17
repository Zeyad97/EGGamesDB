import { ImageResponse } from "next/og";

export const alt = "EGGameDB — Egyptian Games Database";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, boxSizing: "border-box", background: "#12100d", color: "#f4efe4" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: "#d6b15a" }} />
      <div style={{ position: "absolute", top: 12, left: 0, width: 220, height: 8, background: "#ce3041" }} />
      <div style={{ color: "#d6b15a", fontSize: 42, fontWeight: 800, marginBottom: 28 }}>EGGameDB</div>
      <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.2 }}>Egyptian Games Database</div>
      <div style={{ marginTop: 24, fontSize: 28, color: "#d6b15a" }}>Games made in Egypt · eggamedb.com</div>
      <div style={{ position: "absolute", bottom: 54, left: 80, right: 80, height: 2, background: "#ce3041" }} />
    </div>,
    { ...size },
  );
}
