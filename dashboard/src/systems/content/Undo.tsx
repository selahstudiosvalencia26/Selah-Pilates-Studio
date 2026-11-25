"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { link } from "./ui";

// "Removed Sculpt. Undo": after a removal the screen offers to take it back for a few seconds, instead of asking first
// first. Use it with <Remove>: call offer() with the words and a function that puts things back, and show `view` near the list.
export function useUndo(seconds = 10) {
  const [note, setNote] = useState<{ text: string; restore: () => void } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setNote(null);
  }, []);
  const offer = useCallback(
    (text: string, restore: () => void) => {
      if (timer.current) clearTimeout(timer.current);
      setNote({ text, restore });
      timer.current = setTimeout(() => setNote(null), seconds * 1000);
    },
    [seconds],
  );
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const view = note ? (
    <p role="status" className="flex flex-wrap items-center gap-3 text-sm text-text-soft">
      {note.text}
      <button
        type="button"
        className={link}
        onClick={() => {
          note.restore();
          clear();
        }}
      >
        Undo
      </button>
    </p>
  ) : null;

  return { offer, view };
}
