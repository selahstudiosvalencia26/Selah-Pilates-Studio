"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/kit/Button";
import { Field, Input } from "@/kit/Input";
import { changeOwnPassword } from "./ownPassword";
import { firstProblem, passwordProblems, PASSWORD_MIN } from "./password";

// Choose a new password. `first` is the first sign-in: no current password is asked, and it moves on to the dashboard when done.
export default function OwnPasswordForm({ first = false }: { first?: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [show, setShow] = useState(false);
  const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null);
  const [pending, start] = useTransition();
  const problem = next ? firstProblem(passwordProblems({ password: next })) : null;
  const ready = next !== "" && !problem && (first || current !== "");

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    start(async () => {
      const r = await changeOwnPassword({ current, next });
      if (!r.ok) return setNote({ text: r.message, bad: true });
      if (first) return window.location.assign("/preview");
      setCurrent("");
      setNext("");
      setNote({ text: "Password changed.", bad: false });
    });
  };
  const type = show ? "text" : "password";

  return (
    <form onSubmit={save} noValidate aria-label="Change password" className="grid gap-4">
      {!first && (
        <Field label="Current password">{(p) => <Input {...p} type={type} autoComplete="current-password" value={current} onChange={(e) => (setCurrent(e.target.value), setNote(null))} />}</Field>
      )}
      <Field label="New password" hint={`At least ${PASSWORD_MIN} characters. A short sentence works well.`} error={problem}>
        {(p) => <Input {...p} type={type} autoComplete="new-password" value={next} onChange={(e) => (setNext(e.target.value), setNote(null))} />}
      </Field>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4 accent-accent" />
        Show what I type
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={!ready || pending} className={buttonClass("primary")}>
          {pending ? "Saving" : "Save password"}
        </button>
        {note && (
          <p role="status" className={`text-sm ${note.bad ? "text-danger" : "text-text-soft"}`}>
            {note.text}
          </p>
        )}
      </div>
    </form>
  );
}
