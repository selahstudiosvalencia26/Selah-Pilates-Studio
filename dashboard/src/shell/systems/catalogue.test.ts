import { describe, expect, it } from "vitest";
import { isIconName } from "@/kit/iconNames";
import { CATALOGUE, notAdded, offerFor } from "./catalogue";

describe("the ready-made systems", () => {
  it("each has a unique system word and an icon the dashboard has", () => {
    expect(new Set(CATALOGUE.map((o) => o.id)).size).toBe(CATALOGUE.length);
    for (const o of CATALOGUE) {
      expect(o.id, o.id).toMatch(/^[a-z]{2,20}$/);
      expect(isIconName(o.icon), `${o.id} icon`).toBe(true);
    }
  });

  it("does not offer Website again when a client has their own website system", () => {
    expect(notAdded(["website"]).map((o) => o.id)).not.toContain("content");
    expect(offerFor("website")?.name).toBe("Website");
  });

  it("lists only what is not added yet", () => {
    const left = notAdded(["booking", "content", "payments"]).map((o) => o.id);
    expect(left).not.toContain("booking");
    expect(left).toContain("customers");
    expect(notAdded([]).length).toBe(CATALOGUE.length);
  });
});
