import { describe, expect, it } from "vitest";
import { AppError, fail, safeMessage } from "./errors";

describe("errors", () => {
  it("shows our own plain message", () => {
    expect(safeMessage(new AppError("That date is already booked."))).toBe("That date is already booked.");
  });

  it("never shows anything else, so internals cannot leak", () => {
    expect(safeMessage(new Error('duplicate key value violates unique constraint "booking_records_pkey"'))).toBe("That did not work. Try again, and if it keeps happening, tell the builder.");
    expect(safeMessage("a string")).toBe("That did not work. Try again, and if it keeps happening, tell the builder.");
  });

  it("fail throws an AppError and keeps the detail for the log", () => {
    try {
      fail("Could not save.", "insert failed on booking_records");
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).detail).toBe("insert failed on booking_records");
    }
  });
});
