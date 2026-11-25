import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist } from "next/font/google";
import { brandingVars } from "@/shell/branding/branding";
import { getBranding } from "@/shell/branding/server";
import "./globals.css";

// One family for everything. It is downloaded once when the app is built and served from the app itself.
const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

// The tab shows the client's own name and their logo as the tab icon (or, until they add one, their first letter). Read on the server, so it is right
// from the first paint.
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBranding();
  return {
    title: brand.name,
    description: "Your business dashboard.",
    robots: { index: false, follow: false },
    // The logo if there is one; until then the first letter on a tile (brand-icon/route.ts). The first letter is in the address, so a changed name is a new icon to the browser.
    icons: { icon: brand.logoUrl ?? `/brand-icon?l=${encodeURIComponent(Array.from(brand.name.trim())[0] ?? "")}` },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// The person's light or dark choice is read on the server, so the very first paint is already the right colour and
// nothing flashes. With no choice made, the page follows the device (see globals.css).
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const saved = (await cookies()).get("theme")?.value;
  const theme = saved === "light" || saved === "dark" ? saved : undefined;
  // The client's accent colour is set on the page by the server, so the first paint already has it.
  const brand = await getBranding();
  return (
    <html
      lang="en"
      className={sans.variable}
      data-theme={theme}
      style={brandingVars(brand.accent) as React.CSSProperties}
    >
      <body>{children}</body>
    </html>
  );
}
