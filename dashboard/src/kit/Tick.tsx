"use client";

import Icon from "./Icon";

// A tick box that looks like the dashboard, not the browser: round-cornered, the accent colour when ticked, a visible
// focus ring, and a whole-row click target. It is a real checkbox underneath, so the keyboard and screen readers work.
export default function Tick({ checked, onChange, label, disabled = false, hideLabel = false }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean; hideLabel?: boolean }) {
  return (
    <label className={`inline-flex min-h-11 items-center gap-3 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-lg border transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${checked ? "border-accent bg-accent text-accent-contrast" : "border-border-strong bg-card"}`}
      >
        {checked && <Icon name="check" strokeWidth={2.6} className="h-3.5 w-3.5" />}
      </span>
      <span className={hideLabel ? "sr-only" : "text-sm"}>{label}</span>
    </label>
  );
}
