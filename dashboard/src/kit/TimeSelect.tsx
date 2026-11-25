"use client";

import Select, { type Option } from "./Select";

// A time of day, chosen from a list ("6:00 PM") instead of the browser's clock box. The value is "18:00". The same on every device: on a phone
// it opens as the Select's sheet with big rows. `from` and `to` are the first and last time offered, `step` the minutes between them.
const words = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  return `${h % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// The times offered. Pure, so it is tested. A time outside the range (or not on a step) that is already chosen is still shown, so editing
// something saved never loses its value.
export function timeOptions(value: string, from = "00:00", to = "23:30", step = 30): Option[] {
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const out: Option[] = [];
  for (let m = fh * 60 + fm; m <= th * 60 + tm; m += step) out.push({ value: clock(m), label: words(m) });
  if (/^\d{2}:\d{2}$/.test(value) && !out.some((o) => o.value === value)) {
    const [h, mi] = value.split(":").map(Number);
    out.push({ value, label: words(h * 60 + mi) });
    out.sort((a, b) => a.value.localeCompare(b.value));
  }
  return out;
}

export default function TimeSelect({ value, onChange, label, id, from, to, step, disabled, invalid }: { value: string; onChange: (next: string) => void; label: string; id?: string; from?: string; to?: string; step?: number; disabled?: boolean; invalid?: boolean }) {
  return <Select value={value} onChange={onChange} options={timeOptions(value, from, to, step)} label={label} id={id} disabled={disabled} invalid={invalid} placeholder="Pick a time" />;
}
