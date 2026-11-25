import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The screens are written in JSX. Next.js builds it itself; the tests that draw a component to look at its HTML need it understood here too.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts", "tests/**/*.test.ts"], environment: "node" },
});
