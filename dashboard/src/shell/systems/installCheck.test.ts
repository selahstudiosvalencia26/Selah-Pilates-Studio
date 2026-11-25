import { describe, expect, it } from "vitest";
import { checkSystem, describeRange, satisfies, type CheckContext } from "./installCheck";
import { defineSystem } from "./manifest";

const good = defineSystem({
  id: "booking",
  name: "Bookings",
  version: "0.1.0",
  requires_shell: ">=0.1.0 <1.0.0",
  icon: "calendar",
  needs: ["files"],
  optional: ["payments"],
  pages: [
    { path: "/booking", title: "Bookings", permission: "booking.view" },
    { path: "/booking/[id]", title: "Booking", permission: "booking.view" },
  ],
  permissions: [
    { id: "booking.view", label: "See bookings", default: ["owner", "manager", "staff"] },
    { id: "booking.edit", label: "Add and change bookings", default: ["owner", "manager", "staff"] },
  ],
  tables: ["booking_records", "booking_resources"],
  migrations: ["001_create_tables.sql"],
  today: [{ id: "new-requests", title: "New booking requests", permission: "booking.view" }],
  emails: [{ id: "request-received", label: "We got your request", to: "customer", required: false, default: true }],
  search: { table: "booking_records", fields: ["customer_name"], permission: "booking.view" },
});

const ctx = (over: Partial<CheckContext> = {}): CheckContext => ({ folder: "booking", shellVersion: "0.1.0", installed: ["booking"], others: [], ...over });
const broken = (patch: Record<string, unknown>) => ({ ...good, ...patch });

describe("a good system", () => {
  it("passes", () => {
    const r = checkSystem(good, ctx());
    expect(r.problems).toEqual([]);
    expect(r.manifest?.id).toBe("booking");
  });
});

describe("the shape of the description file", () => {
  it("refuses a missing or unknown key, in plain words", () => {
    expect(checkSystem({ ...good, colour: "red" }, ctx()).problems.length).toBeGreaterThan(0);
    const noId: Record<string, unknown> = { ...good };
    delete noId.id;
    expect(checkSystem(noId, ctx()).manifest).toBeNull();
  });

  it("refuses something that is not an object at all", () => {
    expect(checkSystem("hello", ctx()).manifest).toBeNull();
    expect(checkSystem(null, ctx()).manifest).toBeNull();
  });
});

describe("names", () => {
  it("makes the folder and the id the same word", () => {
    expect(checkSystem(good, ctx({ folder: "bookings" })).problems.join(" ")).toMatch(/same word/);
  });

  it("makes every permission start with the system word and use a real action", () => {
    const p = checkSystem(broken({ permissions: [{ id: "payments.view", label: "x" }, { id: "booking.fly", label: "y" }, { id: "booking.view", label: "z" }] }), ctx()).problems.join(" ");
    expect(p).toMatch(/payments\.view/);
    expect(p).toMatch(/booking\.fly/);
  });

  it("makes every table start with the system word", () => {
    expect(checkSystem(broken({ tables: ["records"] }), ctx()).problems.join(" ")).toMatch(/Table "records"/);
  });

  it("keeps pages inside the system's own address", () => {
    expect(checkSystem(broken({ pages: [{ path: "/payments", title: "Pay", permission: "booking.view" }] }), ctx()).problems.join(" ")).toMatch(/must be \/booking/);
  });
});

describe("a version rule in plain words", () => {
  it("reads like a sentence", () => {
    expect(describeRange(">=0.1.0 <1.0.0")).toBe("0.1.0 or newer, but older than 1.0.0");
    expect(describeRange(">=2.0.0")).toBe("2.0.0 or newer");
    expect(describeRange("<=1.4.0")).toBe("1.4.0 or older");
    expect(describeRange("1.2.3")).toBe("exactly 1.2.3");
  });

  it("is used when the dashboard is too old", () => {
    expect(checkSystem(good, ctx({ shellVersion: "1.2.0" })).problems.join(" ")).toMatch(/0\.1\.0 or newer, but older than 1\.0\.0/);
  });
});

