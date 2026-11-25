import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "@/components/Button";
import { PhotoSlot } from "@/components/PhotoSlot";
import { Reveal } from "@/components/Reveal";
import { ScrollText } from "@/components/ScrollText";
import { StudioMap } from "@/components/StudioMap";
import { headerGrid, h2, Kicker, wrap } from "@/components/sections";
import { classes } from "@/content/classes";
import { hours } from "@/content/hours";
import { instructors } from "@/content/instructors";
import { inner } from "@/content/inner";
import { site } from "@/content/site";
import {
  BIO_PLACEHOLDER,
  STORY_PLACEHOLDER,
  written,
} from "@/content/placeholders";
import { bookHref } from "@/content/booking";
import { hoursRows } from "@/lib/hours";

const num = (i: number) => String(i + 1).padStart(2, "0");

// ---------- About page ----------

// Three photo frames: one big, two small. Each says what photo to add.
export function AboutMosaic() {
  const [big, small1, small2] = inner.about.photoHints;
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-[2fr_1fr]">
          <PhotoSlot
            slot="about-main"
            src={null}
            alt=""
            hint={big}
            className="aspect-[4/3] w-full md:row-span-2 md:aspect-auto md:min-h-[26rem]"
          />
          <PhotoSlot
            slot="about-side-1"
            src={null}
            alt=""
            hint={small1}
            className="aspect-[4/3] w-full"
          />
          <PhotoSlot
            slot="about-side-2"
            src={null}
            alt=""
            hint={small2}
            className="aspect-[4/3] w-full"
          />
        </div>
      </Reveal>
    </section>
  );
}

// Six numbered ideas, in a grid of big numerals.
export function PrinciplesSection() {
  const p = inner.about.principles;
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <Kicker>{p.kicker}</Kicker>
        <div className={headerGrid}>
          <h2 className={h2}>{p.title}</h2>
          <p className="text-muted md:justify-self-end">{p.text}</p>
        </div>
        <ol className="mt-14 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {p.items.map((item, i) => (
            <li key={item.title}>
              <span className="text-base text-muted">{num(i)}</span>
              <h3 className="mt-3 text-lg font-medium">{item.title}</h3>
              <p className="mt-2 text-muted">{item.text}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}

// The meaning of the name, as one large sentence that lights up while scrolling.
export function NameSection() {
  const n = inner.about.name;
  const cut = n.text.indexOf(". ") + 1;
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        {/* Same look as the About statement on the home page: label, one big sentence, centered. */}
        <div className="mx-auto max-w-4xl text-center">
          <Kicker center>{n.kicker}</Kicker>
          <ScrollText
            lead={n.text.slice(0, cut)}
            rest={n.text.slice(cut).trim()}
            className="mt-8 text-2xl leading-snug sm:text-3xl"
          />
          <p className="mt-6 text-base text-muted">
            {written(n.note, STORY_PLACEHOLDER)}
          </p>
        </div>
      </Reveal>
    </section>
  );
}

// ---------- Class page ----------

