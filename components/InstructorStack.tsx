"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { bookHref } from "@/content/booking";
import type { Instructor } from "@/content/instructors";

// One slow, soft movement shared by every part of the card.
const ease =
  "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";
const rise = `translate-y-3 opacity-0 ${ease} group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100`;

const arrow =
  "inline-flex size-11 items-center justify-center rounded-full border border-ink/30 text-lg transition-[transform,background-color,opacity] duration-[var(--duration-fast)] active:scale-95 disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100";

const placeholder: Instructor = {
  slug: "to-come",
  name: "Instructor to come",
  role: null,
  bio: null,
  image: null,
};

export function InstructorStack({
  instructors,
  watermark,
}: {
  instructors: Instructor[];
  watermark: string;
}) {
  const items = instructors.length > 0 ? instructors : [placeholder];
  const [index, setIndex] = useState(0);
  const current = items[index];
  const many = items.length > 1;

  function go(step: number) {
    setIndex((i) => (i + step + items.length) % items.length);
  }

  const [first, ...others] = watermark.split(" ");

  return (
    <div className="mt-8">
      <div className="grid items-center justify-center gap-8 sm:grid-cols-[1fr_auto_1fr]">
        <span
          aria-hidden="true"
          className="hidden select-none text-right font-serif text-[clamp(2.5rem,8vw,7rem)] uppercase leading-none text-sand sm:block"
        >
          {first}
        </span>

        {/* Hover, keyboard focus or a tap on a phone all do the same quiet thing: the cards behind open a little, the photo comes
            closer, and the words rise into place one after the other. */}
        <div
          tabIndex={0}
          className="group relative mx-auto aspect-[7/8] h-[clamp(15rem,calc(100dvh-27rem),28rem)] max-w-full rounded-panel focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-ink"
        >
          {/* Cards stacked behind */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 -translate-x-2 translate-y-2 -rotate-3 rounded-panel bg-sand ${ease} group-hover:-translate-x-4 group-hover:-rotate-6 group-focus-within:-translate-x-4 group-focus-within:-rotate-6`}
          />
          <div
            aria-hidden="true"
            className={`absolute inset-0 translate-x-1 translate-y-1 rotate-2 rounded-panel bg-stone ${ease} group-hover:translate-x-3 group-hover:rotate-4 group-focus-within:translate-x-3 group-focus-within:rotate-4`}
          />

          <div
            className={`relative size-full overflow-hidden rounded-panel bg-stone shadow-sm ${ease} group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_rgb(27_42_53/0.18)] group-focus-within:-translate-y-1 motion-reduce:group-hover:translate-y-0`}
          >
            {current.image && (
              <Image
                key={current.slug}
                src={current.image}
                alt={current.name}
                fill
                sizes="24rem"
                className={`object-cover ${ease} group-hover:scale-[1.03] group-focus-within:scale-[1.03] motion-reduce:group-hover:scale-100`}
                style={{
                  objectPosition: current.imagePosition ?? undefined,
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-transparent" />
            {/* A deeper shade fades in under the words so they read easily. */}
            <div
              aria-hidden="true"
              className={`absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-transparent opacity-0 ${ease} group-hover:opacity-100 group-focus-within:opacity-100`}
            />
            <div className="absolute inset-x-0 bottom-0 p-6 text-left text-page">
              <h3 className="font-serif text-2xl">{current.name}</h3>
              {current.role && (
                <p className="mt-1 text-base text-page/85">{current.role}</p>
              )}
              {/* Folded to no height until asked for; always read by screen readers. */}
              <div
                className={`grid grid-rows-[0fr] ${ease} group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]`}
              >
                <div className="overflow-hidden">
                  {current.bio && (
                    <p
                      className={`pt-3 text-base leading-relaxed text-page/90 ${rise} delay-75`}
                    >
                      {current.bio}
                    </p>
                  )}
                  <div className={`pt-4 ${rise} delay-150`}>
                    <Link
                      href={bookHref}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-page px-5 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-page"
                    >
                      Book a session
                      <ArrowRight aria-hidden="true" size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {!current.image && (
              <span className="absolute left-5 top-5 max-w-[16rem] text-sm leading-relaxed text-muted">
                <span className="block font-medium text-ink/70">
                  Photo to add
                </span>
                {current.slug === "to-come"
                  ? "A portrait of each team member, smiling, in good light."
                  : `A portrait of ${current.name} in the studio, in good light (ask first).`}
              </span>
            )}
          </div>
        </div>

        <span
          aria-hidden="true"
          className="hidden select-none text-left font-serif text-[clamp(2.5rem,8vw,7rem)] uppercase leading-none text-sand sm:block"
        >
          {others.join(" ")}
        </span>
      </div>

      <p className="sr-only" aria-live="polite">
        {current.name}
        {current.role ? `, ${current.role}` : ""}
      </p>

      {many && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            type="button"
            aria-label="Previous instructor"
            disabled={!many}
            onClick={() => go(-1)}
            className={`${arrow} hover:bg-page`}
          >
            <ArrowLeft aria-hidden="true" size={18} />
          </button>
          <button
            type="button"
            aria-label="Next instructor"
            disabled={!many}
            onClick={() => go(1)}
            className={`${arrow} bg-ink text-page hover:opacity-90`}
          >
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
