"use client";

import { useState } from "react";
import Icon from "@/kit/Icon";

// A password box with an eye on the right that shows or hides what was typed. Each box has its own eye, so a person can
// check one field without showing the others. The eye is a real button with a clear name, and it says whether it is on.
// Hidden again by default every time the screen opens, and never remembered.
export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  name,
  invalid = false,
  describedBy,
  hideLabel = false,
  placeholder,
  autoFocus = false,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  autoComplete: "current-password" | "new-password";
  name?: string;
  invalid?: boolean;
  describedBy?: string;
  hideLabel?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : "text-sm font-medium"}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          className={`h-11 w-full rounded-lg border border-border-strong bg-card pl-3 pr-12 text-sm text-text transition-colors placeholder:text-text-soft hover:border-accent focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent aria-[invalid=true]:border-danger ${className}`}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-label={
            shown
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          title={shown ? "Hide password" : "Show password"}
          className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-lg text-text-soft transition-[color,transform] duration-150 hover:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent active:scale-95"
        >
          <Icon
            name={shown ? "eye-off" : "eye"}
            weight="medium"
            className="h-5 w-5"
          />
        </button>
      </div>
    </div>
  );
}
