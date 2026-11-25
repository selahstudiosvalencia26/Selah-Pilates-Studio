import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Cover, link, PostCard } from "@/components/BlogCards";
import { Reveal } from "@/components/Reveal";
import { PageHero, wrap } from "@/components/sections";
import { postDate, posts } from "@/content/blog";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMeta(
  "Blog",
  "News and notes from Selah Pilates Studio.",
  "/blog",
);

export default function BlogPage() {
  const [latest, ...older] = posts();
  return (
    <>
      <PageHero
        kicker="Blog"
        title="From the studio"
        text="News and notes from Selah."
      />
      <section className="bg-page pb-24 sm:pb-32">
        <Reveal className={wrap}>
          {!latest ? (
            <p className="text-center text-muted">
              No posts yet. Please check back soon.
            </p>
          ) : (
            <>
              {/* The newest post, large */}
              <Link
                href={`/blog/${latest.slug}`}
                className={`${link} grid overflow-hidden rounded-panel bg-sand lg:grid-cols-2`}
              >
                <Cover
                  post={latest}
                  shade="bg-stone"
                  className="aspect-[4/3] lg:aspect-auto lg:min-h-[24rem]"
                />
                <div className="flex flex-col justify-center p-6 sm:p-12">
                  <p className="text-base text-muted">
                    Latest · {postDate(latest.date)}
                  </p>
                  <h2 className="mt-3 text-balance break-words font-serif text-3xl leading-tight sm:text-5xl">
                    {latest.title}
                  </h2>
                  {latest.summary && (
                    <p className="mt-4 max-w-xl text-lg text-muted">
                      {latest.summary}
                    </p>
                  )}
                  <span className="mt-8 inline-flex min-h-11 items-center gap-3 self-start rounded-full bg-ink pl-5 pr-1.5 text-base text-page">
                    Read the post
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-page text-ink transition-transform duration-200 group-hover:rotate-45 motion-reduce:transition-none">
                      <ArrowUpRight aria-hidden="true" size={16} />
                    </span>
                  </span>
                </div>
              </Link>

              {older.length > 0 && (
                <>
                  <h2 className="mb-6 mt-20 font-serif text-3xl">
                    More from the studio
                  </h2>
                  <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                    {older.map((p, i) => (
                      <li key={p.slug}>
                        <PostCard
                          post={p}
                          shade={i % 2 ? "bg-stone" : "bg-sand"}
                        />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </Reveal>
      </section>
    </>
  );
}
