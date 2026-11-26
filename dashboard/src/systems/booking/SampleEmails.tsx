"use client";

import { useState, useTransition } from "react";
import { sendSamples } from "./samples";
import { btn, card, field, hintCls, labelCls } from "./ui";

// Type one or a few addresses and receive every booking email as a test.
export default function SampleEmails({ start }: { start: string }) {
  const [to, setTo] = useState(start);
  const [lines, setLines] = useState<{ text: string[]; bad: boolean } | null>(null);
  const [pending, run] = useTransition();

  const send = () =>
    run(async () => {
      setLines(null);
      const r = await sendSamples(to);
      setLines(r.ok ? { text: r.data.lines, bad: false } : { text: [r.message], bad: true });
    });

  return (
    <section aria-label="Test every email" className={`${card} mb-4 grid gap-3 p-5`}>
      <div>
        <label htmlFor="sample-to" className={labelCls}>
          Send every booking email as a test to
        </label>
        <div className="flex flex-wrap gap-2">
          <input id="sample-to" type="text" inputMode="email" autoComplete="off" value={to} placeholder="you@gmail.com, another@gmail.com" onChange={(e) => setTo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), send())} className={`${field} min-w-0 flex-1 basis-64`} />
          <button type="button" className={btn} disabled={pending || to.trim() === ""} onClick={send}>
            {pending ? "Sending" : "Send tests"}
          </button>
        </div>
        <p className={hintCls}>Up to 3 addresses, separated by a comma. Six sample emails each, marked [Test].</p>
      </div>
      {lines && (
        <ul role="status" className={`grid gap-1 text-sm ${lines.bad ? "text-danger" : "text-text-soft"}`}>
          {lines.text.map((l) => (
            <li key={l} className="break-words">
              {l}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
