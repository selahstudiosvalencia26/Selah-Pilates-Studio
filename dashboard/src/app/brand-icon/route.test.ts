import { describe, expect, it } from "vitest";
import { savePracticeBranding } from "@/shell/branding/server";
import { DEFAULT_BRANDING } from "@/shell/branding/branding";
import { GET } from "./route";

// The tab icon a business gets before it has a logo (brand-icon/route.ts).
const iconFor = async (name: string) => {
  savePracticeBranding({ ...DEFAULT_BRANDING, name });
  const r = await GET();
  return { type: r.headers.get("content-type"), body: await r.text() };
};

describe("the tab icon before there is a logo", () => {
  it("is an image with the business's first letter, in capitals", async () => {
    const { type, body } = await iconFor("dan cafe");
    expect(type).toBe("image/svg+xml");
    expect(body).toContain(">D</text>");
  });
  it("follows a changed name", async () => expect((await iconFor("Selah Pilates")).body).toContain(">S</text>"));
  it("shows a whole letter even when the name starts with an emoji or an accent", async () => {
    expect((await iconFor("Éclair")).body).toContain(">É</text>");
    expect((await iconFor("🍰 Cakes")).body).toContain(">🍰</text>");
  });
  it("cannot be used to put markup on the page", async () => {
    const { body } = await iconFor("<script>alert(1)</script>");
    expect(body).not.toContain("<script");
    expect(body).toContain("&lt;");
  });
});
