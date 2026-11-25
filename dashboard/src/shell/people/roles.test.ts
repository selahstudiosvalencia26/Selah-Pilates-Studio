import { describe, expect, it } from "vitest";
import { EVERYTHING, permissionsOf } from "@/kit/permissions";
import { loadSystems } from "@/shell/registry";
import { SAMPLE_CANDIDATES } from "@/shell/systems/sample";
import { accessSummary, defaultRoles, describeLevel, isSensitive, levelOf, levelsFor, coveredBy, dropCovered, permissionRows, roleBlurb, setLevel, setPermission, type Person, type Role } from "./roles";

const { systems } = loadSystems(SAMPLE_CANDIDATES);
const roles = defaultRoles(systems);
const role = (id: string) => roles.find((r) => r.id === id)!;

describe("the starting roles", () => {
  it("are Owner, Manager and Staff, with Owner locked and holding everything", () => {
    expect(roles.map((r) => r.name)).toEqual(["Owner", "Manager", "Staff"]);
    expect(role("owner")).toMatchObject({ locked: true, permissions: [EVERYTHING] });
  });

  it("fill Manager and Staff from what each system says", () => {
    expect(role("manager").permissions).toContain("booking.approve");
    expect(role("staff").permissions).toContain("booking.edit");
    expect(role("staff").permissions).not.toContain("booking.approve");
    expect(role("staff").permissions).not.toContain("booking.delete");
  });
});

describe("the permission grid", () => {
  it("lists every system's permissions in plain words, and marks the ones that ask for confirmation", () => {
    const rows = permissionRows(systems);
    expect(rows.map((s) => s.system)).toEqual(expect.arrayContaining(["booking", "content", "payments"]));
    const booking = rows.find((s) => s.system === "booking")!;
    expect(booking.rows.find((r) => r.id === "booking.view")).toEqual({ id: "booking.view", label: "See bookings", sensitive: false });
    expect(booking.rows.find((r) => r.id === "booking.delete")?.sensitive).toBe(true);
    expect(isSensitive("payments.approve")).toBe(true);
    expect(isSensitive("payments.edit")).toBe(false);
  });
});

describe("changing a role", () => {
  it("ticks and unticks a permission", () => {
    const more = setPermission(role("staff"), "booking.approve", true);
    expect(more.permissions).toContain("booking.approve");
    expect(setPermission(more, "booking.approve", false).permissions).not.toContain("booking.approve");
  });

  it("never changes the Owner role", () => {
    expect(setPermission(role("owner"), "booking.view", false)).toBe(role("owner"));
  });

  it("does not let someone give a role more than they have", () => {
    const manager = permissionsOf([["booking.view", "booking.edit"]]);
    expect(setPermission(role("staff"), "booking.delete", true, manager)).toBe(role("staff"));
    expect(setPermission(role("staff"), "booking.view", true, manager)).toBe(role("staff")); // already has it
  });

  it("ignores anything that is not a real permission", () => {
    expect(setPermission(role("staff"), "booking.fly", true)).toBe(role("staff"));
  });
});

describe("what a person can do", () => {
  const person = (roleIds: string[]): Person => ({ id: "p", name: "Ana", email: "ana@example.com", roles: roleIds, status: "active" });

  it("says it in words, per system", () => {
    const sum = accessSummary(person(["staff"]), roles, systems);
    expect(sum.find((s) => s.name === "Bookings")?.actions).toEqual(["see", "change"]);
  });

  it("adds up across roles", () => {
    const cashier = { id: "cashier", name: "Cashier", builtin: false, locked: false, permissions: ["payments.view", "payments.edit"] };
    const only = accessSummary(person(["cashier"]), [...roles, cashier], systems);
    expect(only).toEqual([{ name: "Payments", actions: ["see", "change"] }]);
    const both = accessSummary(person(["cashier", "staff"]), [...roles, cashier], systems);
    expect(both.map((s) => s.name)).toEqual(expect.arrayContaining(["Bookings", "Payments"]));
  });

  it("shows everything for an owner, and nothing for someone with no roles", () => {
    expect(accessSummary(person(["owner"]), roles, systems).length).toBe(systems.length);
    expect(accessSummary(person([]), roles, systems)).toEqual([]);
  });
});

describe("every action needs see", () => {
  const empty: Role = { id: "cashier", name: "Cashier", builtin: false, locked: false, permissions: [] };

  it("ticking an action also ticks see", () => {
    expect(setPermission(empty, "payments.edit", true).permissions.sort()).toEqual(["payments.edit", "payments.view"]);
  });

  it("unticking see clears everything else in that system, and leaves other systems alone", () => {
    const busy: Role = { ...empty, permissions: ["payments.view", "payments.edit", "payments.approve", "booking.view", "booking.edit"] };
    expect(setPermission(busy, "payments.view", false).permissions.sort()).toEqual(["booking.edit", "booking.view"]);
  });

  it("unticking an action keeps see", () => {
    const has: Role = { ...empty, permissions: ["payments.view", "payments.edit"] };
    expect(setPermission(has, "payments.edit", false).permissions).toEqual(["payments.view"]);
  });

  it("does not let someone tick an action when they cannot give see", () => {
    const editor = permissionsOf([["payments.edit"]]);
    expect(setPermission(empty, "payments.edit", true, editor)).toBe(empty);
  });
});

