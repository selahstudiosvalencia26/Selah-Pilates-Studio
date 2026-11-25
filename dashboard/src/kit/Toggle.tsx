"use client";

// An on and off switch, for a setting that is simply on or off ("A deposit holds the date"). Use Tick for choosing one of several things in a
// list; use a Toggle when the setting itself is on or off. The whole row is the press target (at least 44 px high), it is a real switch for
// the keyboard and screen readers, and its state is told in words as well as by the position of the knob.
export default function Toggle({ checked, onChange, label, hint, disabled = false, id }: { checked: boolean; onChange: (next: boolean) => void; label: string; hint?: string; disabled?: boolean; id?: string }) {
  return (
    <label className={`flex min-h-11 items-center justify-between gap-4 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-text-soft">{hint}</span>}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none ${checked ? "border-accent bg-accent" : "border-border-strong bg-surface"}`}
      >
        <span aria-hidden className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-transform duration-150 motion-reduce:transition-none ${checked ? "translate-x-5" : ""}`} />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </label>
  );
}
