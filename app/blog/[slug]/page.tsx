import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/BlogCards";
import { JsonLd } from "@/components/JsonLd";
import { PhotoSlot } from "@/components/PhotoSlot";
import { wrap } from "@/components/sections";
import { postBySlug, postDate, posts } from "@/content/blog";
import { savedPhoto } from "@/content/photos";
import { site } from "@/content/site";
import { pageMeta, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const post = postBySlug((await params).slug);
  if (!post) return {};
  const meta = pageMeta(
    post.title,
    post.summary || post.title,
    `/blog/${post.slug}`,
  );
  return {
    ...meta,
    openGraph: { ...meta.openGraph, type: "article", publishedTime: post.date },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = postBySlug((await params).slug);
  if (!post) notFound();
  // Plain text only: each block between empty lines is a paragraph.
  const paragraphs = post.body.split(/\n\s*\n/).filter((p) => p.trim() !== "");
  const more = posts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);
  return (
    <div className="bg-page pb-24 pt-32 sm:pb-32 sm:pt-44">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          ...(post.summary ? { description: post.summary } : {}),
          datePublished: post.date,
          mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
          author: { "@type": "Organization", name: site.name },
          publisher: { "@type": "Organization", name: site.name },
        }}
      />
      <article className="px-gutter">
        {/* The title and photo are wider than the words: the words keep a width that is easy to read. */}
        <header className="mx-auto max-w-4xl text-center">
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center gap-2 text-base underline underline-offset-4"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            All posts
          </Link>
          <p className="mt-6 text-base text-muted">{postDate(post.date)}</p>
          <h1 className="mt-3 text-balance break-words font-serif text-4xl leading-tight sm:text-6xl">
            {post.title}
          </h1>
        </header>
        {savedPhoto(`list-blog-${post.slug}`) && (
          <div className="mx-auto mt-10 max-w-4xl">
            <PhotoSlot
              slot={`list-blog-${post.slug}`}
              src={null}
              alt=""
              priority
              className="aspect-[16/9] w-full"
            />
          </div>
        )}
        <div className="mx-auto mt-10 grid max-w-2xl gap-6 break-words text-lg leading-relaxed sm:text-xl sm:leading-relaxed">
          {paragraphs.map((text, i) => (
            <p key={i} className="whitespace-pre-line">
              {text}
            </p>
          ))}
        </div>
      </article>

      {more.length > 0 && (
        <section aria-label="More posts" className="mt-24">
          <div className={wrap}>
            <h2 className="mb-6 border-t border-line pt-10 font-serif text-3xl">
              More posts
            </h2>
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p, i) => (
                <li key={p.slug}>
                  <PostCard post={p} shade={i % 2 ? "bg-stone" : "bg-sand"} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
