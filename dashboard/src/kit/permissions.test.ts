import { describe, expect, it } from "vitest";
import { can, canGiveRole, defaultsFor, EVERYTHING, isPermissionId, permissionsOf } from "./permissions";

describe("permission ids", () => {
  it("accepts only system.action with the five actions", () => {
    expect(isPermissionId("booking.view")).toBe(true);
    expect(isPermissionId("booking.manage")).toBe(true);
    expect(isPermissionId("booking.read")).toBe(false);
    expect(isPermissionId("booking")).toBe(false);
    expect(isPermissionId("Booking.view")).toBe(false);
    expect(isPermissionId("booking.view; drop")).toBe(false);
    expect(isPermissionId(undefined)).toBe(false);
  });
});

describe("what a person may do", () => {
  const staff = permissionsOf([["booking.view", "booking.edit"], ["payments.view"]]);

  it("adds up the permissions of every role", () => {
    expect(can(staff, "booking.edit")).toBe(true);
    expect(can(staff, "payments.view")).toBe(true);
  });

  it("says no to everything not given", () => {
    expect(can(staff, "booking.approve")).toBe(false);
    expect(can(staff, "payments.edit")).toBe(false);
    expect(can(permissionsOf([]), "booking.view")).toBe(false);
  });

  it("says no to anything that is not a real permission id, even for the owner", () => {
    const owner = permissionsOf([[EVERYTHING]]);
    expect(can(owner, "booking.view")).toBe(true);
    expect(can(owner, "booking")).toBe(false);
    expect(can(owner, "")).toBe(false);
  });

  it("ignores anything in a role that is not a real permission", () => {
    const odd = permissionsOf([["booking.view", "nonsense", "booking.fly"]]);
    expect([...odd]).toEqual(["booking.view"]);
  });
});

describe("handing out roles", () => {
  const owner = permissionsOf([[EVERYTHING]]);
  const manager = permissionsOf([["booking.view", "booking.edit", "booking.approve"]]);

  it("lets an owner give any role", () => {
    expect(canGiveRole(owner, [EVERYTHING])).toBe(true);
    expect(canGiveRole(owner, ["booking.delete"])).toBe(true);
  });

  it("never lets anyone but an owner make an owner", () => {
    expect(canGiveRole(manager, [EVERYTHING])).toBe(false);
  });

  it("does not let a manager give more than they have", () => {
    expect(canGiveRole(manager, ["booking.view", "booking.edit"])).toBe(true);
    expect(canGiveRole(manager, ["booking.view", "booking.delete"])).toBe(false);
    expect(canGiveRole(manager, ["payments.view"])).toBe(false);
  });
});

describe("default roles", () => {
  const declared = [
    { id: "booking.view", default: ["owner", "manager", "staff"] },
    { id: "booking.approve", default: ["owner", "manager"] },
    { id: "booking.delete", default: ["owner"] },
  ];

  it("gives the owner everything and the others what the system declares", () => {
    expect(defaultsFor("owner", declared)).toEqual([EVERYTHING]);
    expect(defaultsFor("manager", declared)).toEqual(["booking.view", "booking.approve"]);
    expect(defaultsFor("staff", declared)).toEqual(["booking.view"]);
  });
});
