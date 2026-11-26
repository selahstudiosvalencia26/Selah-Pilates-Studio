"use client";

import Dialog from "@/kit/Dialog";
import { btn, primary } from "./ui";

// A window that says what is about to happen, before deleting or cancelling (asked for by the studio).
export default function AskFirst({ open, title, text, yes, onYes, onClose }: { open: boolean; title: string; text: string; yes: string; onYes: () => void; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <button type="button" className={btn} onClick={onClose}>
            Keep it
          </button>
          <button type="button" className={primary} onClick={() => (onClose(), onYes())}>
            {yes}
          </button>
        </>
      }
    >
      <p className="text-sm text-text-soft">{text}</p>
    </Dialog>
  );
}
