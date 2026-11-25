import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/Button";
import { PhotoSlot } from "@/components/PhotoSlot";
import { wrap } from "@/components/sections";
import { bookHref } from "@/content/booking";
import { home } from "@/content/home";
import { pages } from "@/content/pages";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

const rise =
  "transition-[opacity,translate] duration-500 ease-[var(--ease-out)] starting:translate-y-3 starting:opacity-0 motion-reduce:transition-none";

// A line under each way on, so a visitor knows what is behind it.
const HINTS: Record<string, string> = {
  "/about": "The studio and the team",
  "/class": "Classes, times and booking",
  "/blog": "News and notes",
  "/contact": "Ask us anything",
};

// A wrong or old address: say so plainly, in the studio's own voice, and offer the ways on.
export default function NotFound() {
  return (
    <section className="bg-page pb-24 pt-32 sm:pb-32 sm:pt-40">
      <div className={wrap}>
        <div
          className={`grid overflow-hidden rounded-panel bg-sand lg:grid-cols-2 ${rise}`}
        >
          <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-16">
            <p className="text-sm uppercase tracking-[0.22em] text-muted">
              Error 404
            </p>
            <h1 className="mt-5 text-balance font-serif text-4xl italic leading-[1.05] sm:text-6xl">
              Take a pause. This page is not here.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">
              The address may be old or mistyped.
            </p>
            <div className="mt-8 grid gap-3 sm:flex">
              <LinkButton href="/" variant="dark">
                Go to the home page
              </LinkButton>
              <LinkButton href={bookHref} variant="light">
                Book a session
              </LinkButton>
            </div>
          </div>
          {/* The studio's own opening photo, so a wrong turn still feels like Selah. */}
          <div className="relative min-h-64 lg:min-h-[32rem]">
            <PhotoSlot
              slot="home-hero"
              src={home.heroImage.src}
              alt=""
              className="absolute inset-0 !rounded-none"
            />
          </div>
        </div>

        <nav aria-label="Other pages" className={`mt-4 ${rise} delay-100`}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pages
              .filter((p) => p.href !== "/")
              .map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className="group flex h-full items-center justify-between gap-4 rounded-3xl border border-line p-6 transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
                  >
                    <span>
                      <span className="block font-serif text-2xl">
                        {p.label}
                      </span>
                      <span className="mt-1 block text-base opacity-75">
                        {HINTS[p.href]}
                      </span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      size={20}
                      className="shrink-0 transition-transform duration-200 group-hover:rotate-45 motion-reduce:transition-none"
                    />
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
