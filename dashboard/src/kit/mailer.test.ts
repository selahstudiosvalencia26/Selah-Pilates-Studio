import { afterEach, describe, expect, it, vi } from "vitest";
import nodemailer from "nodemailer";
import { canEmailCustomers, sendMail } from "./mailer";

const settings = { senderName: 'Selah "Studio"', replyTo: "reply@x.test", staffTo: "", switches: {} };
const message = { to: "studio@x.test", subject: "New booking:\nMaria", text: "Maria booked." };
const on = () => {
  vi.stubEnv("RESEND_API_KEY", "made-up-key");
  vi.stubEnv("EMAIL_FROM", "onboarding@resend.dev");
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sending email", () => {
  it("does nothing until it is set up", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const send = vi.fn();
    vi.stubGlobal("fetch", send);
    expect(await sendMail(message, settings)).toEqual({ ok: false, why: "off" });
    expect(send).not.toHaveBeenCalled();
  });
  it("sends plain words, with a clean name and a one line subject", async () => {
    on();
    const send = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", send);
    expect(await sendMail(message, settings)).toEqual({ ok: true });
    const body = JSON.parse((send.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(body).toEqual({ from: "Selah Studio <onboarding@resend.dev>", to: ["studio@x.test"], subject: "New booking: Maria", text: "Maria booked.", reply_to: "reply@x.test" });
  });
  it("says when Resend only allows its own account's address", async () => {
    on();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 403 })));
    expect(await sendMail(message, settings)).toEqual({ ok: false, why: "own-address" });
  });
});

describe("through the studio's Gmail", () => {
  it("is used when set, ignores the spaces in the app password, and lets customers be emailed", async () => {
    on();
    expect(canEmailCustomers()).toBe(false); // Resend's test address reaches only its own account
    vi.stubEnv("GMAIL_USER", "studio@gmail.test");
    vi.stubEnv("GMAIL_APP_PASSWORD", "abcd efgh ijkl mnop");
    expect(canEmailCustomers()).toBe(true);
    const sent = vi.fn(async () => ({}));
    const made = vi.spyOn(nodemailer, "createTransport").mockReturnValue({ sendMail: sent } as never);
    const web = vi.fn();
    vi.stubGlobal("fetch", web);
    expect(await sendMail(message, settings)).toEqual({ ok: true });
    expect((made.mock.calls[0][0] as { auth: { pass: string } }).auth.pass).toBe("abcdefghijklmnop");
    expect(sent).toHaveBeenCalledWith({ from: '"Selah Studio" <studio@gmail.test>', to: "studio@x.test", subject: "New booking: Maria", text: "Maria booked.", replyTo: "reply@x.test" });
    expect(web).not.toHaveBeenCalled();
    made.mockRestore();
  });
});
