import type { NextConfig } from "next";

// Security headers for every page (see docs/rules/security.md, section 2).
const dev = process.env.NODE_ENV !== "production";
// The logos live in the client's Supabase storage, so that one address may serve images. Nothing else outside is allowed.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";

// Content policy: the page may only load its own scripts, styles and images (plus the logo address), may not be framed,
// and forms may only post to itself. Next.js needs inline scripts and styles to start the page, so those stay allowed
// until a per-request nonce is added; that is the one known gap. While developing it also needs eval and the live-reload socket.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://tile.openstreetmap.org${supabase ? ` ${supabase}` : ""}`,
  "font-src 'self'",
  `connect-src 'self'${supabase ? ` ${supabase}` : ""}${dev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // The server does not announce what software it runs.
  poweredByHeader: false,
  // Files read while running must travel with the live build: the business details (setup/), the database files the Systems page
  // shows, and the website's starting words and photos.
  outputFileTracingIncludes: {
    "/**": ["./setup/**", "./supabase/migrations/*.sql", "./src/systems/*/migrations/*.sql", "../content/data/*.json", "../public/uploads/photos/*"],
  },
  // A photo save carries a few small pictures (Vercel itself stops at 4.5 MB).
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // While developing, Next.js shows a small round badge. Keep it off the bottom-left corner, where the menu's collapse
  // button and the signed-in person live.
  devIndicators: { position: "bottom-right" },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
