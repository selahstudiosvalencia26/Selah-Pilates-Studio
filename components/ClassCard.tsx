import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { PhotoSlot } from "@/components/PhotoSlot";
import { site } from "@/content/site";
import { bookClassHref } from "@/content/booking";
import type { Class } from "@/content/classes";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

// In the swipeable row, each card is about a third of the width.
const row = "w-[85%] shrink-0 snap-start sm:w-[calc((100%-3rem)/3)]";

// Class card. It turns dark on hover or keyboard focus.
export function ClassCard({
  item,
  grid = false,
}: {
  item: Class;
  grid?: boolean;
}) {
  const meta = [
    item.level,
    item.durationMinutes !== null ? `${item.durationMinutes} min` : null,
    item.focus,
  ].filter(Boolean);
  return (
    <li
      className={`group relative rounded-panel p-2 transition-colors duration-[var(--duration-fast)] hover:bg-ink hover:text-page focus-within:bg-ink focus-within:text-page motion-reduce:transition-none ${grid ? "" : row}`}
    >
      <PhotoSlot
        slot={`class-${item.slug}`}
        src={item.image}
        alt={item.image ? item.name : ""}
        hint={
          item.group === "Private reformer session"
            ? `A ${item.name} session on the reformer.`
            : `People on their mats in the ${item.name} class.`
        }
        className="aspect-[4/3] w-full"
      />
      <div className="px-2 pb-2 pt-4">
        {meta.length > 0 && (
          <p className="flex flex-wrap gap-x-4 text-sm text-muted group-hover:text-page/80 group-focus-within:text-page/80">
            {meta.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </p>
        )}
        <h3 className="mt-3 text-xl font-medium">{item.name}</h3>
        {item.summary && (
          <p className="mt-2 text-base text-muted group-hover:text-page/80 group-focus-within:text-page/80">
            {item.summary}
          </p>
        )}
        {item.pricePhp !== null && (
          <p className="mt-3 text-base font-medium">
            {peso.format(item.pricePhp)}
          </p>
        )}
        <BookLink name={item.name} />
      </div>
    </li>
  );
}

// Shown while the real class list is missing, so the layout is visible without inventing classes.
export function ClassCardPlaceholder({ grid = false }: { grid?: boolean }) {
  return (
    <li className={`rounded-panel p-2 ${grid ? "" : row}`}>
      <PhotoSlot src={null} alt="" className="aspect-[4/3] w-full" />
      <div className="px-2 pb-2 pt-4">
        <p className="text-sm text-muted">Level and length to come</p>
        <h3 className="mt-3 text-xl font-medium text-muted">Class to come</h3>
      </div>
    </li>
  );
}

// "Book" link on a class card: the outside booking link if there is one, otherwise our own Book page (or Contact when that is off).
function BookLink({ name }: { name: string }) {
  // The link stretches over the whole card, so the whole card is clickable.
  const cls =
    "mt-5 inline-flex min-h-11 items-center gap-1.5 text-base font-medium underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline";
  if (site.bookingUrl) {
    return (
      <a
        href={site.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Book ${name} (opens our booking page in a new tab)`}
        className={cls}
      >
        Book
        <ArrowUpRight aria-hidden="true" size={14} />
      </a>
    );
  }
  return (
    <Link href={bookClassHref(name)} aria-label={`Book ${name}`} className={cls}>
      Book
      <ArrowUpRight aria-hidden="true" size={14} />
    </Link>
  );
}
