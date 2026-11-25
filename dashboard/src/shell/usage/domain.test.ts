import { describe, expect, it } from "vitest";
import { domainState } from "./domain";

describe("the domain renewal reminder", () => {
  it("stays quiet far ahead, warns within 30 days, and says when it has passed", () => {
    expect(domainState("2027-03-01", "2026-11-25")).toMatchObject({ level: "fine" });
    expect(domainState("2026-12-25", "2026-11-25")).toMatchObject({ level: "soon", days: 30 });
    expect(domainState("2026-11-25", "2026-11-25")).toMatchObject({ level: "soon", days: 0 });
    expect(domainState("2026-11-20", "2026-11-25")).toMatchObject({ level: "lapsed", days: -5 });
    expect(domainState("", "2026-11-25")).toBeNull();
    expect(domainState("soon", "2026-11-25")).toBeNull();
  });
});
