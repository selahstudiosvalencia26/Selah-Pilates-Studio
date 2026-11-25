import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import type { NextConfig } from "next";

// The dashboard saves its changes to content/local (never committed). While developing, a file there replaces the committed file
// of the same name (content/data/*.json), so you see the dashboard's changes locally. A build for the live site (npm run build)
// never does this: it only ever reads the committed files.
const LOCAL = resolve(process.cwd(), "content", "local");
const isOurs = (request: string, context: string) =>
  !context.includes("node_modules") && request.startsWith("./data/");

const nextConfig: NextConfig = {
  // Checks (npm run check) build into their own folder, so they never break a running dev server.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  webpack(config, { dev, webpack }) {
    if (dev) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /\.json$/,
          (resource: {
            request: string;
            context: string;
            cacheable?: boolean;
            missingDependencies?: { add: (path: string) => void };
          }) => {
            if (!isOurs(resource.request, resource.context)) return;
            const local = resolve(LOCAL, basename(resource.request));
            if (existsSync(local)) {
              resource.request = local;
            } else {
              // No local copy yet. The dashboard may save one while the site is running, so watch for it and do not let
              // webpack remember this lookup.
              resource.missingDependencies?.add(local);
              resource.cacheable = false;
            }
          },
        ),
      );
    }
    return config;
  },
};

export default nextConfig;
