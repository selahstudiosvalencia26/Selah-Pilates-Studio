import {
  ArrowUpRight,
  FacebookLogo,
  InstagramLogo,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { BackToTop } from "@/components/BackToTop";
import { Reveal } from "@/components/Reveal";
import { bookHref } from "@/content/booking";
import { home } from "@/content/home";
import { hours } from "@/content/hours";
import { pages } from "@/content/pages";
import { site } from "@/content/site";
import { hoursRows } from "@/lib/hours";

const heading = "text-xs font-medium uppercase tracking-[0.22em] text-page/60";
const soft =
  "transition-all duration-300 ease-[var(--ease-out)] motion-reduce:transition-none";
const small = `inline-flex min-h-10 items-center gap-2 text-base text-page/85 underline-offset-4 hover:text-page hover:underline ${soft}`;

// Full width on purpose (an exception to the page max width). The words inside still follow it.
// Compact: an invitation to book, then what you need to know in three short columns, then one thin line.
export function Footer() {
  const external = Boolean(site.bookingUrl);
  const rows = hoursRows(hours);
  const map = `https://www.google.com/maps/search/?api=1&query=${site.geo.latitude},${site.geo.longitude}`;
  const a = site.address;
  const social = [
    { label: "Facebook", href: site.facebook, Icon: FacebookLogo },
    { label: "Instagram", href: site.instagram, Icon: InstagramLogo },
  ];

  return (
    <footer className="bg-page px-3 pb-3 pt-3 sm:px-5 sm:pt-5 md:pb-5">
      <div className="on-dark rounded-panel bg-ink px-6 pt-8 text-page sm:px-12 sm:pt-10">
        <div className="mx-auto max-w-page">
          <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
            <p className="text-balance font-serif text-[clamp(1.75rem,3vw,2.5rem)] italic leading-tight">
              {site.tagline}
            </p>
            <Link
              href={bookHref}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={`group inline-flex shrink-0 items-center gap-3 self-start rounded-full bg-page py-1.5 pl-5 pr-1.5 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-page sm:self-auto ${soft}`}
            >
              {home.visit.cta}
              <span
                className={`inline-flex size-9 items-center justify-center rounded-full bg-ink text-page group-hover:rotate-45 ${soft}`}
              >
                <ArrowUpRight aria-hidden="true" size={16} />
              </span>
            </Link>
          </Reveal>

          <div className="mt-7 grid gap-7 border-t border-page/15 pt-6 md:grid-cols-3 md:gap-10">
            <nav aria-label="Footer pages">
              <h2 className={heading}>Explore</h2>
              <ul className="mt-2 flex flex-wrap gap-x-5 md:grid md:grid-cols-2">
                {pages.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} className={small}>
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h2 className={heading}>Visit</h2>
              <address className="mt-3 text-base not-italic leading-relaxed text-page/90">
                {a.street}, {a.barangay}
                <br />
                {a.city}, {a.province} {a.postalCode}
              </address>
              <a
                href={map}
                target="_blank"
                rel="noopener noreferrer"
                className={small}
              >
                Open in Google Maps
                <ArrowUpRight aria-hidden="true" size={16} />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>

            <div>
              <h2 className={heading}>Open</h2>
              <dl className="mt-3 max-w-xs">
                {rows.map((r) => (
                  <div
                    key={r.label}
                    className="flex justify-between gap-6 text-base leading-relaxed"
                  >
                    <dt className="text-page/70">{r.label}</dt>
                    <dd>{r.text}</dd>
                  </div>
                ))}
              </dl>
              <ul className="mt-3 flex flex-wrap gap-2">
                {social.map(
                  ({ label, href, Icon }) =>
                    href && (
                      <li key={label}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-page/25 px-4 text-sm hover:bg-page hover:text-ink ${soft}`}
                        >
                          <Icon aria-hidden="true" size={18} />
                          {label}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      </li>
                    ),
                )}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-page/15 py-2 text-sm text-page/75">
            <p>
              © {site.name} {new Date().getFullYear()}
            </p>
            <Link href="/privacy" className={small}>
              Privacy and booking rules
            </Link>
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}
