"use client";

import { buttonClass } from "@/kit/Button";
import { link } from "./ui";

// Remove happens at once and can be taken back: the screen that uses this offers "Removed X. Undo" (see ./Undo.tsx). Nothing is
// asked first, so it is one click, and nothing is lost: what is removed here is only changed on the screen until Save.
export function Remove({
  what,
  onRemove,
  button,
}: {
  what: string;
  onRemove: () => void;
  button?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={`Remove ${what}`}
      onClick={onRemove}
      className={button ? buttonClass("danger") : link}
    >
      Remove
    </button>
  );
}
