import {
  ArrowUpRight,
  Barbell,
  Leaf,
  PersonSimple,
  PersonSimpleTaiChi,
} from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/Button";
import { ClassCarousel } from "@/components/ClassCarousel";
import { ClassCard, ClassCardPlaceholder } from "@/components/ClassCard";
import { Faq } from "@/components/Faq";
import { InstructorStack } from "@/components/InstructorStack";
import { PhotoSlot } from "@/components/PhotoSlot";
import { Reveal } from "@/components/Reveal";
import { StudioMap } from "@/components/StudioMap";
import { classes } from "@/content/classes";
import { home } from "@/content/home";
import { hours } from "@/content/hours";
import { instructors } from "@/content/instructors";
import { site } from "@/content/site";
import { bookHref } from "@/content/booking";
import { hoursRows } from "@/lib/hours";

// The page-wide container. Every section uses it, so all edges line up.
export const wrap = "mx-auto w-full max-w-page px-gutter";

const classGroups = [
  { key: "Group mat class", title: "Group mat classes" },
  { key: "Private reformer session", title: "Private reformer sessions" },
] as const;

const benefitIcons = {
  barbell: Barbell,
  posture: PersonSimple,
  flexibility: PersonSimpleTaiChi,
  calm: Leaf,
} as const;

export const headerGrid =
  "mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] md:items-end md:gap-16";
export const h2 =
  "text-balance font-serif text-[length:var(--text-title)] leading-[1.1]";

// Small label above each section title: a quiet dot and spaced letters, no box.
export function Kicker({
  children,
  center = false,
}: {
  children: string;
  center?: boolean;
}) {
  return (
    <p
      className={`w-fit text-sm font-medium uppercase tracking-[0.22em] text-muted ${center ? "mx-auto" : ""}`}
    >
      {children}
    </p>
  );
}

// The top of an inner page (About, Class, Contact): label, big title, short text.
export function PageHero({
  kicker,
  title,
  text,
  children,
}: {
  kicker: string;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-page pb-16 pt-40 sm:pb-24 sm:pt-48">
      <div className={wrap}>
        <Reveal now className="text-center">
          <Kicker center>{kicker}</Kicker>
          <h1 className="mx-auto mt-5 max-w-5xl text-balance font-serif text-[length:var(--text-hero)] italic leading-[1.05]">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">{text}</p>
          {children}
        </Reveal>
      </div>
    </section>
  );
}

// A closing call to action with a booking button.
export function CtaPanel({ title, text }: { title: string; text: string }) {
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <div className="flex flex-col items-start justify-between gap-8 rounded-panel bg-sand p-8 sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className={h2}>{title}</h2>
            <p className="mt-3 max-w-xl text-muted">{text}</p>
          </div>
          <LinkButton
            href={bookHref}
            variant="dark"
            className="shrink-0 text-sm"
          >
            {home.visit.cta}
          </LinkButton>
        </div>
      </Reveal>
    </section>
  );
}

