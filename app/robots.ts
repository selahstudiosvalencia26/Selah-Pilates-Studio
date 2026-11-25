import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // Everyone may read the site, including the crawlers of AI assistants, so they can answer questions about the studio correctly.
    rules: [
      { userAgent: "*", allow: "/" },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-User",
          "PerplexityBot",
          "Google-Extended",
        ],
        allow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
