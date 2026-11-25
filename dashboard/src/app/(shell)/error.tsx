"use client";

import { buttonClass } from "@/kit/Button";

export default function ShellError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid max-w-xl gap-3">
      <h1 className="text-2xl font-semibold">This page could not load</h1>
      <p className="text-sm text-text-soft">Your information could not be reached. Try again. If it keeps happening, ask the builder to check that the database files were run.</p>
      <p>
        <button type="button" onClick={reset} className={buttonClass("primary")}>
          Try again
        </button>
      </p>
    </div>
  );
}