export function GoodForSection() {
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <Kicker>{home.goodFor.kicker}</Kicker>
        <div className={headerGrid}>
          <h2 className={h2}>{home.goodFor.title}</h2>
          <p className="text-muted md:justify-self-end">{home.goodFor.text}</p>
        </div>
        <ul className="mt-12 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {home.goodFor.items.map((item) => (
            <li key={item.title} className="border-t border-line py-8">
              <h3 className="text-lg font-medium">{item.title}</h3>
              <p className="mt-2 text-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

// grid: show all classes in a grid (the Class page). Otherwise a swipeable row (the home page).
export function ClassesSection({
  grid = false,
  header = true,
}: {
  grid?: boolean;
  header?: boolean;
}) {
  const none = classes.length === 0;
  const cards = none
    ? [0, 1, 2].map((i) => <ClassCardPlaceholder key={i} grid={grid} />)
    : classes.map((c) => <ClassCard key={c.slug} item={c} grid={grid} />);
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        {header && (
          <>
            <Kicker>{home.classes.title}</Kicker>
            <div className={headerGrid}>
              <h2 className={h2}>{home.classes.text}</h2>
              <p className="text-muted md:justify-self-end">
                {none ? home.classes.emptyNote : home.classes.intro}
              </p>
            </div>
          </>
        )}
        {grid ? (
          <div className={header ? "mt-12" : ""}>
            {none && (
              <ul className="-mx-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cards}
              </ul>
            )}
            {classGroups.map((g) => {
              const items = classes.filter((c) => c.group === g.key);
              if (items.length === 0) return null;
              return (
                <div key={g.key} className="mt-14 first:mt-0">
                  <Kicker>{g.title}</Kicker>
                  <ul className="-mx-2 mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((c) => (
                      <ClassCard key={c.slug} item={c} grid />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <ClassCarousel>{cards}</ClassCarousel>
        )}
        <LinkButton href="/class" variant="quiet" className="mt-6">
          {home.classes.cta}
        </LinkButton>
      </Reveal>
    </section>
  );
}

export function BenefitsSection() {
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <Kicker>{home.benefits.kicker}</Kicker>
        <div className={headerGrid}>
          <h2 className={h2}>{home.benefits.title}</h2>
          <p className="text-muted md:justify-self-end">{home.benefits.text}</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-[1fr_1.3fr] md:gap-10">
          <PhotoSlot
            slot="home-benefits"
            src={null}
            alt={home.benefits.photoAlt}
            hint={home.benefits.photoHint}
            className="aspect-[4/5] w-full md:aspect-auto md:min-h-[28rem]"
          />
          <ul className="grid content-start gap-x-10 sm:grid-cols-2">
            {home.benefits.items.map((item) => {
              const Icon = benefitIcons[item.icon as keyof typeof benefitIcons];
              return (
                <li key={item.title} className="border-t border-line py-8">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-sand">
                    <Icon aria-hidden="true" size={20} />
                  </span>
                  <h3 className="mt-4 text-lg font-medium">{item.title}</h3>
                  <p className="mt-2 text-muted">{item.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}

export function InstructorsSection() {
  return (
    <section className="overflow-x-clip bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <div className="text-center">
          <Kicker center>{home.instructors.kicker}</Kicker>
          <h2 className="mt-4 font-serif text-[length:var(--text-title)] leading-[1.1]">
            {home.instructors.title}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted">
            {instructors.length === 0
              ? home.instructors.emptyNote
              : home.instructors.text}
          </p>
        </div>
        <InstructorStack
          instructors={instructors}
          watermark={home.instructors.watermark}
        />
      </Reveal>
    </section>
  );
}

export function FaqSection() {
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <Kicker center>{home.faq.kicker}</Kicker>
            <h2 className="mt-4 font-serif text-[length:var(--text-title)] leading-[1.1]">
              {home.faq.title}
            </h2>
          </div>
          <div className="mt-12">
            <Faq items={home.faq.items} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// Info panel on the left, still map on the right. The whole map opens Google Maps.
export function LocationSection() {
  const { street, barangay, city, province, postalCode } = site.address;
  const rows = hoursRows(hours);
  const { latitude, longitude } = site.geo;
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]">
          <div className="flex flex-col justify-between gap-12 rounded-panel bg-sand p-8 sm:p-12">
            <div>
              <Kicker>{home.location.kicker}</Kicker>
              <h2 className={`mt-4 ${h2}`}>{home.location.title}</h2>

              <address className="mt-8 not-italic">
                {street}, {barangay}
                <br />
                {city}, {province} {postalCode}
              </address>

              <div className="mt-8">
                <h3 className="text-sm font-medium uppercase tracking-[0.22em] text-muted">
                  {home.location.hoursTitle}
                </h3>
                {rows.length === 0 ? (
                  <p className="mt-3 text-muted">
                    {home.location.hoursEmptyNote}
                  </p>
                ) : (
                  <dl className="mt-3 space-y-2">
                    {rows.map((r) => (
                      <div
                        key={r.label}
                        className="flex items-baseline justify-between gap-6"
                      >
                        <dt>{r.label}</dt>
                        <dd className="text-muted">{r.text}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <LinkButton
                href={bookHref}
                variant="dark"
                className="text-sm"
              >
                {home.visit.cta}
              </LinkButton>
              <a
                href={googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-base underline-offset-4 hover:underline"
              >
                {home.location.mapsCta}
                <ArrowUpRight aria-hidden="true" size={16} />
              </a>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-panel">
            <StudioMap
              latitude={latitude}
              longitude={longitude}
              label={home.location.mapTitle}
              pinLabel={site.name}
              className="h-[22rem] w-full sm:h-[30rem] lg:h-full lg:min-h-[36rem]"
            />
            {/* The bottom strip stays free for the OpenStreetMap credit. */}
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={home.location.mapsCta}
              className="absolute inset-x-0 top-0 bottom-8 z-[5] cursor-pointer"
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
