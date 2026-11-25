import Image from "next/image";
import { savedPhoto } from "@/content/photos";

type Props = {
  /** The name of this place in the dashboard. A photo saved there replaces `src`. */
  slot?: string;
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  /** What photo to put here, shown on the empty frame until the real photo is added. */
  hint?: string;
  /** Which side the hint sits on. */
  hintSide?: "left" | "right";
};

// Shows the client's photo when there is one. Until then, a quiet empty frame that says what to add.
export function PhotoSlot({
  slot,
  src: fallback,
  alt: fallbackAlt,
  className = "",
  priority = false,
  hint,
  hintSide = "left",
}: Props) {
  const saved = slot ? savedPhoto(slot) : null;
  const src = saved?.src ?? fallback;
  const alt = saved?.alt ?? fallbackAlt;
  const position = saved?.position;
  // A frame that is placed over its parent (absolute, like the hero) must not also be `relative`, or it collapses to no height.
  const positioned = /(^| )(absolute|fixed|sticky)( |$)/.test(className);
  if (src) {
    return (
      <div
        className={`${positioned ? "" : "relative"} overflow-hidden rounded-panel bg-stone ${className}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="object-cover"
          style={position ? { objectPosition: position } : undefined}
        />
      </div>
    );
  }
  return (
    <div
      className={`flex items-end rounded-panel bg-stone p-8 sm:p-10 ${hintSide === "right" ? "justify-end text-right" : ""} ${className}`}
      role="img"
      aria-label={hint ? `Photo to add: ${hint}` : "Photo to come"}
    >
      <span className="max-w-xs text-sm leading-relaxed text-muted">
        <span className="block font-medium text-ink/70">
          {hint ? "Photo to add" : "Photo to come"}
        </span>
        {hint}
      </span>
    </div>
  );
}
