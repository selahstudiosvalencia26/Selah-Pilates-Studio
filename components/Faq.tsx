"use client";

import { Plus } from "@phosphor-icons/react";
import { useId, useState } from "react";

type Item = { q: string; a: string };

// Questions that open and close smoothly. One answer is open at a time.
export function Faq({ items }: { items: Item[] }) {
  const base = useId();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="border-t border-line">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${base}-panel-${i}`;
        const buttonId = `${base}-button-${i}`;
        return (
          <div key={item.q} className="border-b border-line">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-h-14 w-full items-center gap-6 py-4 text-left font-medium"
              >
                <span className="text-base text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{item.q}</span>
                <Plus
                  aria-hidden="true"
                  size={20}
                  className={`text-muted transition-transform duration-500 ease-[var(--ease-out)] motion-reduce:transition-none ${isOpen ? "rotate-[135deg]" : ""}`}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out)] motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden" inert={!isOpen}>
                <p className="pb-6 pl-12 text-muted">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
