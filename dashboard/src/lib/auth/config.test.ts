import { afterEach, describe, expect, it, vi } from "vitest";
import { authOn, isAllowed } from "./config";

afterEach(() => vi.unstubAllEnvs());

describe("who may use the dashboard", () => {
  it("lets in only the listed emails, whatever their capital letters", () => {
    vi.stubEnv("DASHBOARD_OWNER_EMAILS", " Owner@Example.com ,second@example.com");
    expect(isAllowed("owner@example.com")).toBe(true);
    expect(isAllowed("SECOND@example.com")).toBe(true);
    expect(isAllowed("stranger@example.com")).toBe(false);
    expect(isAllowed("")).toBe(false);
    expect(isAllowed(undefined)).toBe(false);
  });
  it("lets in nobody when there is no list", () => {
    vi.stubEnv("DASHBOARD_OWNER_EMAILS", "");
    expect(isAllowed("owner@example.com")).toBe(false);
  });
  it("is on only when both the address and the public key are set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(authOn()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "sb_publishable_x");
    expect(authOn()).toBe(true);
  });
});
