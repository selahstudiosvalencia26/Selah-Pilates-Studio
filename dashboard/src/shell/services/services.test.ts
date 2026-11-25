import { describe, expect, it } from "vitest";
import { checkServices, gapsFor, servicesFor, SERVICE_HELP, SERVICE_IDS, SERVICES } from "./services";

const email = { id: "x", label: "x", to: "customer" as const, required: false, default: true };
const sys = (over: Partial<{ services: ("supabase" | "resend" | "jobs")[]; emails: (typeof email)[]; tables: string[] }> = {}) => ({ name: "Bookings", services: [], emails: [], tables: [], ...over });

describe("services", () => {
  it("the dashboard alone needs the database and email, and says what is missing by name", () => {
    const out = checkServices([], { NEXT_PUBLIC_SUPABASE_URL: "https://x" });
    expect(out.map((s) => s.id)).toEqual(["supabase", "resend"]);
    expect(out[0]).toMatchObject({ connected: false, missing: ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] });
  });

  it("counts a blank value as missing, and never returns a value", () => {
    const out = checkServices([], { RESEND_API_KEY: "   ", EMAIL_FROM: "secret@b.co", NEXT_PUBLIC_SUPABASE_URL: "u", NEXT_PUBLIC_SUPABASE_ANON_KEY: "k", SUPABASE_SERVICE_ROLE_KEY: "s" });
    expect(out[0].connected).toBe(true);
    expect(out[1]).toMatchObject({ connected: false, missing: ["RESEND_API_KEY"] });
    expect(JSON.stringify(out)).not.toContain("secret@b.co");
  });

  it("a system that sends email needs Resend, one with tables needs Supabase, and it can list more", () => {
    expect(servicesFor(sys({ emails: [email] }))).toEqual(["resend"]);
    expect(servicesFor(sys({ tables: ["t"] }))).toEqual(["supabase"]);
    expect(servicesFor(sys({ services: ["jobs"] }))).toEqual(["jobs"]);
  });

  it("only lists Scheduled jobs when something needs it, and says who", () => {
    expect(checkServices([sys()], {}).some((s) => s.id === "jobs")).toBe(false);
    const out = checkServices([sys({ services: ["jobs"] })], {});
    expect(out.find((s) => s.id === "jobs")?.neededBy).toEqual(["Bookings"]);
  });

  it("finds the gaps for one system", () => {
    const status = checkServices([sys({ emails: [email] })], {});
    expect(gapsFor(sys({ emails: [email] }), status).map((s) => s.id)).toEqual(["resend"]);
  });
});

describe("a service a system can use but works without", () => {
  const money = { name: "Money", services: [], emails: [], tables: ["payments_records"], optionalServices: ["paymongo" as const] };
  it("is listed once that system is installed, and is never counted as a problem", () => {
    expect(checkServices([], {}).map((s) => s.id)).not.toContain("paymongo");
    const status = checkServices([money], {});
    expect(status.find((s) => s.id === "paymongo")).toMatchObject({ optional: true, connected: false, neededBy: ["Money"] });
    expect(gapsFor(money, status).map((s) => s.id)).not.toContain("paymongo");
  });
});

describe("every service says why we need it", () => {
  it("explains itself and each of its settings", () => {
    for (const id of SERVICE_IDS) {
      expect(SERVICE_HELP[id].why, id).toBeTruthy();
      for (const name of SERVICES[id].vars) expect(SERVICE_HELP[id].vars[name], `${id} ${name}`).toBeTruthy();
    }
  });
});
