"use client";

import { forwardRef, useId } from "react";
import Icon from "./Icon";

// The text boxes and their labels: one look for every form in the shell and in every system.
//   <Field label="Phone" hint="We may call you." error={problem}>{(p) => <Input {...p} icon="user" />}</Field>
// `Field` owns the label, the hint and the plain error under the box, and hands the box the ids that connect them, so a screen reader reads
// "Phone, Enter a number we can call" and the label is a real, clickable label. `Input` is the box (with an optional icon at the start);
// `Textarea` is the same for longer text. Both are at least 44 px high and use 16 px text on a phone, so a phone never zooms in when one is tapped.
const box =
  "w-full rounded-xl border border-border-strong bg-card text-text transition-colors placeholder:text-text-soft hover:border-accent focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent aria-[invalid=true]:border-danger aria-[invalid=true]:hover:border-danger aria-[invalid=true]:focus-visible:border-danger aria-[invalid=true]:focus-visible:ring-danger disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border-strong";

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & { icon?: string; invalid?: boolean; className?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ icon, invalid, className = "", ...rest }, ref) {
  return (
    <div className="relative">
      {icon && <Icon name={icon} className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-soft" />}
      <input ref={ref} aria-invalid={invalid || undefined} className={`${box} h-11 px-3 text-base sm:text-sm ${icon ? "pl-10" : ""} ${className}`} {...rest} />
    </div>
  );
});

type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & { invalid?: boolean; className?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ invalid, className = "", ...rest }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={`${box} min-h-24 px-3 py-2.5 text-base sm:text-sm ${className}`} {...rest} />;
});

// What Field hands its box: the id the label points at, whether it is invalid, and the ids of the words to read with it.
export type FieldProps = { id: string; invalid: boolean; "aria-describedby": string | undefined };

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: (props: FieldProps) => React.ReactNode }) {
  const auto = useId();
  const id = `f-${auto}`;
  const note = hint && !error ? `${id}-hint` : undefined; // an error takes the hint's place, so only one of them is read out
  const problem = error ? `${id}-error` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-text">
        {label}
      </label>
      {children({ id, invalid: !!error, "aria-describedby": [problem, note].filter(Boolean).join(" ") || undefined })}
      {hint && !error && (
        <p id={note} className="mt-1.5 text-xs text-text-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={problem} role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
