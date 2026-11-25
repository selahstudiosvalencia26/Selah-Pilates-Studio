"use client";

import { useEffect, useRef } from "react";
import Icon from "./Icon";

// THE dialog: a window over the page for one short task ("Add a class"). Every dialog in the shell and in every system uses this.
//   - A title, a round close button, the content, and the actions at the bottom right (a secondary "Cancel" and the one primary action).
//   - It is the browser's own <dialog>, opened as a modal, so the keyboard stays inside it, Escape closes it, the page behind cannot be used,
//     and a screen reader knows it is a dialog. Focus goes back to where it was when it closes.
//   - On a phone it rises from the bottom of the screen at full width, like the Select's sheet. On a computer it is centred.
//   - Pressing the dim layer outside closes it.
// Use it when a task needs the person's full attention and is short. If it needs a page of its own, make it a page.
export default function Dialog({ open, onClose, title, children, actions }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="kit-dialog-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="kit-pop m-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-0 text-text shadow-lg backdrop:bg-scrim max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:border-b-0"
    >
      <div className="grid gap-5 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="kit-dialog-title" className="text-xl font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-text transition-colors hover:bg-selected focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-5">{children}</div>
        {actions && <div className="flex flex-wrap justify-end gap-3">{actions}</div>}
      </div>
    </dialog>
  );
}
