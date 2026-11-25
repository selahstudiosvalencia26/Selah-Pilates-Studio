import { describe, expect, it } from "vitest";
import {
  firstProblem,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN,
  PASSWORD_WORDS,
  passwordProblems,
} from "./password";

describe("password rules", () => {
  const email = "ciara.bergado@example.com";

  it("accepts a long, unusual password, including spaces and symbols, with no forced mix of characters", () => {
    expect(
      passwordProblems({ password: "lemon river paper lantern", email }),
    ).toEqual([]);
    expect(passwordProblems({ password: "a#9 Zk!pq-33wm", email })).toEqual([]);
    expect(
      passwordProblems({ password: "alllowercaseandlong", email }),
    ).toEqual([]);
  });

  it("asks for at least 12 characters, counting a character as one even when it is an accented letter or an emoji", () => {
    expect(
      passwordProblems({ password: "a".repeat(PASSWORD_MIN - 1) + "q", email }),
    ).not.toContain("short");
    expect(passwordProblems({ password: "short1!Ab", email })).toContain(
      "short",
    );
    expect(passwordProblems({ password: "", email })).toContain("short");
    // 12 emoji are 12 characters (and 48 bytes), so they are long enough.
    expect(
      passwordProblems({ password: "😀😃😄😁😆😅🤣😂🙂🙃😉😊", email }),
    ).not.toContain("short");
  });

  it("refuses a password over 72 bytes, because bcrypt would silently ignore the rest", () => {
    expect(
      passwordProblems({
        password: "x7".repeat(PASSWORD_MAX_BYTES / 2),
        email,
      }),
    ).not.toContain("long");
    expect(
      passwordProblems({
        password: "x7".repeat(PASSWORD_MAX_BYTES / 2) + "z",
        email,
      }),
    ).toContain("long");
    expect(passwordProblems({ password: "é".repeat(37), email })).toContain(
      "long",
    ); // 74 bytes
  });

  it("refuses the passwords everyone tries first, however they are dressed up", () => {
    for (const bad of [
      "password1234",
      "PASSWORD1234",
      "qwertyuiop12",
      "iloveyou123",
      "welcome12345",
      "letmein123456",
    ]) {
      expect(passwordProblems({ password: bad, email })).toContain("common");
    }
    expect(passwordProblems({ password: "Passw0rd", email })).toContain(
      "common",
    );
  });

  it("refuses a password that contains the person's email or the name part of it", () => {
    expect(
      passwordProblems({ password: "ciara.bergado!!99", email }),
    ).toContain("email");
    expect(
      passwordProblems({ password: "my-ciara.bergado-key", email }),
    ).toContain("email");
    expect(
      passwordProblems({ password: "xx" + email + "xx", email }),
    ).toContain("email");
    // A very short name (ann@...) is not checked, because it matches real words by chance.
    expect(
      passwordProblems({
        password: "planning-the-week",
        email: "ann@example.com",
      }),
    ).not.toContain("email");
  });

  it("refuses plain repeats and runs", () => {
    expect(passwordProblems({ password: "aaaaaaaaaaaa", email })).toContain(
      "plain",
    );
    expect(passwordProblems({ password: "abababababab", email })).toContain(
      "plain",
    );
    expect(passwordProblems({ password: "123456789012", email })).toContain(
      "plain",
    );
    expect(passwordProblems({ password: "zyxwvutsrqpo", email })).toContain(
      "plain",
    );
    expect(
      passwordProblems({ password: "lemon river paper", email }),
    ).not.toContain("plain");
  });

  it("refuses the same password as the current one, only when there is a current one", () => {
    expect(
      passwordProblems({
        password: "lemon river paper",
        email,
        current: "lemon river paper",
      }),
    ).toContain("same");
    expect(
      passwordProblems({
        password: "lemon river paper",
        email,
        current: "something else entirely",
      }),
    ).not.toContain("same");
    expect(
      passwordProblems({ password: "lemon river paper", email }),
    ).not.toContain("same");
  });

  it("gives one plain sentence for the first problem, and nothing when there is none", () => {
    expect(firstProblem([])).toBeNull();
    expect(firstProblem(["short", "common"])).toBe(PASSWORD_WORDS.short);
    for (const sentence of Object.values(PASSWORD_WORDS)) {
      expect(sentence.length).toBeGreaterThan(10);
      expect(sentence).not.toMatch(/\b(entropy|regex|hash|bcrypt|NIST)\b/i); // plain words only
    }
  });
});
