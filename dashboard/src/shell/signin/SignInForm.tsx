"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import PasswordField from "@/shell/account/PasswordField";
import { checkCode, devSignIn, requestCode, signInWithPassword } from "./actions";
import { buttonClass } from "@/kit/Button";

// Two steps on one card: the email, then the code that was sent to it. One thing to do at a time.
const input = "h-12 w-full rounded-xl bg-surface px-4 text-[15px] text-text placeholder:text-text-soft transition-colors hover:bg-selected focus-visible:outline-2 focus-visible:outline-accent aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-danger";
const main = `${buttonClass("primary", { block: true })} min-h-12 text-[15px]`;
const link = "text-sm font-medium text-accent-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent";

// `devSkip` only changes what is shown. The server checks again, so a person cannot switch it on from the browser.
export default function SignInForm({ devSkip = false, passwordOnly = false }: { devSkip?: boolean; passwordOnly?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code" | "password">("password");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [trap, setTrap] = useState(""); // hidden from people; only a bot fills it in (see actions.ts)
  const [busy, start] = useTransition();

  const send = (again = false) =>
    start(async () => {
      setProblem(null);
      setNote(null);
      if (devSkip) {
        const skipped = await devSignIn(email, trap);
        if (!skipped.ok) return setProblem(skipped.message);
        return router.push("/preview");
      }
      const result = await requestCode(email, trap);
      if (!result.ok) return setProblem(result.message);
      setStep("code");
      if (again) setNote("We sent a new code.");
    });

  const verify = () =>
    start(async () => {
      setProblem(null);
      const result = await checkCode({ email, code });
      if (!result.ok) return setProblem(result.message);
      router.push("/preview");
    });

  const withPassword = () =>
    start(async () => {
      setProblem(null);
      const result = await signInWithPassword({ email, password }, trap);
      if (!result.ok) return setProblem(result.message);
      setPassword("");
      router.push("/preview");
    });

  if (step === "password") {
    return (
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          withPassword();
        }}
        noValidate
      >
        <div className="grid gap-3">
          <label htmlFor="email" className="sr-only">
            Email or username
          </label>
          <input id="email" type="text" autoCapitalize="none" spellCheck={false} placeholder="Email or username" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          <PasswordField id="password" label="Password" hideLabel placeholder="Password" autoComplete="current-password" value={password} onChange={setPassword} invalid={Boolean(problem)} describedBy={problem ? "problem" : undefined} />
        </div>
        {/* The trap: off the screen, skipped by the keyboard and screen readers, so only a bot meets it. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
          </label>
        </div>
        {problem && (
          <p id="problem" role="alert" className="text-[13px] text-danger">
            {problem}
          </p>
        )}
        <button type="submit" disabled={busy || email.trim() === "" || password === ""} className={main}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
        <div className={passwordOnly ? "hidden" : "flex justify-center"}>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setPassword("");
              setProblem(null);
            }}
            className={link}
          >
            Use a code instead
          </button>
        </div>
      </form>
    );
  }

  if (step === "email") {
    return (
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        noValidate
      >
        <div className="grid gap-1.5">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input id="email" type="email" placeholder="Email" autoComplete="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={problem ? true : undefined} aria-describedby={problem ? "problem" : undefined} className={input} />
          <p className="px-1 text-[13px] text-text-soft">{devSkip ? "Prototype mode: no code needed yet. This turns off when the database is connected." : "We will email you a code. No password needed."}</p>
        </div>
        {/* The trap: off the screen, skipped by the keyboard and screen readers, so only a bot meets it. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
          </label>
        </div>
        {problem && (
          <p id="problem" role="alert" className="text-[13px] text-danger">
            {problem}
          </p>
        )}
        <button type="submit" disabled={busy || email.trim() === ""} className={main}>
          {busy ? (devSkip ? "Signing in..." : "Sending...") : devSkip ? "Sign in" : "Send me a code"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("password");
            setProblem(null);
          }}
          className={`${link} justify-self-center py-2`}
        >
          Use a password instead
        </button>
      </form>
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        verify();
      }}
      noValidate
    >
      <div className="grid gap-1.5">
        <label htmlFor="code" className="sr-only">
          Code
        </label>
        <input id="code" inputMode="numeric" placeholder="6 number code" autoComplete="one-time-code" autoFocus maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-invalid={problem ? true : undefined} aria-describedby="code-help" className={`${input} text-center tracking-[0.3em] placeholder:tracking-normal`} />
        <p id="code-help" className="text-[13px] text-text-soft">
          We sent a 6 number code to {email}. It works for 10 minutes.
        </p>
      </div>
      {problem && (
        <p role="alert" className="text-[13px] text-danger">
          {problem}
        </p>
      )}
      {note && (
        <p role="status" className="text-[13px] text-text-soft">
          {note}
        </p>
      )}
      <button type="submit" disabled={busy || code.length !== 6} className={main}>
        {busy ? "Checking..." : "Sign in"}
      </button>
      <div className="flex items-center justify-between">
        <button type="button" disabled={busy} onClick={() => send(true)} className={link}>
          Send a new code
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
            setProblem(null);
            setNote(null);
          }}
          className={link}
        >
          Use another email
        </button>
      </div>
    </form>
  );
}
