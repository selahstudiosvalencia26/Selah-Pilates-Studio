import Image from "next/image";

// The client's logo, or the default logo until they add one: their first letter on a solid tile in the text colour (so it
// reads in light and dark, and never competes with the accent, which is kept for actions and the current page). Fixed size,
// so nothing jumps.
const SIZES = {
  sm: { box: "h-8 w-8 rounded-lg text-sm", px: 32 },
  md: { box: "h-9 w-9 rounded-[10px] text-[15px]", px: 36 },
  lg: { box: "h-14 w-14 rounded-xl text-xl", px: 56 },
} as const;

export default function BrandMark({ name, logoUrl, size = "md" }: { name: string; logoUrl: string | null; size?: keyof typeof SIZES }) {
  const { box, px } = SIZES[size];
  if (logoUrl) {
    return <Image src={logoUrl} alt="" width={px} height={px} unoptimized className={`${box} shrink-0 object-cover`} />;
  }
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center bg-text font-semibold text-background ${box}`}>
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}
