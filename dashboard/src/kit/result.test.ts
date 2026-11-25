import { describe, expect, it, vi } from "vitest";
import { AppError } from "./errors";
import { attempt, err, ok } from "./result";

describe("one answer shape", () => {
  it("success carries data and failure carries a message", () => {
    expect(ok(5)).toEqual({ ok: true, data: 5 });
    expect(err("No.")).toEqual({ ok: false, message: "No." });
  });
});

describe("attempt", () => {
  it("returns the data when it works", async () => {
    expect(await attempt(async () => "saved")).toEqual({ ok: true, data: "saved" });
  });

  it("shows our own plain message and logs the detail", async () => {
    const log = vi.fn();
    const r = await attempt(async () => {
      throw new AppError("That date is already booked.", "exclusion violation on booking_records");
    }, log);
    expect(r).toEqual({ ok: false, message: "That date is already booked." });
    expect(log).toHaveBeenCalledOnce();
  });

  it("hides anything unexpected behind the generic message, and logs it", async () => {
    const log = vi.fn();
    const r = await attempt(async () => {
      throw new Error('relation "booking_records" does not exist');
    }, log);
    expect(r).toEqual({ ok: false, message: "That did not work. Try again, and if it keeps happening, tell the builder." });
    expect(log).toHaveBeenCalledOnce();
  });
});
