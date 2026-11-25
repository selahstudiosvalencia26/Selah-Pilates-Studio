import Link from "next/link";
import Icon from "@/kit/Icon";
import { BUILDER_CONTACT_URL } from "@/shell/builder";
import { buttonClass } from "@/kit/Button";

// What to do about systems. For the builder it is a button to the Systems page. For an owner, who never installs anything,
// it is a highlighted line with a "Message me" link: when the dashboard is empty it asks them to get set up, and when it
// already has systems it offers another one or a change. One place, so every screen says it the same way.
export default function AddSystemHint({ installHref, empty = true }: { installHref?: string; empty?: boolean }) {
  if (installHref) {
    return (
      <Link href={installHref} className={buttonClass("primary")}>
        {empty ? "Add what you need" : "Add or update a system"}
      </Link>
    );
  }
  return (
    <p className="inline-flex items-start gap-2.5 rounded-lg bg-selected px-4 py-3 text-sm font-medium text-text">
      <Icon name="mail" weight="medium" className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" />
      <span>
        {empty ? "Your dashboard is empty. " : "Want another system, or a change to one? "}
        <a href={BUILDER_CONTACT_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent">
          Message me
        </a>
        {empty ? " to set it up." : "."}
      </span>
    </p>
  );
}
