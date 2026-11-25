// A person's picture in a circle: their photo if they added one, otherwise the first letter of their name. The one place every
// avatar is drawn (menu, phone menu, Account, People), so they all look the same and update together. The name is always next
// to it in words, so the picture is decoration and screen readers skip it. A server component, nothing to run in the browser.
export default function Avatar({
  name,
  src = null,
  className = "h-8 w-8 text-[13px]",
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-selected font-semibold text-text ${className}`}
    >
      {src ? (
        // A small picture made by us (see src/shell/account/avatar.ts), so a plain <img> is right: nothing to optimise.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={256}
          height={256}
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        (name.trim()[0] ?? "?").toUpperCase()
      )}
    </span>
  );
}
