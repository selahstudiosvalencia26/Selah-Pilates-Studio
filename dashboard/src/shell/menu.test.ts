import { describe, expect, it } from "vitest";
import { EVERYTHING, permissionsOf } from "@/kit/permissions";
import { loadSystems } from "./registry";
import { SAMPLE_CANDIDATES } from "./systems/sample";
import { activeSection, buildMenu, sectionsOf } from "./menu";

const { systems } = loadSystems(SAMPLE_CANDIDATES);
const PILOT = ["booking", "content", "payments"];

// These tests do not list every system, so adding a system never breaks them.
describe("the systems that are added", () => {
  it("all pass the install check", () => {
    expect(loadSystems().failed).toEqual([]);
  });

  it("include the three pilot systems", () => {
    expect(systems.map((s) => s.id)).toEqual(expect.arrayContaining(PILOT));
  });
});

describe("the menu", () => {
  it("shows every system to the owner", () => {
    expect(buildMenu(systems, permissionsOf([[EVERYTHING]])).map((m) => m.id)).toEqual(systems.map((s) => s.id));
  });

  it("shows only what the person may see", () => {
    const front = permissionsOf([["booking.view", "booking.edit"]]);
    expect(buildMenu(systems, front).map((m) => m.id)).toEqual(["booking"]);
  });

  it("shows nothing to someone with no permissions", () => {
    expect(buildMenu(systems, permissionsOf([]))).toEqual([]);
  });
});

describe("a system that fails the check", () => {
  it("stays off and says why, and does not stop the others", () => {
    const payments = systems.find((s) => s.id === "payments");
    const { systems: on, failed } = loadSystems([
      { folder: "booking", manifest: { id: "booking" } },
      { folder: "payments", manifest: payments },
    ]);
    expect(failed.map((f) => f.folder)).toEqual(["booking"]);
    expect(failed[0].problems.length).toBeGreaterThan(0);
    expect(on.map((s) => s.id)).toEqual(["payments"]);
  });
});

describe("a system's own sections", () => {
  const booking = systems.find((s) => s.id === "booking")!;
  const owner = permissionsOf([[EVERYTHING]]);

  it("lists every section to someone who may see them all, in order", () => {
    expect(sectionsOf(booking, owner).map((s) => s.title)).toEqual(["All bookings", "Calendar", "Settings"]);
  });

  it("lists only the sections a person is allowed to open", () => {
    const front = permissionsOf([["booking.view", "booking.edit"]]);
    expect(sectionsOf(booking, front).map((s) => s.title)).toEqual(["All bookings", "Calendar"]);
  });

  it("gives the menu a sub-menu only when there is more than one section", () => {
    const only = permissionsOf([["booking.view"], ["content.view"]]);
    expect(buildMenu(systems, owner).find((m) => m.id === "booking")?.children?.length).toBe(3);
    const payments = permissionsOf([["payments.view"]]);
    expect(buildMenu(systems, payments).find((m) => m.id === "payments")?.children).toBeUndefined();
    expect(only.size).toBeGreaterThan(0);
  });

  it("marks one section as the current one, the closest match", () => {
    const kids = sectionsOf(booking, owner);
    expect(activeSection(kids, "/booking")).toBe("/booking");
    expect(activeSection(kids, "/booking/settings")).toBe("/booking/settings");
    expect(activeSection(kids, "/booking/123")).toBe("/booking");
    expect(activeSection(kids, "/payments")).toBeNull();
  });
});
