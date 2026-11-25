import { describe, expect, it } from "vitest";
import { AVATAR_MAX_BYTES, AVATAR_PREFIX, centreSquare, checkAvatarFile, checkAvatarSides, parseAvatar } from "./avatar";

// A tiny file that starts like a real WebP: "RIFF", a size, "WEBP", then filler. Enough for the first-bytes check.
export function fakeWebp(size = 40): Uint8Array {
  const bytes = new Uint8Array(size);
  bytes.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  bytes.set([size - 8, 0, 0, 0], 4);
  bytes.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
  bytes.set([0x56, 0x50, 0x38, 0x20], 12); // VP8
  return bytes;
}
const asData = (bytes: Uint8Array, prefix = AVATAR_PREFIX) => prefix + Buffer.from(bytes).toString("base64");

describe("the file the person chooses", () => {
  it("accepts a PNG, WebP or JPG of a sensible size", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) expect(checkAvatarFile({ type, size: 3_000_000 })).toBeNull();
  });

  it("refuses other types, an empty file and one over 10 MB, in plain words", () => {
    expect(checkAvatarFile({ type: "image/svg+xml", size: 1000 })).toMatch(/PNG, WebP or JPG/);
    expect(checkAvatarFile({ type: "application/pdf", size: 1000 })).toMatch(/PNG, WebP or JPG/);
    expect(checkAvatarFile({ type: "image/png", size: 0 })).toMatch(/empty/);
    expect(checkAvatarFile({ type: "image/png", size: 11 * 1024 * 1024 })).toMatch(/under 10 MB/);
  });

  it("refuses a picture that is too small, or so large it could use up a phone's memory", () => {
    expect(checkAvatarSides(300, 300)).toBeNull();
    expect(checkAvatarSides(4032, 3024)).toBeNull(); // a normal phone photo
    expect(checkAvatarSides(40, 300)).toMatch(/too small/);
    expect(checkAvatarSides(9000, 500)).toMatch(/too large/);
    expect(checkAvatarSides(7000, 7000)).toMatch(/too large/);
    expect(checkAvatarSides(0, 0)).toMatch(/could not read/);
    expect(checkAvatarSides(Number.NaN, 300)).toMatch(/could not read/);
  });

  it("cuts a centred square from a wide or tall picture", () => {
    expect(centreSquare(400, 200)).toEqual({ x: 100, y: 0, side: 200 });
    expect(centreSquare(200, 400)).toEqual({ x: 0, y: 100, side: 200 });
    expect(centreSquare(300, 300)).toEqual({ x: 0, y: 0, side: 300 });
  });
});

describe("what the server keeps", () => {
  it("accepts a small real WebP", () => {
    const r = parseAvatar(asData(fakeWebp()));
    expect(r.ok).toBe(true);
  });

  it("refuses everything that is not text", () => {
    for (const bad of [null, undefined, 42, {}, [], true]) expect(parseAvatar(bad).ok).toBe(false);
  });

  it("refuses another picture type, a plain web address, a script address, and a wrong start", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(parseAvatar(asData(png, "data:image/png;base64,")).ok).toBe(false);
    expect(parseAvatar("https://example.com/me.webp").ok).toBe(false);
    expect(parseAvatar("javascript:alert(1)").ok).toBe(false);
    expect(parseAvatar("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==").ok).toBe(false);
    expect(parseAvatar(" " + asData(fakeWebp())).ok).toBe(false);
    expect(parseAvatar("").ok).toBe(false);
    expect(parseAvatar(AVATAR_PREFIX).ok).toBe(false);
  });

  it("refuses a file that claims to be a WebP but starts like something else, by its first bytes", () => {
    const sneaky = fakeWebp();
    sneaky.set([0x3c, 0x73, 0x76, 0x67], 0); // "<svg"
    expect(parseAvatar(asData(sneaky)).ok).toBe(false);
    const wrongKind = fakeWebp();
    wrongKind.set([0x57, 0x41, 0x56, 0x45], 8); // RIFF....WAVE
    expect(parseAvatar(asData(wrongKind)).ok).toBe(false);
  });

  it("refuses text that is not clean base64, including a length that does not fit", () => {
    expect(parseAvatar(AVATAR_PREFIX + "not base64 at all!!").ok).toBe(false);
    expect(parseAvatar(AVATAR_PREFIX + "AAA").ok).toBe(false);
    expect(parseAvatar(AVATAR_PREFIX + "AAAA=AAA").ok).toBe(false);
    expect(parseAvatar(asData(fakeWebp()) + "\n<script>").ok).toBe(false);
  });

  it("refuses a picture over the size limit, and a huge paste is refused before it is decoded", () => {
    const big = fakeWebp(AVATAR_MAX_BYTES + 1000);
    const tooBig = parseAvatar(asData(big));
    expect(tooBig.ok).toBe(false);
    expect(!tooBig.ok && tooBig.message).toMatch(/too big/);
    const huge = parseAvatar(AVATAR_PREFIX + "A".repeat(5_000_000));
    expect(huge.ok).toBe(false);
    expect(!huge.ok && huge.message).toMatch(/too big/);
    expect(parseAvatar(asData(fakeWebp(AVATAR_MAX_BYTES - 100))).ok).toBe(true);
  });

  it("gives plain sentences, never a code, a stack or the text that was sent", () => {
    for (const bad of ["x", asData(new Uint8Array(20), "data:image/png;base64,"), AVATAR_PREFIX + "????"]) {
      const r = parseAvatar(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message.length).toBeGreaterThan(10);
        expect(r.message).not.toContain(bad);
        expect(r.message).not.toMatch(/Error|undefined|atob|base64|webp/i);
      }
    }
  });
});
