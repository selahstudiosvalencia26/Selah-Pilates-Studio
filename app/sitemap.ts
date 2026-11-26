import type { MetadataRoute } from "next";
import { posts } from "@/content/blog";
import { pages } from "@/content/pages";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p.href === "/" ? "" : p.href}` })),
    { url: `${siteUrl}/privacy` },
    ...posts().map((p) => ({ url: `${siteUrl}/blog/${p.slug}`, lastModified: p.date })),
  ];
}
