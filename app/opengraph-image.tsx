import { ImageResponse } from "next/og";
import { site } from "@/content/site";

// The picture shown when a link to the website is shared (Messenger, Facebook and so on): the studio's name and slogan.
export const alt = "Selah Pilates Studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 90,
        background: "#1b2a35",
        color: "#ffffff",
      }}
    >
      <div style={{ fontSize: 30, letterSpacing: 8, color: "#9cc3da" }}>
        {`${site.address.city}, ${site.address.province}`.toUpperCase()}
      </div>
      <div style={{ marginTop: 28, fontSize: 92, lineHeight: 1.05 }}>
        {site.name}
      </div>
      {site.tagline ? (
        <div style={{ marginTop: 28, fontSize: 44, color: "#d9e8f1" }}>
          {site.tagline}
        </div>
      ) : null}
    </div>,
    size,
  );
}
