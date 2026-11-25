"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import { firstEnabled, moveActive, typeahead, type Option } from "./selectLogic";

// THE dropdown. Every choice-from-a-list in the shell and in every system uses this, never the browser's own <select>
// (docs/rules/frontend-rules.md, "Form controls"). The browser's list looks different in every browser, cannot be styled, and is poor on a phone.
//
//   - On a computer it opens right under the field (or above it when there is no room below).
//   - On a phone it opens as a sheet from the bottom of the screen, with big rows (at least 44 px), so a thumb can pick.
//   - Keyboard: arrows, Home, End, typing letters, Enter or Space to pick, Escape to close, Tab to move on. A screen reader hears a list box.
//   - With a `name` it also works inside a plain form: the chosen value is sent like any field.
export type { Option } from "./selectLogic";

const trigger =
  "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border-strong bg-card px-3 text-left text-sm text-text transition-colors hover:border-accent focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent aria-expanded:border-accent aria-[invalid=true]:border-danger aria-[invalid=true]:hover:border-danger aria-[invalid=true]:focus-visible:border-danger aria-[invalid=true]:focus-visible:ring-danger disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border-strong";

export default function Select({
  value,
  onChange,
  options,
  label,
  id,
  name,
  placeholder = "Choose",
  disabled = false,
  invalid = false,
  describedBy,
}: {
  value: string;
  onChange: (next: string) => void;
  options: readonly Option[];
  label: string; // plain words for what is being chosen. Shown as the sheet's title on a phone, and read out by a screen reader
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const auto = useId();
  const triggerId = id ?? `select-${auto}`;
  const listId = `${triggerId}-list`;
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false); // opened as a sheet from the bottom (a phone) rather than under the field
  const [up, setUp] = useState(false); // opened above the field: no room below
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const selected = options.findIndex((o) => o.value === value);
  const shown = selected >= 0 ? options[selected].label : "";

  const show = () => {
    if (disabled) return;
    const small = window.matchMedia("(max-width: 639px)").matches;
    const r = button.current?.getBoundingClientRect();
    const below = r ? window.innerHeight - r.bottom : 400;
    setSheet(small);
    setUp(!small && !!r && below < 280 && r.top > below);
    setActive(selected >= 0 && !options[selected].disabled ? selected : firstEnabled(options));
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const pick = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    onChange(o.value);
    close();
  };

  // The list takes the keyboard when it opens, and the highlighted choice scrolls into view.
  useEffect(() => {
    if (open) list.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);
  // A press outside closes it (the sheet has its own dim layer for that).
  useEffect(() => {
    if (!open || sheet) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open, sheet]);

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      show();
    }
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === "ArrowDown" || k === "ArrowUp" || k === "Home" || k === "End") {
      e.preventDefault();
      setActive(moveActive(options, active, k));
    } else if (k === "Enter" || k === " ") {
      e.preventDefault();
      pick(active);
    } else if (k === "Escape") {
      e.preventDefault();
      close();
    } else if (k === "Tab") {
      close(false);
    } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now();
      typed.current = { text: now - typed.current.at > 700 ? k : typed.current.text + k, at: now };
      const hit = typeahead(options, active, typed.current.text);
      if (hit >= 0) setActive(hit);
    }
  };

  const rows = (
    <ul
      ref={list}
      id={listId}
      role="listbox"
      tabIndex={-1}
      aria-label={label}
      aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
      onKeyDown={onListKey}
      className="max-h-[min(60dvh,22rem)] overflow-y-auto p-1.5 outline-none sm:max-h-64"
    >
      {options.map((o, i) => (
        <li
          key={o.value}
          id={`${listId}-${i}`}
          role="option"
          aria-selected={i === selected}
          aria-disabled={o.disabled || undefined}
          onPointerMove={() => !o.disabled && setActive(i)}
          onClick={() => pick(i)}
          className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm ${o.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${i === active ? "bg-hover" : ""} ${i === selected ? "font-medium" : ""}`}
        >
          {o.swatch && <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: o.swatch }} />}
          <span className="min-w-0 flex-1">
            <span className="block truncate">{o.label}</span>
            {o.hint && <span className="block truncate text-xs font-normal text-text-soft">{o.hint}</span>}
          </span>
          {i === selected && <Icon name="check" className="h-4 w-4 shrink-0 text-accent-ink" weight="semibold" />}
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={root} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={button}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => (open ? close() : show())}
        onKeyDown={onTriggerKey}
        className={trigger}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {selected >= 0 && options[selected].swatch && <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: options[selected].swatch }} />}
          <span className={`truncate ${shown ? "" : "text-text-soft"}`}>{shown || placeholder}</span>
        </span>
        <Icon name="chevron-down" className={`h-4 w-4 shrink-0 text-text-soft transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !sheet && (
        <div className={`absolute z-30 w-full rounded-2xl border border-border bg-card shadow-lg ${up ? "bottom-full mb-1 kit-pop-up" : "top-full mt-1 kit-pop"}`}>{rows}</div>
      )}

      {open &&
        sheet &&
        createPortal(
          <>
            <div aria-hidden onClick={() => close()} className="kit-fade fixed inset-0 z-40 bg-scrim" />
            <div className="kit-sheet fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-b-0 border-border bg-card pb-[env(safe-area-inset-bottom)] text-text shadow-lg">
              <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-4">
                <p className="min-w-0 truncate text-sm font-medium">{label}</p>
                <button type="button" aria-label="Close" onClick={() => close()} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-text-soft transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent">
                  <Icon name="close" className="h-5 w-5" />
                </button>
              </div>
              {rows}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