describe("one choice per system", () => {
  const booking = systems.find((s) => s.id === "booking")!;
  const payments = systems.find((s) => s.id === "payments")!;

  it("builds a ladder from what the system declares, each level including the ones below", () => {
    const ids = levelsFor(booking).map((l) => l.id);
    expect(ids[0]).toBe("none");
    expect(ids[1]).toBe("see");
    expect(ids.at(-1)).toBe("full");
    expect(levelsFor(booking).find((l) => l.id === "full")?.permissions).toEqual(booking.permissions.map((p) => p.id));
  });

  it("only offers a level the system can support", () => {
    const small = { ...payments, permissions: payments.permissions.filter((p) => p.id === "payments.view" || p.id === "payments.manage") };
    expect(levelsFor(small).map((l) => l.id)).toEqual(["none", "see", "full"]);
  });

  it("says where a role stands in a system", () => {
    expect(levelOf(role("owner"), booking)).toBe("full");
    expect(levelOf({ ...role("staff"), permissions: ["booking.view", "booking.delete"] }, booking)).toBe("custom");
    expect(levelOf({ ...role("staff"), permissions: ["booking.view"] }, booking)).toBe("see");
  });

  it("sets a level without touching the other systems", () => {
    const before = role("staff").permissions.filter((p) => p.startsWith("payments."));
    const next = setLevel(role("staff"), booking, "change");
    expect(levelOf(next, booking)).toBe("change");
    expect(next.permissions.filter((p) => p.startsWith("payments."))).toEqual(before);
    expect(setLevel(next, booking, "none").permissions.some((p) => p.startsWith("booking."))).toBe(false);
  });

  it("never changes Owner, and never gives more than the editor has", () => {
    expect(setLevel(role("owner"), booking, "none")).toBe(role("owner"));
    const viewer = permissionsOf([["booking.view"]]);
    expect(setLevel(role("staff"), booking, "full", viewer)).toBe(role("staff"));
    expect(levelOf(setLevel(role("staff"), booking, "see", viewer), booking)).toBe("see");
  });

  it("describes a level in the system's own words", () => {
    expect(describeLevel(levelsFor(booking)[1], booking)).toBe("See bookings");
    expect(describeLevel(levelsFor(booking)[0], booking)).toBe("Cannot open this at all.");
  });
});

describe("a sentence for each role", () => {
  it("says what the starting roles are for, and a made-up role is just named as one", () => {
    expect(roleBlurb(role("manager"))).toMatch(/approve/);
    expect(roleBlurb(role("staff"))).toMatch(/cannot approve/);
    expect(roleBlurb({ id: "custom-1", name: "Cashier", builtin: false, locked: false, permissions: [] })).toBe("A role you made.");
  });
});

describe("a role another role already includes", () => {
  const custom = (id: string, permissions: string[]): Role => ({ id, name: id, builtin: false, locked: false, permissions });

  it("is covered: Manager already includes Staff, and Staff does not include Manager", () => {
    expect(coveredBy(role("staff"), [role("manager")])?.id).toBe("manager");
    expect(coveredBy(role("manager"), [role("staff")])).toBeNull();
  });

  it("is covered by Owner, never by itself, and an empty role is never covered", () => {
    expect(coveredBy(role("manager"), [role("owner")])?.id).toBe("owner");
    expect(coveredBy(role("staff"), [role("staff")])).toBeNull();
    expect(coveredBy(custom("blank", []), [role("manager")])).toBeNull();
  });

  it("keeps only one of two identical roles", () => {
    const a = custom("a", ["booking.view"]);
    const b = custom("b", ["booking.view"]);
    expect(dropCovered(["a", "b"], [a, b])).toEqual(["a"]);
  });

  it("drops Staff when Manager is chosen, and keeps roles that cover different things", () => {
    expect(dropCovered(["staff", "manager"], roles)).toEqual(["manager"]);
    const bookings = custom("bookings", ["booking.view", "booking.edit"]);
    const stock = custom("stock", ["inventory.view"]);
    expect(dropCovered(["bookings", "stock"], [bookings, stock])).toEqual(["bookings", "stock"]);
  });
});

describe("the starting roles with nothing installed", () => {
  it("still keep their order: Manager covers Staff even when both lists of permissions are empty", () => {
    const empty = defaultRoles([]);
    const get = (id: string) => empty.find((r) => r.id === id)!;
    expect(get("staff").permissions).toEqual([]);
    expect(coveredBy(get("staff"), [get("manager")])?.id).toBe("manager");
    expect(coveredBy(get("manager"), [get("staff")])).toBeNull();
    expect(dropCovered(["staff", "manager"], empty)).toEqual(["manager"]);
  });
});
