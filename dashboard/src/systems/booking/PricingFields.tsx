"use client";

import { useState } from "react";
import { Field, Input } from "@/kit/Input";
import { parseAmount } from "@/kit/money";
import Select from "@/kit/Select";
import type { Settings } from "./schema";
import { btn, hintCls, labelCls, link } from "./ui";

// The venue's prices and how much of them is the deposit. Money is typed in pesos and kept in centavos.
// An amount that cannot be read is kept as -1, so saving says what is wrong instead of saving something else.
const pesos = (centavos: number) => (centavos < 0 ? "" : (centavos / 100).toFixed(2).replace(/\.00$/, ""));
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (n) => n.toString(16).padStart(2, "0")).join("");

function Money({ label, value, onChange }: { label: string; value: number; onChange: (centavos: number) => void }) {
  const [text, setText] = useState(pesos(value));
  return (
    <Field label={`${label} (₱)`}>
      {(p) => <Input {...p} inputMode="decimal" value={text} onChange={(e) => (setText(e.target.value), onChange(parseAmount(e.target.value) ?? -1))} />}
    </Field>
  );
}

type Props = { value: Settings; edit: (patch: Partial<Settings>) => void };

export default function PricingFields({ value: s, edit }: Props) {
  const change = (id: string, patch: Partial<Settings["packages"][number]>) => edit({ packages: s.packages.map((p) => (p.id === id ? { ...p, ...patch } : p)) });

  return (
    <>
      <section className="grid gap-3" aria-labelledby="price-h">
        <h2 id="price-h" className="text-base font-medium">
          Prices
        </h2>
        <div>
          <label htmlFor="s-price" className={labelCls}>
            How do you charge?
          </label>
          <Select id="s-price" label="How do you charge?" value={s.priceType} onChange={(x) => edit({ priceType: x as Settings["priceType"] })} options={[{ value: "none", label: "Do not show prices" }, { value: "hour", label: "By the hour" }, { value: "package", label: "Packages" }]} />
          <p className={hintCls}>Prices you add here are shown on your website. Old bookings keep the price they had.</p>
        </div>
        {s.priceType === "hour" && <Money label="Price for one hour" value={s.hourPrice} onChange={(hourPrice) => edit({ hourPrice })} />}
        {s.priceType === "package" && (
          <div className="grid gap-3">
            {s.packages.length === 0 && <p className="text-sm text-text-soft">No packages yet. Add one, for example Half day.</p>}
            <ul className="grid gap-3 empty:hidden">
              {s.packages.map((p) => (
                <li key={p.id} className="grid gap-3 rounded-xl border border-border p-4 lg:grid-cols-3 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none">
                  <Field label="Package name">{(f) => <Input {...f} value={p.name} maxLength={60} onChange={(e) => change(p.id, { name: e.target.value })} />}</Field>
                  <div className="grid grid-cols-2 gap-3 lg:col-span-2">
                    <Field label="Hours">{(f) => <Input {...f} type="number" inputMode="numeric" min={1} max={24} value={p.hours} onChange={(e) => change(p.id, { hours: Number(e.target.value) })} />}</Field>
                    <Money label="Price" value={p.price} onChange={(price) => change(p.id, { price })} />
                  </div>
                  <button type="button" className={`${link} justify-self-start lg:col-span-3`} onClick={() => edit({ packages: s.packages.filter((x) => x.id !== p.id) })}>
                    Remove package
                  </button>
                </li>
              ))}
            </ul>
            <div>
              <button type="button" className={btn} disabled={s.packages.length >= 10} onClick={() => edit({ packages: [...s.packages, { id: newId(), name: "", hours: 4, price: 0 }] })}>
                Add a package
              </button>
            </div>
          </div>
        )}
        {s.priceType !== "none" && s.maxDays > 1 && <Money label="Price for a whole day, for bookings of several days" value={s.dayPrice} onChange={(dayPrice) => edit({ dayPrice })} />}
      </section>

      {s.depositRequired && s.priceType !== "none" && (
        <section className="grid gap-3" aria-labelledby="share-h">
          <h2 id="share-h" className="text-base font-medium">
            Deposit size
          </h2>
          <div className={`grid items-start gap-3 ${s.depositKind === "percent" ? "sm:grid-cols-2" : ""}`}>
            <div>
              <label htmlFor="s-kind" className={labelCls}>
                Ask for
              </label>
              <Select id="s-kind" label="Ask for" value={s.depositKind} onChange={(x) => edit({ depositKind: x as Settings["depositKind"] })} options={[{ value: "fixed", label: "The same amount every time" }, { value: "percent", label: "A percentage of the price" }]} />
            </div>
            {s.depositKind === "percent" && (
              <Field label="Percentage (%)" hint="30 means a 3,000 deposit on a 10,000 price. A booking with no price uses the fixed amount.">
                {(p) => <Input {...p} type="number" inputMode="numeric" min={1} max={100} value={s.depositPercent} onChange={(e) => edit({ depositPercent: Number(e.target.value) })} />}
              </Field>
            )}
          </div>
        </section>
      )}
    </>
  );
}
