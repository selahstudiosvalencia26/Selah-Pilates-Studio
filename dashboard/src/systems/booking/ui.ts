// The shared look of the booking screens, from the dashboard's own variables (no colour is written by hand). Buttons are the toolbox's.
import { buttonClass } from "@/kit/Button";

export const field =
  "h-11 w-full rounded-xl border border-border-strong bg-card px-3 text-base text-text sm:text-sm transition-colors hover:border-text focus-visible:outline-2 focus-visible:outline-accent aria-[invalid=true]:border-danger";
export const area = field.replace("h-11", "min-h-24 py-2.5");
export const labelCls = "mb-1.5 block text-[13px] font-medium text-text";
export const hintCls = "mt-1.5 text-xs text-text-soft";
export const primary = buttonClass("primary");
export const btn = buttonClass("secondary");
export const link =
  "inline-block text-sm text-text-soft underline decoration-text-soft/40 underline-offset-4 transition-[color,text-decoration-color] duration-150 hover:text-text hover:decoration-text focus-visible:outline-2 focus-visible:outline-accent";
export const card = "rounded-2xl border border-border bg-card";
// A pill you press to choose (a time, a day): quiet until chosen.
export const pick = (on: boolean) =>
  `inline-flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm transition-[background-color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 ${on ? "border-accent bg-accent text-accent-contrast" : "border-border-strong bg-card text-text hover:bg-hover"}`;