export function ExplainedSection() {
  const e = inner.class.explained;
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <Kicker>{e.kicker}</Kicker>
        <div className={headerGrid}>
          <h2 className={h2}>{e.title}</h2>
          <p className="text-muted md:justify-self-end">{e.text}</p>
        </div>
        <ul className="mt-12 grid gap-4 sm:gap-6 md:grid-cols-3">
          {e.items.map((item) => (
            <li key={item.title} className="rounded-panel bg-sand p-8 sm:p-10">
              <h3 className="text-lg font-medium">{item.title}</h3>
              <p className="mt-2 text-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

// ---------- Contact page ----------

// A wide map with the details laid out below it in three columns.
export function FindUsSection() {
  const f = inner.contact.find;
  const { street, barangay, city, province, postalCode } = site.address;
  const { latitude, longitude } = site.geo;
  const rows = hoursRows(hours);
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const label = "text-sm font-medium uppercase tracking-[0.22em] text-muted";
  const link =
    "inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline";

  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <Kicker>{f.kicker}</Kicker>
        <h2 className={`mt-4 ${h2}`}>{f.title}</h2>

        <div className="relative mt-10 overflow-hidden rounded-panel">
          <StudioMap
            latitude={latitude}
            longitude={longitude}
            label="Map showing Selah Pilates Studio"
            pinLabel={site.name}
            className="h-[22rem] w-full sm:h-[30rem]"
          />
          <a
            href={googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={f.googleMaps}
            className="absolute inset-x-0 top-0 bottom-8 z-[5]"
          />
        </div>

        <dl className="mt-10 grid gap-10 sm:grid-cols-3">
          <div>
            <dt className={label}>{f.addressTitle}</dt>
            <dd className="mt-3">
              <address className="not-italic">
                {street}, {barangay}
                <br />
                {city}, {province} {postalCode}
              </address>
            </dd>
          </div>
          <div>
            <dt className={label}>{f.hoursTitle}</dt>
            <dd className="mt-3">
              {rows.length === 0 ? (
                <span className="text-muted">{f.hoursEmptyNote}</span>
              ) : (
                <ul className="space-y-1">
                  {rows.map((r) => (
                    <li key={r.label} className="flex justify-between gap-6">
                      <span>{r.label}</span>
                      <span className="text-muted">{r.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
          <div>
            <dt className={label}>{f.directionsTitle}</dt>
            <dd className="mt-3 flex flex-col items-start">
              <a
                href={googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className={link}
              >
                {f.googleMaps}
                <ArrowUpRight aria-hidden="true" size={16} />
              </a>
            </dd>
          </div>
        </dl>
      </Reveal>
    </section>
  );
}

// ---------- About page: what we offer, and the team ----------

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function OfferSection() {
  const o = inner.about.offer;
  const panels = [
    { key: "Group mat class", title: o.groupTitle, text: o.groupText },
    {
      key: "Private reformer session",
      title: o.privateTitle,
      text: o.privateText,
    },
  ] as const;
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <Kicker>{o.kicker}</Kicker>
        <div className={headerGrid}>
          <h2 className={h2}>{o.title}</h2>
          <p className="text-muted md:justify-self-end">{o.text}</p>
        </div>
        <div className="mt-12 grid gap-4 sm:gap-6 md:grid-cols-2">
          {panels.map((p) => (
            <div key={p.key} className="rounded-panel bg-sand p-8 sm:p-12">
              <h3 className="text-lg font-medium">{p.title}</h3>
              <p className="mt-2 text-muted">{p.text}</p>
              <ul className="mt-8 space-y-3">
                {classes
                  .filter((c) => c.group === p.key)
                  .map((c) => (
                    <li
                      key={c.slug}
                      className="flex items-baseline justify-between gap-6"
                    >
                      <span>{c.name}</span>
                      <span className="text-muted">
                        {c.pricePhp !== null ? peso.format(c.pricePhp) : ""}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
        <LinkButton href="/class" variant="quiet" className="mt-6">
          {o.cta}
        </LinkButton>
      </Reveal>
    </section>
  );
}

export function TeamSection() {
  const t = inner.about.team;
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-16">
          <PhotoSlot
            slot={`team-${instructors[0]?.slug}`}
            src={instructors[0]?.image ?? null}
            alt={instructors[0]?.name ?? ""}
            hint={t.photoHint}
            className="aspect-[4/5] w-full"
          />
          <div>
            <Kicker>{t.kicker}</Kicker>
            <h2 className={`mt-4 ${h2}`}>
              {instructors.map((i) => i.name).join(", ")}
            </h2>
            <p className="mt-4 text-muted">
              {written(t.note, BIO_PLACEHOLDER)}
            </p>
            <LinkButton href={bookHref} variant="dark" className="mt-8">
              Book a session
            </LinkButton>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ---------- Class page: classes as an easy list ----------
