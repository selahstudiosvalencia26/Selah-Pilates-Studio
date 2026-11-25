"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/kit/Icon";
import { ACCENT_PRESETS } from "./branding";
import { clamp01, hexToHsv, hsvToHex, type Hsv } from "./color";
import { isHex } from "./contrast";

// The accent colour picker: ready-made colours in one tap, and a rainbow "+" that opens a colour square, a hue strip and
// the exact code, right under the row. Made here, not the browser's own picker, so it matches the dashboard in light
// and dark, works with the keyboard, and the colours it can make are all valid.
const field =
  "h-11 w-full rounded-lg border border-border-strong bg-card px-3 text-sm text-text uppercase transition-colors hover:border-accent focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent aria-[invalid=true]:border-danger";

export default function AccentPicker({ value, onChange, error , bare = false }: { value: string; onChange: (hex: string) => void; error?: string ; bare?: boolean }) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(isHex(value) ? value : "#2563eb"));
  const square = useRef<HTMLDivElement>(null);
  const preset = ACCENT_PRESETS.some((p) => p.hex === value.toLowerCase());

  // When the colour is changed from outside (a ready-made colour, or typing a code), follow it. Keep our own hue when
  // the colour is grey or black, where the hue cannot be read back from the code.
  useEffect(() => {
    if (isHex(value) && hsvToHex(hsv) !== value.toLowerCase()) setHsv(hexToHsv(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const set = (next: Hsv) => {
    setHsv(next);
    onChange(hsvToHex(next));
  };

  const fromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    set({ ...hsv, s: clamp01((e.clientX - box.left) / box.width), v: 1 - clamp01((e.clientY - box.top) / box.height) });
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const move: Record<string, Partial<Hsv>> = {
      ArrowLeft: { s: clamp01(hsv.s - step) },
      ArrowRight: { s: clamp01(hsv.s + step) },
      ArrowUp: { v: clamp01(hsv.v + step) },
      ArrowDown: { v: clamp01(hsv.v - step) },
    };
    if (!move[e.key]) return;
    e.preventDefault();
    set({ ...hsv, ...move[e.key] });
  };

  const swatch = "relative block h-9 w-9 rounded-full after:absolute after:-inset-1 after:content-['']  border border-black/25 transition-transform duration-150 hover:scale-105 active:scale-95";
  const ring = "ring-2 ring-text ring-offset-2 ring-offset-background";

  return (
    <fieldset className="grid gap-3">
      <legend className={bare ? "sr-only" : "mb-1 text-sm font-medium"}>Accent colour</legend>

      <div className="flex flex-wrap items-center gap-2.5">
        {ACCENT_PRESETS.map((p) => (
          <label key={p.hex} className="relative cursor-pointer">
            <input type="radio" name="accent" value={p.hex} checked={value.toLowerCase() === p.hex} onChange={() => onChange(p.hex)} className="peer sr-only" />
            <span className={`${swatch} peer-checked:ring-2 peer-checked:ring-text peer-checked:ring-offset-2 peer-checked:ring-offset-background peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent`} style={{ backgroundColor: p.hex }} />
            <span className="sr-only">{p.name}</span>
          </label>
        ))}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="accent-custom"
          aria-label="Pick your own colour"
          onClick={() => setOpen((o) => !o)}
          className={`${swatch} grid place-items-center text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${open || !preset ? ring : ""}`}
          style={{ background: "conic-gradient(from 0deg, #ff453a, #ff9f0a, #ffd60a, #32d74b, #40c8e0, #0a84ff, #bf5af2, #ff375f, #ff453a)" }}
        >
          <Icon name="plus" strokeWidth={2.4} className="h-[18px] w-[18px] drop-shadow-[0_0_2px_rgba(0,0,0,0.45)]" />
        </button>
      </div>

      <div id="accent-custom" inert={!open} className={`grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="relative min-h-0 overflow-hidden">
          <div className="grid gap-4 card bg-surface p-4">
            <div
              ref={square}
              role="slider"
              tabIndex={0}
              aria-label="Colour shade"
              aria-valuetext={`Richness ${Math.round(hsv.s * 100)} percent, brightness ${Math.round(hsv.v * 100)} percent. Use the arrow keys.`}
              aria-valuenow={Math.round(hsv.s * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              onKeyDown={onKey}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                fromPointer(e);
              }}
              onPointerMove={(e) => e.buttons === 1 && fromPointer(e)}
              className="relative h-40 w-full cursor-crosshair touch-none overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
            >
              <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(to right, #fff, rgba(255,255,255,0))" }} />
              <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(to top, #000, rgba(0,0,0,0))" }} />
              <span aria-hidden className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
            </div>

            <input type="range" min={0} max={360} step={1} value={Math.round(hsv.h)} onChange={(e) => set({ ...hsv, h: Number(e.target.value) })} aria-label="Colour tone" className="hue-slider" />

            <div className="flex items-center gap-3">
              <span aria-hidden className="h-11 w-11 shrink-0 rounded-lg border border-border-strong" style={{ backgroundColor: isHex(value) ? value : "transparent" }} />
              <label className="sr-only" htmlFor="brand-accent">
                Colour code
              </label>
              <input id="brand-accent" value={value} onChange={(e) => onChange(e.target.value.trim())} maxLength={7} spellCheck={false} autoComplete="off" aria-invalid={!!error} aria-describedby="brand-accent-note" className={field} />
            </div>
          </div>
        </div>
      </div>

      <p id="brand-accent-note" role={error ? "alert" : undefined} className={`text-[13px] ${error ? "text-danger" : "text-text-soft"} ${bare && !error ? "sr-only" : ""}`}>
        {error ?? "For buttons and the page you are on. Text on it always stays readable."}
      </p>
    </fieldset>
  );
}
