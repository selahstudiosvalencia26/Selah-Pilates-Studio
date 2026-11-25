import Link from "next/link";
import { PostCard } from "@/components/BlogCards";
import { NextClasses } from "@/components/NextClasses";
import { Reveal } from "@/components/Reveal";
import { h2, Kicker, wrap } from "@/components/sections";
import { bookHref } from "@/content/booking";
import { PLACEHOLDERS } from "@/content/placeholders";
import { posts } from "@/content/blog";
import { home } from "@/content/home";
import { reviews } from "@/content/reviews";

// This week: only when the website takes bookings itself.
export function ThisWeekSection() {
  if (bookHref !== "/book") return null;
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] lg:gap-20">
          <div>
            <Kicker>This week</Kicker>
            <h2 className={`mt-4 ${h2}`}>{home.week.title}</h2>
            <p className="mt-4 max-w-sm text-muted">{home.week.text}</p>
            <Link
              href="/class"
              className="mt-4 inline-flex min-h-11 items-center text-base underline underline-offset-4"
            >
              See the full schedule
            </Link>
          </div>
          <NextClasses />
        </div>
      </Reveal>
    </section>
  );
}

export function FirstVisitSection() {
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <Kicker>New here?</Kicker>
        <h2 className={`mt-4 ${h2}`}>{home.first.title}</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {home.first.steps.map((step, i) => (
            <li key={step.title} className="rounded-3xl bg-sand p-7">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-ink text-page">
                {i + 1}
              </span>
              <h3 className="mt-5 text-xl font-medium">{step.title}</h3>
              <p className="mt-2 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}

// What clients say. With no reviews yet, the live site shows nothing at all; while building, empty marked frames hold the place.
export function ReviewsSection() {
  const list = reviews();
  if (list.length === 0 && !PLACEHOLDERS) return null;
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <div className="text-center">
          <Kicker center>Reviews</Kicker>
          <h2 className={`mt-4 ${h2}`}>{home.reviewsTitle}</h2>
        </div>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {list.length > 0
            ? list.map((r) => (
                <li
                  key={r.slug}
                  className="flex flex-col rounded-3xl bg-sand p-7"
                >
                  <blockquote className="break-words text-lg leading-relaxed">
                    {r.review}
                  </blockquote>
                  <p className="mt-auto pt-5 text-base text-muted">{r.name}</p>
                </li>
              ))
            : [1, 2, 3].map((n) => (
                <li
                  key={n}
                  className="rounded-3xl border border-dashed border-line p-7 text-muted"
                >
                  <p>
                    Placeholder: a real review from a client goes here, with
                    their permission.
                  </p>
                  <p className="mt-4 text-base">Client name</p>
                </li>
              ))}
        </ul>
      </Reveal>
    </section>
  );
}

// The three newest blog posts. Hidden while there are none, so the home page never shows an empty frame to a visitor.
export function BlogSection() {
  const latest = posts().slice(0, 3);
  if (latest.length === 0) return null;
  return (
    <section className="bg-page pb-24 sm:pb-32">
      <Reveal className={wrap}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Kicker>Blog</Kicker>
            <h2 className={`mt-4 ${h2}`}>{home.blogTitle}</h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center text-base underline underline-offset-4"
          >
            See all posts
          </Link>
        </div>
        <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((post, i) => (
            <li key={post.slug}>
              <PostCard post={post} shade={i % 2 ? "bg-stone" : "bg-sand"} />
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
