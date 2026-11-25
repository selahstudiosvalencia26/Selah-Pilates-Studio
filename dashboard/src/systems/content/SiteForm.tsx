"use client";

import { useState, useTransition } from "react";
import SaveBar from "@/kit/SaveBar";
import { saveSite } from "./actions";
import { siteSchema, type SiteData } from "./schema";
import { field, hintCls, labelCls } from "./ui";

type Row = {
  key: keyof SiteData;
  label: string;
  hint?: string;
  rows?: number;
  inputMode?: "decimal" | "numeric" | "tel" | "url" | "email";
};
const GROUPS: { title: string; note: string; rows: Row[] }[] = [
  {
    title: "The studio",
    note: "Shown in the menu bar, the footer and on Google.",
    rows: [
      { key: "name", label: "Name" },
      {
        key: "tagline",
        label: "Slogan",
        hint: "Shown big at the top of the home page.",
      },
      {
        key: "description",
        label: "Short description",
        rows: 3,
        hint: "Shown on the home page, the About page and in Google results.",
      },
    ],
  },
  {
    title: "Where to find you",
    note: "Shown in the footer, on Contact and on Google.",
    rows: [
      { key: "street", label: "Street" },
      { key: "barangay", label: "Barangay" },
      { key: "postalCode", label: "Postal code", inputMode: "numeric" },
      { key: "city", label: "City" },
      { key: "province", label: "Province" },
    ],
  },
  {
    title: "Map pin",
    note: "Where the pin sits on the map, and where Open in Google Maps leads.",
    rows: [
      {
        key: "latitude",
        label: "Latitude",
        hint: "Right-click the studio on Google Maps and copy the first number.",
        inputMode: "decimal",
      },
      {
        key: "longitude",
        label: "Longitude",
        hint: "The second number.",
        inputMode: "decimal",
      },
    ],
  },
  {
    title: "Phone and email",
    note: "Leave a box empty if you do not have one yet. The website then leaves it out.",
    rows: [
      {
        key: "phone",
        label: "Phone number",
        hint: "When there is a number, phones also show a Call us button.",
        inputMode: "tel",
      },
      { key: "email", label: "Email address", inputMode: "email" },
    ],
  },
  {
    title: "Social pages and booking",
    note: "Where the Facebook, Instagram and Book buttons go.",
    rows: [
      { key: "facebook", label: "Facebook link", inputMode: "url" },
      { key: "instagram", label: "Instagram link", inputMode: "url" },
      {
        key: "bookingUrl",
        label: "Booking link",
        hint: "Where every Book button goes. Leave empty to send people to the Contact page.",
        inputMode: "url",
      },
    ],
  },
];

// The Site information screen: every shared fact the website shows, in one place. Edit one here and it changes on every page.
export default function SiteForm({ initial }: { initial: SiteData }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, String(v)])),
  );
  const [error, setError] = useState<{
    field?: string;
    message: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const parsed = siteSchema.safeParse(values);
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      return setError({ field: String(i.path[0]), message: i.message });
    }
    setError(null);
    start(async () => {
      const r = await saveSite(parsed.data);
      if (r.ok) {
        setSaved(true);
        setDirty(false);
      } else setError({ field: r.field, message: r.message });
    });
  };

  return (
    <form onSubmit={submit} noValidate aria-label="Site information">
      <p className="mb-2 max-w-2xl text-sm text-text-soft">
        These show on every page of the website. Change one here and it changes
        everywhere.
      </p>
      {GROUPS.map((g) => (
        <fieldset
          key={g.title}
          className="grid gap-5 border-t border-border py-8 first-of-type:border-t-0 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12"
        >
          <legend className="sr-only">{g.title}</legend>
          <div className="lg:pt-1">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
              {g.title}
            </h2>
            <p className="mt-1 max-w-[16rem] text-[13px] leading-relaxed text-text-soft">
              {g.note}
            </p>
          </div>
          <div className="grid min-w-0 content-start gap-5">
            {g.rows.map((r) => (
              <div key={r.key}>
                <label htmlFor={`site-${r.key}`} className={labelCls}>
                  {r.label}
                </label>
                {r.rows ? (
                  <textarea
                    id={`site-${r.key}`}
                    rows={r.rows}
                    value={values[r.key] ?? ""}
                    aria-invalid={error?.field === r.key || undefined}
                    aria-describedby={r.hint ? `site-${r.key}-hint` : undefined}
                    onChange={(e) => {
                      setValues({ ...values, [r.key]: e.target.value });
                      setSaved(false);
                      setDirty(true);
                    }}
                    className={`${field} h-auto min-h-24 py-2.5 leading-relaxed`}
                  />
                ) : (
                  <input
                    id={`site-${r.key}`}
                    value={values[r.key] ?? ""}
                    inputMode={r.inputMode}
                    aria-invalid={error?.field === r.key || undefined}
                    aria-describedby={r.hint ? `site-${r.key}-hint` : undefined}
                    onChange={(e) => {
                      setValues({ ...values, [r.key]: e.target.value });
                      setSaved(false);
                      setDirty(true);
                    }}
                    className={field}
                  />
                )}
                {r.hint && (
                  <p id={`site-${r.key}-hint`} className={hintCls}>
                    {r.hint}
                  </p>
                )}
              </div>
            ))}
          </div>
        </fieldset>
      ))}
      <SaveBar dirty={dirty} pending={pending} message={error ? { text: error.message, bad: true } : saved ? { text: "Saved. Refresh the website to see it." } : null} />
    </form>
  );
}
