"use client";

import { buttonClass } from "./Button";

// THE Save bar. Every form that saves changes ends with this one, in the shell and in every system, so saving looks and behaves the same
// everywhere (docs/rules/frontend-rules.md, "Saving"). Do not make a Save button or a sticky bar of your own.
//
//   - It stays at the bottom of the screen while the form scrolls under it, and rests at the end of the form when you reach it.
//   - It lines up with the rounded panel of the frame: it sits 8px above the window's edge like the panel does, spans the panel's full
//     width and follows its rounded corners, so it never crosses the panel's border.
//   - The button is greyed out until something changed, says "Saving" while it works, and the words beside it say what happened:
//     "You have changes that are not saved yet", "Saved", or what went wrong, next to the button, in plain words.
//
// Inside a <form>, leave out `onSave`: the button submits the form. Outside one (a screen made of several parts), pass `onSave`.
export type SaveMessage = { text: string; bad?: boolean } | null;

export default function SaveBar({
  dirty = true,
  pending = false,
  message = null,
  label = "Save changes",
  onSave,
  children,
}: {
  dirty?: boolean; // are there changes that are not saved? Greys the button out when false
  pending?: boolean; // is the save running?
  message?: SaveMessage; // the result of the last try
  label?: string; // plain words for what it saves, if "Save changes" is not clear enough ("Save settings")
  onSave?: () => void;
  children?: React.ReactNode; // a quieter action beside the button, for example "Reset"
}) {
  const shown = message?.text || (dirty ? "You have changes that are not saved yet." : "");
  return (
    <>
    {/* Takes up any spare height, so the bar is at the bottom even on a short page (globals.css, [data-savebar]). */}
    <div aria-hidden className="grow" />
    <div data-savebar className="sticky bottom-2 z-[5] -mx-4 -mb-4 mt-10 flex flex-wrap items-center gap-4 rounded-b-2xl border-t border-border bg-background px-4 py-4 sm:-mx-6 sm:-mb-6 sm:px-6 lg:-mx-10 lg:-mb-10 lg:px-10">
      <button
        type={onSave ? "button" : "submit"}
        onClick={onSave}
        disabled={pending || !dirty}
        className={buttonClass("primary")}
      >
        {pending ? "Saving" : label}
      </button>
      {children}
      <p role="status" aria-live="polite" className={`min-w-0 text-sm ${message?.bad ? "text-danger" : "text-text-soft"}`}>
        {shown}
      </p>
    </div>
    </>
  );
}
