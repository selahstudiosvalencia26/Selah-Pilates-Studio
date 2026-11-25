"use client";

import { CaretDown } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { formatPhoneBox } from "@/lib/phone";

type Status = "idle" | "sending" | "sent" | "failed" | "copied" | "copyFailed";
type Errors = { name?: string; phone?: string };

type Props = {
  /** Classes the visitor can pick from. */
  classes: { name: string; price: string }[];
  /** Where to send the message while no booking connection is set up (Facebook Messenger). */
  messengerUrl: string | null;
  studio: string;
};

// Big, filled boxes with no borders, and a clear focus ring.
const field =
  "mt-2 block min-h-14 w-full rounded-2xl bg-page px-5 text-lg outline-none transition-shadow duration-200 placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ink aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-700";
const label = "block text-base font-medium";
const error = "mt-2 text-base font-medium text-red-800";

// A message form. If a booking connection is set (NEXT_PUBLIC_BOOKING_URL) it sends there.
// Until then it copies the message and opens Messenger, so nothing is lost.
export function ContactForm({ classes, messengerUrl, studio }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [draft, setDraft] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const connected = Boolean(process.env.NEXT_PUBLIC_BOOKING_URL);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<
      string,
      string
    >;

    // Check the two required boxes and say clearly what is wrong.
    const next: Errors = {};
    if (!data.name?.trim()) next.name = "Please tell us your name.";
    if ((data.phone ?? "").replace(/\D/g, "").length < 7) {
      next.phone = "Please enter your phone number, with at least 7 digits.";
    }
    setErrors(next);
    if (next.name || next.phone) {
      (
        form.elements.namedItem(
          next.name ? "name" : "phone",
        ) as HTMLElement | null
      )?.focus();
      return;
    }

    // Hidden trap field: real people never fill it in.
    if (data.website) {
      setStatus("sent");
      form.reset();
      return;
    }

    const url = process.env.NEXT_PUBLIC_BOOKING_URL;
    if (url) {
      setStatus("sending");
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            phone: data.phone,
            class: data.class,
            preferred: data.preferred,
            message: data.message,
          }),
        });
        if (res.ok) {
          setStatus("sent");
          form.reset();
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
      return;
    }

    // No booking connection yet: write the message, copy it, and open Messenger.
    const text = [
      `Hi ${studio}! My name is ${data.name}.`,
      `Phone: ${data.phone}`,
      data.class ? `Class: ${data.class}` : "",
      data.preferred ? `Best days and times: ${data.preferred}` : "",
      data.message ? data.message : "",
    ]
      .filter(Boolean)
      .join("\n");
    setDraft(text);

    if (messengerUrl)
      window.open(messengerUrl, "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("copyFailed");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={label}>
            Your name <span className="font-normal text-muted">(required)</span>
          </label>
          <input
            id="cf-name"
            name="name"
            autoComplete="name"
            aria-required="true"
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? "cf-name-error" : undefined}
            className={field}
          />
          {errors.name && (
            <p id="cf-name-error" role="alert" className={error}>
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cf-phone" className={label}>
            Phone number{" "}
            <span className="font-normal text-muted">(required)</span>
          </label>
          <input
            id="cf-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            onChange={(e) => {
              e.target.value = formatPhoneBox(e.target);
            }}
            aria-required="true"
            aria-invalid={errors.phone ? "true" : undefined}
            aria-describedby={errors.phone ? "cf-phone-error" : undefined}
            className={field}
          />
          {errors.phone && (
            <p id="cf-phone-error" role="alert" className={error}>
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="cf-class" className={label}>
          Class you would like to try
        </label>
        <div className="relative">
          <select
            id="cf-class"
            name="class"
            defaultValue=""
            className={`${field} appearance-none pr-14`}
          >
            <option value="">Not sure yet</option>
            {classes.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} {c.price && `(${c.price})`}
              </option>
            ))}
          </select>
          <CaretDown
            aria-hidden="true"
            size={22}
            className="pointer-events-none absolute right-5 top-1/2 mt-1 -translate-y-1/2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="cf-when" className={label}>
          Days and times that suit you
        </label>
        <input
          id="cf-when"
          name="preferred"
          placeholder="For example, weekdays after 5 PM"
          className={field}
        />
      </div>

      <div>
        <label htmlFor="cf-message" className={label}>
          Message <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={4}
          placeholder="Any injury or health note we should know"
          className={`${field} py-4`}
        />
      </div>

      {/* Trap for spam bots. Hidden from people and screen readers. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <Button
          type="submit"
          variant="dark"
          disabled={status === "sending"}
          className="w-full sm:w-fit"
        >
          {status === "sending" ? "Sending" : "Send message"}
        </Button>
        {!connected && (
          <p className="mt-3 text-base text-muted">
            This opens Messenger with your message ready to send.
          </p>
        )}
      </div>

      <div role="status" aria-live="polite" className="min-h-6 text-base">
        {status === "sent" &&
          "Thank you. We got your message and will reply soon."}
        {status === "failed" &&
          "Something went wrong. Please try again, or message us on Facebook."}
        {status === "copied" &&
          "Your message is copied and Messenger is opening. Paste it there and press send."}
        {status === "copyFailed" && (
          <span>
            Messenger is opening. Please copy your message below and paste it
            there.
            <textarea
              readOnly
              value={draft}
              rows={5}
              aria-label="Your message"
              className={`${field} py-4`}
            />
          </span>
        )}
      </div>
    </form>
  );
}
