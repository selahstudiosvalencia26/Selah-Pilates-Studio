import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ClassPortal } from "@/components/ClassPortal";
import { PhotoSlot } from "@/components/PhotoSlot";
import { wrap } from "@/components/sections";
import { askHref, bookHref } from "@/content/booking";
import { classes } from "@/content/classes";
import { inner } from "@/content/inner";
import { pages } from "@/content/pages";
import { site } from "@/content/site";
import { pageMeta } from "@/lib/seo";
import { messengerUrl } from "@/lib/social";

const page = pages[2];

export const metadata = pageMeta(page.title, page.description, page.href);

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export default function ClassPage() {
  const c = inner.class;
  const list = classes.map((item) => ({
    slug: item.slug,
    name: item.name,
    group:
      item.group === "Group mat class" ? "Group classes" : "Private sessions",
    summary: item.summary,
    meta: [
      item.durationMinutes !== null ? `${item.durationMinutes} min` : null,
      item.pricePhp !== null ? peso.format(item.pricePhp) : null,
    ]
      .filter(Boolean)
      .join(" \u00b7 "),
    photo: (
      <PhotoSlot
        slot={`class-${item.slug}`}
        src={item.image}
        alt=""
        className="absolute inset-0"
      />
    ),
  }));
  // Group classes first, then private sessions, whatever order the list is saved in.
  list.sort(
    (a, b) =>
      Number(a.group !== "Group classes") - Number(b.group !== "Group classes"),
  );
  return (
    <section className="bg-page pb-20 pt-36 sm:pb-32 sm:pt-44">
      <div className={wrap}>
        <h1 className="sr-only">{c.title}</h1>
        <ClassPortal
          classes={list}
          firstTitle={c.firstClass.title}
          firstItems={c.firstClass.items}
          online={bookHref === "/book"}
          bookingElsewhere={askHref}
          messenger={site.facebook ? messengerUrl(site.facebook) : null}
        />
        <div className="mt-20 grid gap-4 rounded-panel bg-sand p-6 sm:mt-24 sm:p-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
          <h2 className="text-balance font-serif text-4xl italic leading-tight sm:text-5xl">
            {c.title}
          </h2>
          <div>
            <p className="text-muted">
              {classes.length === 0 ? c.emptyNote : c.text}
            </p>
            <Link
              href="/contact"
              className="mt-2 inline-flex min-h-11 items-center gap-2 text-base underline underline-offset-4"
            >
              Send us a message
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
