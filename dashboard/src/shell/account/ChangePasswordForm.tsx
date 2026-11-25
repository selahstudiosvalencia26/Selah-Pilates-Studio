"use client";

import { useId, useState, useTransition } from "react";
import { buttonClass } from "@/kit/Button";
import Icon from "@/kit/Icon";
import Tick from "@/kit/Tick";
import { changePassword, sendPasswordCode } from "./actions";
import PasswordField from "./PasswordField";
import {
  PASSWORD_MIN,
  passwordProblems,
  type PasswordProblem,
} from "./password";

// Change a password, or set the first one. One column, one thing to do. The rules show what is still missing as the person
// types, but the server checks everything again (./actions.ts). The password fields use the browser's own password helpers
// (autocomplete), allow pasting, each has an eye to show it, and none is kept anywhere after the answer comes back.
const field =
  "h-11 w-full rounded-lg border border-border-strong bg-card px-3 text-sm text-text transition-colors hover:border-accent focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent aria-[invalid=true]:border-danger";
const main = buttonClass("primary");
const quiet = buttonClass("quiet");

export default function ChangePasswordForm({
  email,
  hasPassword,
}: {
  email: string;
  hasPassword: boolean;
}) {
  const ids = useId();
  const [proof, setProof] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [codeSent, setCodeSent] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const found = new Set<PasswordProblem>(
    next
      ? passwordProblems({
          password: next,
          email,
          current: hasPassword ? proof : undefined,
        })
      : [],
  );
  const typed = next.length > 0;
  const rules: { text: string; met: boolean }[] = [
    {
      text: `At least ${PASSWORD_MIN} characters`,
      met: typed && !found.has("short"),
    },
    {
      text: "Not a common password",
      met: typed && !found.has("common") && !found.has("plain"),
    },
    { text: "Does not contain your email", met: typed && !found.has("email") },
    { text: "Both passwords match", met: typed && confirm === next },
  ];

  const needsProof = hasPassword || codeSent;
  const ready = needsProof && proof !== "" && next !== "" && confirm !== "";

  const sendCode = () =>
    start(async () => {
      setProblem(null);
      const result = await sendPasswordCode();
      if (!result.ok) return setProblem(result.message);
      setCodeSent(true);
    });

  const submit = () =>
    start(async () => {
      setProblem(null);
      setDone(null);
      const result = await changePassword({
        proof,
        next,
        confirm,
        signOutOthers,
      });
      if (!result.ok) return setProblem(result.message);
      // Never keep a password on the screen after it was sent.
      setProof("");
      setNext("");
      setConfirm("");
      setCodeSent(false);
      const words = [
        result.data.wasSet
          ? "Your password is set."
          : "Your password was changed.",
      ];
      if (result.data.signedOutOthers)
        words.push("Your other devices were signed out.");
      if (result.data.emailed) words.push("We emailed you to confirm.");
      setDone(words.join(" "));
    });

  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      {/* Helps password managers: the form is about this account. Hidden from view and from the keyboard. */}
      <input
        type="email"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        hidden
        aria-hidden
        tabIndex={-1}
      />

      {hasPassword ? (
        <PasswordField
          id={`${ids}-current`}
          name="current-password"
          label="Current password"
          value={proof}
          onChange={setProof}
          autoComplete="current-password"
          invalid={problem?.startsWith("Your current") ?? false}
        />
      ) : (
        <div className="grid gap-1.5">
          <p className="text-sm text-text-soft">
            You sign in with a code now. To add a password, first confirm it is
            you with a code sent to {email}.
          </p>
          {codeSent ? (
            <>
              <label htmlFor={`${ids}-code`} className="text-sm font-medium">
                6 number code
              </label>
              <input
                id={`${ids}-code`}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={proof}
                onChange={(e) => setProof(e.target.value.replace(/\D/g, ""))}
                className={`${field} tracking-[0.3em]`}
              />
            </>
          ) : (
            <button
              type="button"
              onClick={sendCode}
              disabled={busy}
              className={`${quiet} w-fit`}
            >
              Email me a code
            </button>
          )}
        </div>
      )}

      <div className="grid gap-1.5">
        <PasswordField
          id={`${ids}-new`}
          name="new-password"
          label="New password"
          value={next}
          onChange={setNext}
          autoComplete="new-password"
          describedBy={`${ids}-rules`}
        />
        <ul
          id={`${ids}-rules`}
          className="mt-1 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2"
        >
          {rules.map((rule) => (
            <li
              key={rule.text}
              className={`flex items-center gap-2 ${rule.met ? "text-text" : "text-text-soft"}`}
            >
              <span
                aria-hidden
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${rule.met ? "bg-accent text-accent-contrast" : "border border-border-strong"}`}
              >
                {rule.met && (
                  <Icon name="check" strokeWidth={3} className="h-3 w-3" />
                )}
              </span>
              {rule.text}
              <span className="sr-only">
                {rule.met ? ": done" : ": not yet"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <PasswordField
        id={`${ids}-confirm`}
        name="confirm-password"
        label="Confirm password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
      />

      <Tick
        checked={signOutOthers}
        onChange={setSignOutOthers}
        label="Sign out my other devices"
      />

      {problem && (
        <p role="alert" className="text-[13px] text-danger">
          {problem}
        </p>
      )}
      {done && (
        <p role="status" className="text-[13px] text-text-soft">
          {done}
        </p>
      )}

      <div>
        <button type="submit" disabled={busy || !ready} className={main}>
          {busy
            ? "Saving..."
            : hasPassword
              ? "Change password"
              : "Set password"}
        </button>
      </div>
    </form>
  );
}
