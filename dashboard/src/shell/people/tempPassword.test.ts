import { describe, expect, it } from "vitest";
import { passwordProblems } from "@/shell/account/password";
import { inviteMessage, tempPassword } from "./tempPassword";

describe("a ready-made password", () => {
  it("passes the password rules and is different each time", () => {
    const made = new Set(Array.from({ length: 50 }, tempPassword));
    expect(made.size).toBe(50);
    for (const p of made) expect(passwordProblems({ password: p })).toEqual([]);
  });
  it("goes into the message with the link and email", () => {
    const text = inviteMessage("Maria", "https://x.test/sign-in", "m@x.test", "abcd-efgh-jkmn", "Selah");
    expect(text).toContain("Temporary password: abcd-efgh-jkmn");
    expect(text).toContain("https://x.test/sign-in");
  });
});
