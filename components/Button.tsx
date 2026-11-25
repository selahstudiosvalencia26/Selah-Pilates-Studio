import Link from "next/link";
import type { ComponentProps } from "react";

const base =
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-base font-normal transition-[transform,opacity,background-color] duration-[var(--duration-fast)] ease-[var(--ease-out)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:opacity-60";
const styles = {
  primary: "bg-accent text-accent-ink hover:opacity-90",
  quiet: "border border-line text-ink hover:bg-page",
  light: "bg-page text-ink hover:opacity-90",
  dark: "bg-ink text-page hover:opacity-90",
  outline: "border border-ink/30 text-ink hover:bg-page/60",
};

type Variant = keyof typeof styles;

export function LinkButton({
  variant = "primary",
  className = "",
  href,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  const classes = `${base} ${styles[variant]} ${className}`;
  // Full web addresses open in a new tab. Pages of this site use the normal link.
  if (typeof href === "string" && /^https?:\/\//.test(href)) {
    const { children } = props;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title="Opens in a new tab"
        className={classes}
      >
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return <Link href={href} className={classes} {...props} />;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`${base} ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
