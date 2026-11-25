import { describe, expect, it } from "vitest";
import { applyOrder, moveId, type MenuItem } from "./menu";

const item = (id: string, group: MenuItem["group"]): MenuItem => ({ id, title: id, href: `/${id}`, icon: "box", group });
const items = [item("today", "general"), item("booking", "systems"), item("content", "systems"), item("payments", "systems"), item("people", "manage")];

describe("the menu order", () => {
  it("puts systems in the owner's order and leaves Today and the owner's pages where they are", () => {
    expect(applyOrder(items, ["payments", "booking", "content"]).map((i) => i.id)).toEqual(["today", "payments", "booking", "content", "people"]);
  });

  it("keeps a system the owner has not placed yet after the ones they have", () => {
    expect(applyOrder(items, ["payments"]).map((i) => i.id)).toEqual(["today", "payments", "booking", "content", "people"]);
  });

  it("ignores names that are not systems any more", () => {
    expect(applyOrder(items, ["gone", "content"]).map((i) => i.id)).toEqual(["today", "content", "booking", "payments", "people"]);
  });

  it("moves one up or down, and stops at the ends", () => {
    expect(moveId(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveId(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
    const same = ["a", "b"];
    expect(moveId(same, "a", -1)).toBe(same);
    expect(moveId(same, "b", 1)).toBe(same);
  });
});
