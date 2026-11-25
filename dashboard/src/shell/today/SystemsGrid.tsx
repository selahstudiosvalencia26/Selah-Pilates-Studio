"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { buttonClass } from "@/kit/Button";
import Icon from "@/kit/Icon";
import type { Offer } from "@/shell/systems/catalogue";
import SystemPoints from "@/shell/systems/SystemPoints";

// The systems on Today: the ones the business has (passed in as `children`, drawn on the server), then the ones it does not
// have yet, faded. The faded ones can be hidden, and the choice is remembered in this browser only. It changes nothing for anyone
// else and nothing on the server.
const KEY = "dashboard.hideNotInstalled";

export default function SystemsGrid({
  offers,
  empty,
  contactUrl,
  children,
}: {
  offers: Offer[];
  empty: boolean;
  contactUrl: string;
  children: React.ReactNode;
}) {
  // `shown`: the faded tiles are on the page. `out`: they are faded and shrunk. Hiding fades them out first and then takes them off
  // the page; showing puts them on the page faded out and then fades them in, one after another.
  const [shown, setShown] = useState(true);
  const [out, setOut] = useState(false);
  const [open, setOpen] = useState(""); // the one card that is opened, by system word
  const hidden = out || !shown;
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "1") setShown(false);
    } catch {
      /* storage can be blocked: the list simply stays shown */
    }
    return () => window.clearTimeout(timer.current);
  }, []);

  const toggle = () => {
    const next = !hidden;
    window.clearTimeout(timer.current);
    if (next) {
      setOut(true);
      timer.current = window.setTimeout(() => setShown(false), 220);
    } else {
      setShown(true);
      setOut(true);
      timer.current = window.setTimeout(() => setOut(false), 30);
    }
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      /* not remembered, still works for now */
    }
  };

  const message = (
    <a
      href={contactUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-accent-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent"
    >
      Message me
    </a>
  );

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="your-business" className="text-base font-semibold">
            Your business
          </h2>
          {offers.length > 0 && (
            <p className="mt-1 max-w-2xl text-sm text-text-soft">
              {hidden
                ? "Want another system? "
                : empty
                  ? "Nothing is set up yet. The faded ones can be added. "
                  : "What you have comes first. The faded ones are not in your dashboard yet. "}
              {message} and I will add it.
            </p>
          )}
        </div>
        {offers.length > 0 && (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!hidden}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-surface px-3.5 text-sm font-medium text-text transition-[background-color,transform] duration-150 hover:bg-selected focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] sm:min-h-10"
          >
            <Icon name={hidden ? "eye" : "eye-off"} className="h-4 w-4" />
            {hidden
              ? `Show ${offers.length} more you can add`
              : "Hide the ones not installed"}
          </button>
        )}
      </div>
      <ul className="grid grid-flow-row-dense gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
        {shown &&
          offers.map((o, i) => {
            const isOpen = open === o.id;
            return (
              <Fragment key={o.id}>
                <li
                  style={{ transitionDelay: out ? "0ms" : `${Math.min(i, 12) * 25}ms` }}
                  className={`rounded-xl border text-text-soft transition-[opacity,transform,border-color] duration-200 ease-out motion-reduce:transition-none ${isOpen ? "border-accent" : "border-dashed border-border-strong"} ${out ? "scale-95 opacity-0" : ""}`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? `more-${o.id}` : undefined}
                    onClick={() => setOpen(isOpen ? "" : o.id)}
                    className="flex h-full min-h-20 w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <Icon name={o.icon} className="h-5 w-5 shrink-0 opacity-70" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{o.name}</span>
                      <span className="block text-[13px]">{o.line}</span>
                      <SystemPoints points={o.points} />
                    </span>
                    <span className="shrink-0 rounded-md bg-selected px-2 py-0.5 text-xs font-medium">{o.soon ? "Coming soon" : "Not installed"}</span>
                    <Icon name="chevron-down" className={`h-4 w-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </li>
                {/* A full-width strip under the row. The grid is "dense", so the cards after it still fill the row above. */}
                {isOpen && shown && !out && (
                  <li id={`more-${o.id}`} className="col-span-full flex flex-wrap items-end justify-between gap-4 rounded-xl border border-accent bg-card px-5 py-4 transition-[opacity,translate] duration-200 ease-out starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none">
                    <div className="grid min-w-0 gap-2">
                      <h3 className="text-sm font-semibold">{o.name}</h3>
                      <ul className="grid list-disc gap-x-10 gap-y-1 pl-5 text-[13px] sm:grid-cols-2">
                        {o.details.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                      {o.extras.length > 0 && <p className="text-[13px] text-text-soft">Can be added: {o.extras.join(", ")}.</p>}
                    </div>
                    <a href={contactUrl} target="_blank" rel="noopener noreferrer" className={buttonClass()}>
                      Message me about {o.name}
                    </a>
                  </li>
                )}
              </Fragment>
            );
          })}
        {/* The last tile: for what the list does not cover. It is a message to the builder, not something to install. */}
        {shown && (
          <li className={`rounded-xl border border-dashed border-border-strong transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${out ? "scale-95 opacity-0" : ""}`}>
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full min-h-20 items-start gap-3 rounded-xl px-4 py-3 text-text-soft transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Icon name="plus" className="h-5 w-5 shrink-0 opacity-70" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-text">Made for your business</span>
                <span className="block text-[13px]">Need it to work your way, or something not listed here?</span>
                <SystemPoints points={["Your own words", "Extra details", "Something new"]} />
              </span>
              <span className="shrink-0 text-xs font-semibold text-accent-ink">Message me</span>
            </a>
          </li>
        )}
      </ul>
    </>
  );
}
