import Link from "next/link";
import { CountUp } from "@/components/CountUp";
import { LinkButton } from "@/components/Button";
import { JsonLd } from "@/components/JsonLd";
import { PhotoSlot } from "@/components/PhotoSlot";
import { Reveal } from "@/components/Reveal";
import { ScrollText } from "@/components/ScrollText";
import {
  BenefitsSection,
  ClassesSection,
  FaqSection,
  InstructorsSection,
  Kicker,
  LocationSection,
  wrap,
} from "@/components/sections";
import { classes } from "@/content/classes";
import { home } from "@/content/home";
import {
  BlogSection,
  FirstVisitSection,
  ReviewsSection,
  ThisWeekSection,
} from "@/components/home-extras";
import { STORY_PLACEHOLDER, written } from "@/content/placeholders";
import { pages } from "@/content/pages";
import { savedPhoto } from "@/content/photos";
import { bookHref } from "@/content/booking";
import { pageMeta } from "@/lib/seo";

const page = pages[0];

export const metadata = {
  ...pageMeta(page.title, page.description, page.href),
  title: {
    absolute: "Pilates in Valencia City, Bukidnon | Selah Pilates Studio",
  },
};

// The same questions and answers shown on the page, in the form answer engines read.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: home.faq.items.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function Home() {
  const [lead, ...rest] = home.about.text;
  // With a photo behind it, the words turn light and a soft shade keeps them readable.
  const heroPhoto = Boolean(savedPhoto("home-hero") ?? home.heroImage.src);
  // Short facts under the buttons on phones, worked out from the real class list so they are never out of date.
  const prices = classes.flatMap((c) => c.pricePhp ?? []);
  const lengths = [...new Set(classes.flatMap((c) => c.durationMinutes ?? []))];
  const facts = [
    prices.length ? `From ₱${Math.min(...prices).toLocaleString("en-PH")}` : "",
    lengths.length === 1 ? `${lengths[0]} minutes` : "",
    "Valencia City",
  ].filter(Boolean);

  return (
    <>
      {/* Hero: full width on purpose (an exception to the page max width), the nav floats on top */}
      <div className="p-3 sm:p-5">
        <section className="hero-intro relative flex h-[calc(100dvh-1.5rem)] min-h-[30rem] flex-col overflow-hidden rounded-panel bg-stone sm:h-[calc(100dvh-2.5rem)]">
          <PhotoSlot
            slot="home-hero"
            src={home.heroImage.src}
            alt={home.heroImage.alt}
            hint={home.heroImage.hint}
            hintSide="right"
            priority
            className="hero-photo absolute inset-0 !rounded-none"
          />
          {heroPhoto && (
            <div
              aria-hidden="true"
              data-hero-photo
              className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(27_42_53/0.55)_0%,rgb(27_42_53/0.05)_28%,rgb(27_42_53/0.2)_48%,rgb(27_42_53/0.92)_100%)] sm:bg-[linear-gradient(to_bottom,rgb(27_42_53/0.5),rgb(27_42_53/0.3),rgb(27_42_53/0.6))]"
            />
          )}
          <div
            className={`${wrap} relative z-10 flex flex-1 flex-col justify-end pb-6 pt-28 max-sm:px-6 sm:justify-start sm:pb-10 sm:pt-44`}
          >
            <Reveal now className="sm:text-center">
              <h1
                className={`intro-rise intro-d1 mx-auto max-w-5xl text-balance font-serif text-[clamp(3.25rem,15vw,4.5rem)] italic leading-[1.02] sm:text-[length:var(--text-hero)] sm:leading-[1.05] ${heroPhoto ? "text-page" : ""}`}
              >
                {home.hero.title}
              </h1>
              <p
                className={`intro-rise intro-d2 mt-4 max-w-md text-lg sm:mx-auto sm:mt-5 sm:text-balance ${heroPhoto ? "text-page/90" : "text-muted"}`}
              >
                {home.hero.text}
              </p>
              <div className="intro-rise intro-d3 mt-6 grid grid-cols-[1.5fr_1fr] gap-2 [&>a]:whitespace-nowrap [&>a]:max-sm:px-3 sm:mt-8 sm:flex sm:justify-center">
                <LinkButton
                  href={bookHref}
                  variant={heroPhoto ? "light" : "dark"}
                  className="text-base sm:text-sm"
                >
                  {home.hero.cta}
                </LinkButton>
                {/* A second way in, on phones: look before booking. */}
                <Link
                  href="/class"
                  className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-base backdrop-blur-md sm:hidden ${heroPhoto ? "border-page/50 text-page" : "border-ink/30"}`}
                >
                  {home.secondCta}
                </Link>
              </div>
              {facts.length > 0 && (
                <ul
                  className={`intro-rise intro-d4 mt-6 flex justify-between gap-3 border-t pt-4 text-sm sm:hidden ${heroPhoto ? "border-page/25 text-page/90" : "border-ink/20"}`}
                >
                  {facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              )}
            </Reveal>
          </div>

          {/* Bottom-left of the card, at the same inset as the photo note on the right */}
          <Reveal
            now
            className="intro-rise intro-d4 absolute bottom-0 left-0 z-10 hidden p-8 sm:block sm:p-10"
          >
            <div className={`w-72 ${heroPhoto ? "text-page" : ""}`}>
              <p
                className={`text-base ${heroPhoto ? "text-page/85" : "text-muted"}`}
              >
                {home.hero.pointsTitle}
              </p>
              <ol className="mt-4">
                {home.hero.points.map((point, i) => (
                  <li
                    key={point}
                    className={`flex items-baseline border-b py-3 text-base first:border-t ${heroPhoto ? "border-page/30" : "border-ink/20"}`}
                  >
                    <span
                      className={`w-10 shrink-0 tabular-nums ${heroPhoto ? "text-page/80" : "text-muted"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {point}
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </section>
      </div>

      {/* About: one big sentence */}
      <section className="bg-page py-24 sm:py-32">
        <Reveal className={wrap}>
          <div className="mx-auto max-w-4xl text-center">
            <Kicker center>{home.about.kicker}</Kicker>
            <h2 className="sr-only">{home.about.title}</h2>
            <ScrollText
              lead={lead}
              rest={rest.join(" ")}
              className="mt-8 text-2xl leading-snug sm:text-3xl"
            />
            <p className="mt-6 text-base text-muted">
              {written(home.about.storyNote, STORY_PLACEHOLDER)}
            </p>
            {/* Numbers row: placeholders until real numbers are added in content/home.ts (about.stats) */}
            <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
              {(home.about.stats.length > 0
                ? home.about.stats
                : [0, 1, 2, 3].map(() => ({
                    value: "—",
                    label: home.about.statsEmptyLabel,
                  }))
              ).map((stat, i) => (
                <div
                  key={`${stat.label}-${i}`}
                  className="flex flex-col-reverse justify-end"
                >
                  <dt className="mx-auto mt-3 max-w-[10rem] text-base text-muted">
                    {stat.label}
                  </dt>
                  <dd className="font-serif text-4xl sm:text-5xl">
                    <CountUp value={stat.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </section>
      <ClassesSection />
      <ThisWeekSection />
      <BenefitsSection />
      <FirstVisitSection />
      <InstructorsSection />
      <ReviewsSection />
      <BlogSection />
      <FaqSection />
      <JsonLd data={faqJsonLd} />
      <LocationSection />
    </>
  );
}
