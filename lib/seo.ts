import type { Metadata } from "next";
import { site } from "@/content/site";

// The site's public address, used by search engines and link previews. Set NEXT_PUBLIC_SITE_URL to the domain when publishing.
// On Vercel, until then, its own production address is used.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export function pageMeta(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: site.name,
      type: "website",
      locale: "en_PH",
      images: [
        { url: "/opengraph-image", width: 1200, height: 630, alt: site.name },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}
