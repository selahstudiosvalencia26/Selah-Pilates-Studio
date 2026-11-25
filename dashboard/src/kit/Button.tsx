// THE button. Every button and every link that looks like one uses this, in the shell and in every system, so they all share one shape,
// one set of states and one size (docs/rules/frontend-rules.md, "Form controls"). Rounded, 44 px tall (a thumb), and one main action per screen.
//
//   primary    the one main action of a screen ("Add booking"). Filled with the accent colour.
//   secondary  the other actions ("Cancel", "Revoke"). White with a soft edge.
//   quiet      a small helpful action beside the main one ("Reset"). Soft grey fill.
//   danger     something that cannot be undone, as an outline in the danger colour.
//
// Two ways to use it, the same look either way:
//   <Button variant="primary" onClick={save}>Save</Button>            a real button
//   <Link href="/booking/new" className={buttonClass("primary")}>Add booking</Link>   a link that looks like one
export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium transition-[background-color,opacity,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100";

const look: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-contrast hover:opacity-90",
  secondary: "border border-border-strong bg-card text-text hover:bg-hover disabled:hover:bg-card",
  quiet: "bg-surface text-text hover:bg-selected",
  danger: "border border-danger bg-card text-danger hover:bg-hover",
};

export const buttonClass = (variant: ButtonVariant = "secondary", { block = false }: { block?: boolean } = {}): string => `${base} ${look[variant]}${block ? " w-full" : ""}`;

export default function Button({
  variant = "secondary",
  block = false,
  type = "button",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; block?: boolean }) {
  return <button type={type} className={`${buttonClass(variant, { block })} ${className}`} {...rest} />;
}
