"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Icon from "@/kit/Icon";
import SaveBar from "@/kit/SaveBar";
import BrandMark from "@/shell/frame/BrandMark";
import { saveBranding } from "./actions";
import AccentPicker from "./AccentPicker";
import {
  brandingInput,
  brandingVars,
  DEFAULT_BRANDING,
  type Branding,
} from "./branding";
import { contrast, isHex } from "./contrast";
import { prepareLogo } from "./logoClient";
import { buttonClass } from "@/kit/Button";

// The Branding screen (docs/dashboard/shell-plan.md, section 5): a name, one accent colour and a logo, with the result shown as
// they change it. Whatever colour they pick, the dashboard keeps text readable on its own. Saving connects with the
// database (the settings keys brand_name, brand_accent and brand_logo_path).
const field =
  "h-11 w-full rounded-lg border border-border-strong bg-card px-3 text-sm text-text transition-colors hover:border-accent focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent aria-[invalid=true]:border-danger";
const quiet = buttonClass("quiet");

// `saved` is the look the dashboard has right now. `canSave` is false on a live site, where nothing can be saved yet.
export default function BrandingForm({
  saved,
  canSave,
}: {
  saved: Branding;
  canSave: boolean;
}) {
  const [name, setName] = useState(saved.name);
  const [accent, setAccent] = useState(saved.accent);
  const [logo, setLogo] = useState<string | null>(saved.logoUrl);
  // What to send for the logo: "keep" as it is, null to remove, or the small WebP made in the browser.
  const [logoChange, setLogoChange] = useState<string | null>("keep");
  const [saving, startSaving] = useTransition();
  const [saveNote, setSaveNote] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [logoError, setLogoError] = useState("");
  const [logoNote, setLogoNote] = useState("");
  const [checking, setChecking] = useState(false);
  const pick = useRef(0); // which choice is the latest, so a slow check never replaces a newer picture

  // The picture shown is a temporary local copy. Free it when it is replaced or the screen closes.
  useEffect(
    () => () => void (logo?.startsWith("blob:") && URL.revokeObjectURL(logo)),
    [logo],
  );

  const checked = brandingInput.safeParse({ name, accent });
  const colour = isHex(accent) ? accent : DEFAULT_BRANDING.accent;
  const vars = brandingVars(colour);
  const onWhite = vars["--accent-contrast"] === "#ffffff";
  const ratio = contrast(colour, onWhite ? "#ffffff" : "#111111");
  const readable = ratio >= 4.5;
  const nameError = !checked.success
    ? checked.error.issues.find((i) => i.path[0] === "name")?.message
    : undefined;
  const accentError = !checked.success
    ? checked.error.issues.find((i) => i.path[0] === "accent")?.message
    : undefined;

  // The chosen file is checked and re-drawn on a clean square before it is shown (see ./logo.ts). If it is refused, the
  // logo that was there stays, and the reason is shown.
  const pickLogo = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = ""; // choosing the same file again still counts
    if (!file) return;
    const mine = ++pick.current;
    setChecking(true);
    setLogoError("");
    setLogoNote("");
    const result = await prepareLogo(file);
    if (mine !== pick.current) {
      if (result.ok) URL.revokeObjectURL(result.url);
      return;
    }
    setChecking(false);
    if (!result.ok) return setLogoError(result.message);
    setLogo(result.url);
    setLogoChange(result.dataUrl);
    setLogoNote(result.note ?? "");
  };

  const removeLogo = () => {
    pick.current++;
    setChecking(false);
    setLogo(null);
    setLogoChange(null);
    setLogoError("");
    setLogoNote("");
  };

  const reset = () => {
    setName(DEFAULT_BRANDING.name);
    setAccent(DEFAULT_BRANDING.accent);
    removeLogo();
    setSaveNote(null);
  };

  const save = () => {
    if (!canSave || saving || checking || !checked.success) return;
    setSaveNote(null);
    startSaving(async () => {
      const result = await saveBranding({ name, accent, logo: logoChange });
      if (result.ok) {
        setLogoChange("keep");
        setSaveNote({ ok: true, text: "Saved. The menu now shows it." });
      } else setSaveNote({ ok: false, text: result.message });
    });
  };

  // Is there anything to save? The name, the colour, or a logo that was added or removed.
  const changed = name !== saved.name || accent !== saved.accent || logoChange !== "keep";

  return (
    <div className="grid gap-8">
      <section aria-label="Preview" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Preview</p>
          <p
            role="status"
            className={`inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-[13px] ${readable ? "text-text-soft" : "text-warning"}`}
          >
            <Icon
              name={readable ? "check" : "warning"}
              className={`h-3.5 w-3.5 shrink-0 ${readable ? "text-success" : ""}`}
            />
            {readable ? "Easy to read" : "Hard to read"}
          </p>
        </div>
        <div
          className="brand-preview overflow-hidden card"
          style={vars as React.CSSProperties}
        >
          <div className="grid min-h-[16rem] sm:grid-cols-[11.5rem_minmax(0,1fr)]">
            <div className="hidden flex-col gap-1 border-r border-sidebar-border bg-sidebar p-3 sm:flex">
              <div className="flex items-center gap-2.5 px-1 py-2">
                <BrandMark
                  name={name.trim() || DEFAULT_BRANDING.name}
                  logoUrl={logo}
                  size="sm"
                />
                <p className="min-w-0 truncate text-sm font-semibold tracking-[-0.01em]">
                  {name.trim() || DEFAULT_BRANDING.name}
                </p>
              </div>
              <div className="mt-2 grid gap-0.5">
                <MiniRow icon="today" label="Today" active />
                <MiniRow icon="calendar" label="Bookings" />
                <MiniRow icon="wallet" label="Payments" />
              </div>
            </div>
            <div className="grid content-start gap-4 bg-background p-6">
              <div>
                <p className="text-lg font-semibold tracking-tight">Today</p>
                <p className="text-[13px] text-text-soft">
                  Here is what needs you.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="grid gap-3 card p-4">
                  <p className="text-sm font-medium">New booking request</p>
                  <p className="text-[13px] text-text-soft">
                    Saturday, 6:00 PM · 40 guests
                  </p>
                  <div className="flex items-center gap-5 pt-1">
                    <span className={buttonClass("primary")}>
                      Confirm
                    </span>
                    <span className="text-sm font-medium text-accent-ink underline underline-offset-4">
                      Decline
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 self-start card p-4">
                  <p className="text-sm font-medium">2 deposits waiting</p>
                  <span className="text-sm font-medium text-accent-ink">
                    Review
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {!readable && (
          <p className="text-[13px] text-warning">
            Words on this colour are hard to read. Try a darker or lighter one.
          </p>
        )}
      </section>

      <form
        className="divide-y divide-border border-t border-border"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        noValidate
      >
        <Row
          title="Logo"
          help="PNG, WebP or JPG, under 1 MB. It is fitted into a square for you."
        >
          <div className="flex items-center gap-4">
            <BrandMark
              name={checked.success ? checked.data.name : name || "?"}
              logoUrl={logo}
              size="lg"
            />
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={`${quiet} cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent`}
              >
                <input
                  type="file"
                  accept="image/png,image/webp,image/jpeg"
                  disabled={checking}
                  onChange={(e) => void pickLogo(e.currentTarget)}
                  className="sr-only"
                />
                {checking
                  ? "Checking..."
                  : logo
                    ? "Change logo"
                    : "Upload a logo"}
              </label>
              {logo && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className={`${quiet} bg-transparent text-text-soft hover:text-text`}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          {(logoError || logoNote) && (
            <p
              role={logoError ? "alert" : "status"}
              className={`mt-3 text-[13px] ${logoError ? "text-danger" : "text-text-soft"}`}
            >
              {logoError || logoNote}
            </p>
          )}
        </Row>

        <Row
          title="Business name"
          help="Shown in the menu, on the sign-in page and in emails."
          htmlFor="brand-name"
        >
          <input
            id="brand-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "brand-name-error" : undefined}
            className={field}
          />
          {nameError && (
            <p
              id="brand-name-error"
              role="alert"
              className="mt-2 text-[13px] text-danger"
            >
              {nameError}
            </p>
          )}
        </Row>

        <Row
          title="Accent colour"
          help="Used for buttons and the page you are on. Text on it always stays readable."
        >
          <AccentPicker
            value={accent}
            onChange={setAccent}
            error={accentError}
            bare
          />
        </Row>

        <SaveBar
          dirty={canSave && changed && !checking && checked.success}
          pending={saving}
          label="Save"
          message={
            saveNote
              ? { text: saveNote.text, bad: !saveNote.ok }
              : canSave
                ? null
                : { text: "Saving turns on when the dashboard is connected to its database." }
          }
        >
          <button type="button" onClick={reset} className={quiet}>
            Reset
          </button>
        </SaveBar>
      </form>
    </div>
  );
}

// One setting: its name and one line of help on the left, the control on the right. On a phone they stack.
function Row({
  title,
  help,
  htmlFor,
  children,
}: {
  title: string;
  help: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const heading = <span className="text-sm font-medium">{title}</span>;
  return (
    <div className="grid gap-3 py-6 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-10">
      <div>
        {htmlFor ? <label htmlFor={htmlFor}>{heading}</label> : heading}
        <p className="mt-1 text-[13px] text-text-soft">{help}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

// One row of the small menu in the preview.
function MiniRow({
  icon,
  label,
  active = false,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex h-9 items-center gap-2.5 rounded-lg pl-2.5 pr-2 text-[13px] ${active ? "bg-selected font-medium text-text" : "text-sidebar-text"}`}
    >
      <Icon
        name={icon}
        weight={active ? "semibold" : "medium"}
        className={`h-4 w-4 ${active ? "text-accent-ink" : ""}`}
      />
      {label}
    </div>
  );
}
