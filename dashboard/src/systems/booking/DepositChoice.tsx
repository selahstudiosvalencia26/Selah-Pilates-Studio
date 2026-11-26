"use client";

import { useState } from "react";
import { peso } from "./pricing";
import type { Settings } from "./schema";
import { field, labelCls } from "./ui";

// How much a customer pays when booking a class: one tap for the usual percentages, "Other %" for any number, or one fixed
// amount. Under it, what that means for the studio's own class prices, so there is no sum to work out.
const USUAL = [25, 50, 75, 100];

const chip = (on: boolean) =>
  `min-h-11 rounded-lg border px-4 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent ${on ? "border-accent bg-accent font-medium text-accent-contrast" : "border-border-strong hover:bg-hover"}`;

type Props = {
  value: Pick<Settings, "depositKind" | "depositPercent">;
  prices: number[]; // the class prices on the schedule, in centavos
  onChange: (next: Partial<Settings>) => void;
};

export default function DepositChoice({ value, prices, onChange }: Props) {
  const percent = value.depositKind === "percent";
  const [typing, setTyping] = useState(percent && !USUAL.includes(value.depositPercent));
  const pick = (n: number) => {
    setTyping(false);
    onChange({ depositKind: "percent", depositPercent: n });
  };
  const examples = [...new Set(prices)].sort((a, b) => a - b).slice(0, 4);
  const share = Math.min(100, Math.max(0, value.depositPercent || 0));

  return (
    <div className="grid gap-3">
      <p id="dep-share" className={labelCls}>
        How much do customers pay when booking?
      </p>
      <div role="radiogroup" aria-labelledby="dep-share" className="flex flex-wrap gap-2">
        {USUAL.map((n) => (
          <button key={n} type="button" role="radio" aria-checked={percent && !typing && value.depositPercent === n} onClick={() => pick(n)} className={chip(percent && !typing && value.depositPercent === n)}>
            {n === 100 ? "100% (full price)" : `${n}%`}
          </button>
        ))}
        <button type="button" role="radio" aria-checked={percent && typing} onClick={() => (setTyping(true), onChange({ depositKind: "percent" }))} className={chip(percent && typing)}>
          Other %
        </button>
        <button type="button" role="radio" aria-checked={!percent} onClick={() => (setTyping(false), onChange({ depositKind: "fixed" }))} className={chip(!percent)}>
          Fixed amount
        </button>
      </div>

      {percent && typing && (
        <div className="grid gap-1 transition-[opacity,translate] duration-200 ease-out starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none">
          <label htmlFor="s-percent" className={labelCls}>
            Your percentage (1 to 100)
          </label>
          <input id="s-percent" type="number" inputMode="numeric" min={1} max={100} className={`${field} !w-32`} value={value.depositPercent || ""} onChange={(e) => onChange({ depositPercent: Number(e.target.value) })} />
        </div>
      )}

      {percent && examples.length > 0 && (
        <p role="status" className="text-sm text-text-soft">
          {examples.map((p) => `A ${peso(p)} class asks for ${peso(Math.round((p * share) / 100))}`).join(". ")}.{share < 100 ? " The rest is paid at the studio." : ""}
        </p>
      )}
    </div>
  );
}
