"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/kit/Button";
import { publishWebsite } from "./publish";

// On the live site, saving keeps the change and publishing puts it on the website. One button, and it says what happened.
export default function PublishBar() {
  const [note, setNote] = useState("Save first, then publish to put your changes on your website.");
  const [busy, start] = useTransition();
  const press = () =>
    start(async () => {
      const done = await publishWebsite();
      setNote(done.ok ? "Publishing. Your website updates in about 2 minutes." : done.message);
    });
  return (
    <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
      <p role="status" className="text-sm text-text-soft">
        {note}
      </p>
      <button type="button" onClick={press} disabled={busy} className={buttonClass("primary")}>
        {busy ? "Publishing" : "Publish to website"}
      </button>
    </div>
  );
}
