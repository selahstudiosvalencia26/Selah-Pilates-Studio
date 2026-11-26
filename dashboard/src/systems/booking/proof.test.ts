import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachProof, proofCode, readProof } from "./proof";

const picture = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64")}`;
const id = "abcdef012345";

beforeEach(async () => {
  vi.stubEnv("BOOKING_DATA_DIR", await mkdtemp(join(tmpdir(), "proof-")));
});

describe("a payment screenshot", () => {
  it("is refused without the right code for that booking", async () => {
    expect((await attachProof({ id, code: proofCode("000000000000"), image: picture })).status).toBe(403);
    expect(await readProof(id)).toBeNull();
  });
  it("is refused when it is not a picture, or the booking is not waiting for money", async () => {
    const fake = `data:image/jpeg;base64,${Buffer.from("<script>").toString("base64")}`;
    expect((await attachProof({ id, code: proofCode(id), image: fake })).status).toBe(400);
    expect((await attachProof({ id, code: proofCode(id), image: picture })).status).toBe(409);
    expect(await readProof(id)).toBeNull();
  });
  it("never reads a file outside its own name", async () => {
    expect(await readProof("../../secrets")).toBeNull();
  });
});
