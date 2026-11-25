import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isBreached } from "./breach";

const sha1 = (text: string) =>
  createHash("sha1").update(text, "utf8").digest("hex").toUpperCase();

afterEach(() => vi.unstubAllEnvs());

describe("breach check", () => {
  it("sends only the first 5 characters of the fingerprint, never the password, and finds a match", async () => {
    const password = "correct horse battery staple";
    const fingerprint = sha1(password);
    let asked = "";
    const fetcher = (async (url: string) => {
      asked = url;
      return new Response(
        `0018A45C4D1DEF81644B54AB7F969B88D65:0\n${fingerprint.slice(5)}:3861\nFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF:2`,
      );
    }) as unknown as typeof fetch;

    expect(await isBreached(password, fetcher)).toBe(true);
    expect(asked).toBe(
      `https://api.pwnedpasswords.com/range/${fingerprint.slice(0, 5)}`,
    );
    expect(asked).not.toContain(password.replace(/ /g, "%20"));
    expect(asked).not.toContain(fingerprint.slice(5));
  });

  it("says not found when the fingerprint is missing or only a padding line (count 0)", async () => {
    const password = "lemon river paper lantern";
    const padded = (async () =>
      new Response(
        `${sha1(password).slice(5)}:0\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:9`,
      )) as unknown as typeof fetch;
    const none = (async () =>
      new Response(
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:9",
      )) as unknown as typeof fetch;
    expect(await isBreached(password, padded)).toBe(false);
    expect(await isBreached(password, none)).toBe(false);
  });

  it("says it could not ask (null) when the service is down, slow or answers badly, so the caller decides", async () => {
    const down = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    const bad = (async () =>
      new Response("nope", { status: 503 })) as unknown as typeof fetch;
    expect(await isBreached("anything goes here", down)).toBeNull();
    expect(await isBreached("anything goes here", bad)).toBeNull();
  });

  it("can be switched off, and then never calls out", async () => {
    vi.stubEnv("PASSWORD_BREACH_CHECK", "off");
    const spy = vi.fn();
    expect(
      await isBreached("whatever it is", spy as unknown as typeof fetch),
    ).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});
