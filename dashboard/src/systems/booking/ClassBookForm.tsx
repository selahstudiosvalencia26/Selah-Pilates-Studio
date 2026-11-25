"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import SaveBar from "@/kit/SaveBar";
import Select from "@/kit/Select";
import { addClassBookingAction } from "./actions";
import { field, labelCls } from "./ui";

// Put someone into a class by hand (they phoned or walked in). The classes offered are the coming ones that still have room.
export type ClassChoice = { key: string; label: string; spotsLeft: number };

export default function ClassBookForm({ classes }: { classes: ClassChoice[] }) {
  const router = useRouter();
  const [v, setV] = useState({ sessionKey: classes[0]?.key ?? "", customerName: "", phone: "", email: "", spots: "1" });
  const [problem, setProblem] = useState("");
  const [pending, start] = useTransition();
  const set = (key: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [key]: e.target.value });

  if (classes.length === 0) return <p className="text-sm text-text-soft">There are no coming classes with room. Add them in Schedule first.</p>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setProblem("");
    start(async () => {
      const r = await addClassBookingAction({ ...v, spots: Number(v.spots), notes: "" });
      if (r.ok) router.push("/booking");
      else setProblem(r.message);
    });
  };

  return (
    <form onSubmit={submit} noValidate aria-label="Add booking">
      <div className="grid gap-5">
      <div>
        <label htmlFor="c-class" className={labelCls}>
          Class
        </label>
        <Select id="c-class" label="Class" value={v.sessionKey} onChange={(key) => setV({ ...v, sessionKey: key })} options={classes.map((c) => ({ value: c.key, label: c.label, hint: `${c.spotsLeft} ${c.spotsLeft === 1 ? "slot" : "slots"} left` }))} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className={labelCls}>
            Name
          </label>
          <input id="c-name" className={field} value={v.customerName} onChange={set("customerName")} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="c-phone" className={labelCls}>
            Phone
          </label>
          <input id="c-phone" type="tel" inputMode="tel" className={field} value={v.phone} onChange={set("phone")} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="c-email" className={labelCls}>
            Email
          </label>
          <input id="c-email" type="email" inputMode="email" className={field} value={v.email} onChange={set("email")} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="c-spots" className={labelCls}>
            Slots
          </label>
          <input id="c-spots" type="number" inputMode="numeric" min={1} className={field} value={v.spots} onChange={set("spots")} />
        </div>
      </div>
      </div>
      <SaveBar dirty={v.customerName !== "" || v.phone !== "" || v.email !== "" || v.spots !== "1"} pending={pending} label="Book the slot" message={problem ? { text: problem, bad: true } : null} />
    </form>
  );
}
