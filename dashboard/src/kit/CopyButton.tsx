"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

// Copy some text with one tap, and say so. It says "Copied" for two seconds and then goes back, and a screen reader is
// told too. Nothing breaks if the browser refuses (a private window): it says "Could not copy" instead.
export default function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex h-11 items-center gap-2 rounded-lg bg-surface px-3 text-[13px] font-medium text-text transition-[background-color,transform] duration-150 hover:bg-selected focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.97] ${className}`}
    >
      <Icon name={state === "copied" ? "check" : "copy"} weight="medium" className={`h-4 w-4 ${state === "copied" ? "text-success" : ""}`} />
      {state === "copied" ? "Copied" : state === "failed" ? "Could not copy" : label}
      <span role="status" className="sr-only">
        {state === "copied" ? "Copied to the clipboard" : state === "failed" ? "Could not copy" : ""}
      </span>
    </button>
  );
}
