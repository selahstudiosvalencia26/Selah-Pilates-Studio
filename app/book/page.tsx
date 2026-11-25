import { OnlineBooking } from "@/components/OnlineBooking";
import { PageHero, wrap } from "@/components/sections";
import { pageMeta } from "@/lib/seo";
import { site } from "@/content/site";
import { messengerUrl } from "@/lib/social";

export const metadata = pageMeta(
  "Book a class",
  "Pick a day and time and book your pilates class online.",
  "/book",
);

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const { class: picked } = await searchParams;
  return (
    <>
      <PageHero
        kicker="Book"
        title="Book your class"
        text="Pick a day and a time, then tell us who is coming."
      />
      <section className="bg-page pb-24 sm:pb-32">
        <div className={wrap}>
          <OnlineBooking
            picked={picked ?? ""}
            messenger={site.facebook ? messengerUrl(site.facebook) : null}
          />
        </div>
      </section>
    </>
  );
}