describe("sections", () => {
  it("cannot be a page whose address changes", () => {
    const p = checkSystem(broken({ pages: [{ path: "/booking/[id]", title: "Booking", permission: "booking.view", nav: true }] }), ctx()).problems.join(" ");
    expect(p).toMatch(/cannot be a section/);
  });
});

describe("every system can be seen", () => {
  it("must declare its see permission", () => {
    const p = checkSystem(broken({ permissions: [{ id: "booking.edit", label: "Change bookings", default: ["owner"] }] }), ctx()).problems.join(" ");
    expect(p).toMatch(/must declare "booking\.view"/);
  });
});

describe("the icon", () => {
  it("must be one the dashboard has", () => {
    expect(checkSystem(broken({ icon: "rocket-ship" }), ctx()).problems.join(" ")).toMatch(/not in the icon set/);
    expect(checkSystem(broken({ icon: "wallet" }), ctx()).problems).toEqual([]);
  });
});

describe("what it points at", () => {
  it("must only ask for permissions it declares", () => {
    const r = checkSystem(broken({ pages: [{ path: "/booking", title: "Bookings", permission: "booking.approve" }] }), ctx());
    expect(r.problems.join(" ")).toMatch(/does not declare/);
  });

  it("must search only its own tables", () => {
    expect(checkSystem(broken({ search: { table: "customers_contacts", fields: ["name"], permission: "booking.view" } }), ctx()).problems.join(" ")).toMatch(/not one of this system's tables/);
  });
});

describe("SQL files", () => {
  it("must be numbered with no gaps", () => {
    expect(checkSystem(broken({ migrations: ["001_create_tables.sql", "003_more.sql"] }), ctx()).problems.join(" ")).toMatch(/out of order/);
    expect(checkSystem(broken({ migrations: ["create_tables.sql"] }), ctx()).problems.join(" ")).toMatch(/numbered/);
  });

  it("must exist if there are tables", () => {
    expect(checkSystem(broken({ migrations: [] }), ctx()).problems.join(" ")).toMatch(/no SQL file/);
  });
});

describe("versions and needs", () => {
  it("refuses a dashboard that is too old or too new", () => {
    expect(checkSystem(good, ctx({ shellVersion: "1.2.0" })).problems.join(" ")).toMatch(/this dashboard is 1\.2\.0/);
    expect(satisfies("0.5.0", ">=0.1.0 <1.0.0")).toBe(true);
    expect(satisfies("1.0.0", ">=0.1.0 <1.0.0")).toBe(false);
    expect(satisfies("0.1.0", "banana")).toBe(false);
  });

  it("refuses a system whose needs are not installed, and accepts the shell's own services", () => {
    expect(checkSystem(broken({ needs: ["customers"] }), ctx()).problems.join(" ")).toMatch(/needs "customers"/);
    expect(checkSystem(broken({ needs: ["customers"] }), ctx({ installed: ["booking", "customers"] })).problems).toEqual([]);
    expect(checkSystem(broken({ needs: ["files", "email"] }), ctx()).problems).toEqual([]);
  });
});

describe("clashes with systems already there", () => {
  const other = checkSystem(good, ctx()).manifest!;

  it("refuses a second system with the same id, table, permission or page", () => {
    const p = checkSystem(good, ctx({ others: [other] })).problems.join(" ");
    expect(p).toMatch(/already uses the id/);
    expect(p).toMatch(/Table "booking_records"/);
    expect(p).toMatch(/Permission "booking\.view"/);
    expect(p).toMatch(/Page "\/booking"/);
  });

  it("accepts a different system next to it", () => {
    const content = { ...good, id: "content", name: "Website", pages: [{ path: "/content", title: "Website", permission: "content.view" }], permissions: [{ id: "content.view", label: "See the website" }], tables: ["content_pages"], migrations: ["001_create_tables.sql"], today: [], emails: [], search: undefined, needs: [] };
    expect(checkSystem(content, ctx({ folder: "content", others: [other] })).problems).toEqual([]);
  });
});
