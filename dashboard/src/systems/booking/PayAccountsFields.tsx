"use client";

import { useRef, useState } from "react";
import Icon from "@/kit/Icon";
import { Field, Input } from "@/kit/Input";
import Select from "@/kit/Select";
import { caretAfter, formatAccountNumber } from "./accountNumber";
import { PAY_KINDS, PAY_KIND_NAMES, type PayAccount, type PayKind } from "./schema";
import QrCropper from "./QrCropper";
import { btn, hintCls, labelCls, link } from "./ui";

// How customers pay the deposit: any number of ways (GCash, Maya, another e-wallet, a bank account), each with its own QR
// picture. A chosen picture is cropped and zoomed first (QrCropper), then checked again on the server.
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (n) => n.toString(16).padStart(2, "0")).join("");

function Account({ account: a, change, remove }: { account: PayAccount; change: (patch: Partial<PayAccount>) => void; remove: () => void }) {
  const [problem, setProblem] = useState("");
  const pick = useRef<HTMLInputElement>(null);
  const named = a.kind === "ewallet" || a.kind === "bank";

  // Formats as it is typed, and keeps the cursor where the person is typing.
  const typeNumber = (box: HTMLInputElement) => {
    const before = box.value.slice(0, box.selectionStart ?? box.value.length).replace(/\D/g, "").length;
    const number = formatAccountNumber(a.kind, box.value);
    change({ number });
    const at = caretAfter(number, before);
    requestAnimationFrame(() => document.activeElement === box && box.setSelectionRange(at, at));
  };

  const [picked, setPicked] = useState(""); // a picture waiting to be cropped
  const choose = (file: File | undefined) => {
    if (pick.current) pick.current.value = "";
    if (!file) return;
    setProblem("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10_000_000) return setProblem("Choose a PNG, JPG or WebP picture under 10 MB.");
    const reader = new FileReader();
    reader.onload = () => setPicked(String(reader.result));
    reader.onerror = () => setProblem("That picture could not be opened. Try another one.");
    reader.readAsDataURL(file);
  };

  const title = a.kind === "bank" || a.kind === "ewallet" ? a.provider || PAY_KIND_NAMES[a.kind] : PAY_KIND_NAMES[a.kind];
  return (
    <li className="rounded-2xl border border-border bg-card transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-5">
        <h3 className="min-w-0 truncate text-sm font-semibold">{title}</h3>
        <button type="button" className="inline-flex min-h-11 shrink-0 flex-row items-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-sm text-text-soft transition-colors hover:bg-hover hover:text-danger focus-visible:outline-2 focus-visible:outline-accent" onClick={remove} aria-label={`Remove ${title}`}>
          <Icon name="trash" className="h-4 w-4" />
          Remove
        </button>
      </div>
      <div className={`grid items-start gap-4 p-4 sm:grid-cols-2 sm:p-5 ${named ? "xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]" : "xl:grid-cols-[repeat(3,minmax(0,1fr))_auto]"}`}>
        <div>
          <label htmlFor={`kind-${a.id}`} className={labelCls}>
            Type
          </label>
          <Select id={`kind-${a.id}`} label="Type" value={a.kind} onChange={(x) => change({ kind: x as PayKind, number: formatAccountNumber(x as PayKind, a.number) })} options={PAY_KINDS.map((k) => ({ value: k, label: PAY_KIND_NAMES[k] }))} />
        </div>
        {named && <Field label={a.kind === "bank" ? "Bank name" : "E-wallet name"}>{(p) => <Input {...p} value={a.provider} maxLength={40} onChange={(e) => change({ provider: e.target.value })} />}</Field>}
        <Field label="Account name">{(p) => <Input {...p} value={a.name} maxLength={80} autoComplete="off" onChange={(e) => change({ name: e.target.value })} />}</Field>
        <Field label={a.kind === "bank" ? "Account number" : "Mobile number"}>
          {(p) => <Input {...p} inputMode="tel" value={formatAccountNumber(a.kind, a.number)} placeholder={a.kind === "bank" ? "1234 5678 9012" : "0917 123 4567"} autoComplete="off" onChange={(e) => typeNumber(e.target)} />}
        </Field>
        <div>
          <span className={labelCls}>QR picture</span>
          <input ref={pick} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => choose(e.target.files?.[0])} />
          <div className="flex items-center gap-3">
            {/* Press it or drop a picture on it. */}
            <button
              type="button"
              onClick={() => pick.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => (e.preventDefault(), choose(e.dataTransfer.files[0]))}
              aria-label={a.qr ? `Change the ${title} QR picture` : `Add a ${title} QR picture`}
              className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border transition-[background-color,transform] duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.96] motion-reduce:transition-none ${a.qr ? "border-border" : "border-dashed border-border-strong"}`}
            >
              {a.qr ? (
                // eslint-disable-next-line @next/next/no-img-element -- the owner's own picture, held as data
                <img src={a.qr} alt="" className="h-full w-full object-contain" />
              ) : (
                <Icon name="plus" className="h-5 w-5 text-text-soft" />
              )}
            </button>
            <button type="button" className={`${link} min-h-11 whitespace-nowrap`} onClick={() => pick.current?.click()}>
              {a.qr ? "Change" : "Add picture"}
            </button>
            {a.qr && (
              <button type="button" className={`${link} min-h-11 whitespace-nowrap`} onClick={() => change({ qr: "" })}>
                Remove picture
              </button>
            )}
          </div>
          {problem && (
            <p role="alert" className="mt-1.5 text-xs text-danger">
              {problem}
            </p>
          )}
        </div>
      </div>
      {picked && <QrCropper src={picked} onCancel={() => setPicked("")} onDone={(qr) => (change({ qr }), setPicked(""))} />}
    </li>
  );
}

export default function PayAccountsFields({ value, onChange }: { value: PayAccount[]; onChange: (next: PayAccount[]) => void }) {
  return (
    <section className="grid gap-3" aria-labelledby="pay-h">
      <h2 id="pay-h" className="text-base font-medium">
        How customers pay
      </h2>
      <p className={hintCls}>Customers see these when it is time to pay. Check that each QR opens your own account.</p>
      {value.length === 0 && <p className="text-sm text-text-soft">Nothing here yet. Add GCash, a bank account or another way to pay.</p>}
      <ul className="grid gap-3 empty:hidden">
        {value.map((a) => (
          <Account key={a.id} account={a} change={(patch) => onChange(value.map((x) => (x.id === a.id ? { ...x, ...patch } : x)))} remove={() => onChange(value.filter((x) => x.id !== a.id))} />
        ))}
      </ul>
      <div>
        <button type="button" className={btn} disabled={value.length >= 5} onClick={() => onChange([...value, { id: newId(), kind: "gcash", provider: "", name: "", number: "", qr: "" }])}>
          Add a way to pay
        </button>
      </div>
    </section>
  );
}
