// Shared look of the content forms, from the dashboard's own variables. Buttons are the toolbox's.
import { buttonClass } from "@/kit/Button";

export const field =
  "h-11 w-full rounded-xl border border-border-strong bg-card px-3 text-base text-text sm:text-sm transition-colors hover:border-text focus-visible:outline-2 focus-visible:outline-accent aria-[invalid=true]:border-danger";
export const labelCls = "mb-1.5 block text-[13px] font-medium text-text";
export const hintCls = "mt-1.5 text-xs text-text-soft";
export const primary = buttonClass("primary");
// A time box: the same look, but a fixed width, so open, to and close sit on one line.
export const timeField = field.replace("w-full", "w-32");

// A small button for actions in a list (Move up, Move down, Remove, Add), so they read as buttons and not as stray text.
export const btn = `${buttonClass("secondary")} px-4`;

// A quiet text button, for small actions beside a field.
export const link =
  "inline-block text-sm text-text-soft underline decoration-text-soft/40 underline-offset-4 transition-[color,text-decoration-color,transform] duration-150 hover:text-text hover:decoration-text focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.96] disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100";
