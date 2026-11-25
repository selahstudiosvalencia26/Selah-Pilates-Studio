import { Phone } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { PastHero } from "@/components/PastHero";
import { bookHref } from "@/content/booking";
import { classes } from "@/content/classes";
import { home } from "@/content/home";
import { site } from "@/content/site";

// On the home page, booking stays one click away once the opening has been scrolled past: a slim white bar (bottom right on a computer) with the starting price and a Book button. If there is a
// phone number, calling sits beside it. Other pages have their own booking buttons.
export function MobileBookBar() {
  // Worked out from the class list, so it is never out of date.
  const prices = classes.flatMap((c) => c.pricePhp ?? []);
  const from = prices.length
    ? `From \u20b1${Math.min(...prices).toLocaleString("en-PH")} a class`
    : "Pilates in Valencia City";
  return (
    <PastHero>
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 md:w-auto md:min-w-80 md:gap-6 rounded-full border border-line bg-page/95 py-2 pl-5 pr-2 shadow-[0_10px_30px_rgb(27_42_53/0.14)] backdrop-blur-xl">
        <p className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-base font-medium">
            {home.visit.cta}
          </span>
          <span className="block truncate text-sm text-muted">{from}</span>
        </p>
        {site.phone && (
          <a
            href={`tel:${site.phone}`}
            aria-label="Call us"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line"
          >
            <Phone aria-hidden="true" size={20} />
          </a>
        )}
        <Link
          href={bookHref}
          aria-label={home.visit.cta}
          className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-ink px-6 text-base text-page transition-transform duration-150 active:scale-95 motion-reduce:transition-none"
        >
          Book
        </Link>
      </div>
    </PastHero>
  );
}
