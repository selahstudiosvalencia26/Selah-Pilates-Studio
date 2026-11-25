import Link from "next/link";
import { PhotoSlot } from "@/components/PhotoSlot";
import { postDate, type Post } from "@/content/blog";
import { savedPhoto } from "@/content/photos";
import { site } from "@/content/site";

const zoom =
  "transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100";
export const link =
  "group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

// The picture of a post. A post without a photo gets a calm cover with the studio's name, so the page never looks unfinished.
export function Cover({
  post,
  shade,
  className,
}: {
  post: Post;
  shade: string;
  className: string;
}) {
  const slot = `list-blog-${post.slug}`;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {savedPhoto(slot) ? (
        <PhotoSlot
          slot={`list-blog-${post.slug}`}
          src={null}
          alt=""
          className={`absolute inset-0 !rounded-none ${zoom}`}
        />
      ) : (
        <div
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center font-serif text-5xl italic text-ink/25 ${shade} ${zoom}`}
        >
          {site.name.split(" ")[0]}
        </div>
      )}
    </div>
  );
}

// One post in a row of cards.
export function PostCard({ post, shade }: { post: Post; shade: string }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`${link} block rounded-panel`}>
      <Cover
        post={post}
        shade={shade}
        className="aspect-[16/10] rounded-panel"
      />
      <p className="mt-4 text-base text-muted">{postDate(post.date)}</p>
      <h3 className="mt-1 text-balance break-words font-serif text-2xl underline-offset-4 group-hover:underline">
        {post.title}
      </h3>
      {post.summary && <p className="mt-2 text-muted">{post.summary}</p>}
    </Link>
  );
}
