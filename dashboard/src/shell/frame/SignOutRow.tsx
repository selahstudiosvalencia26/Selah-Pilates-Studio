import Icon from "@/kit/Icon";
import { signOut } from "@/shell/signin/actions";

// The sign out button, one row in the side menu and in the phone menu. A real form, so it works with the keyboard and
// even before the page has finished loading. In the folded side menu only the icon shows.
export default function SignOutRow({ className, collapsed = false }: { className: string; collapsed?: boolean }) {
  return (
    <form action={signOut}>
      <button type="submit" title={collapsed ? "Sign out" : undefined} aria-label="Sign out" className={className}>
        <Icon name="sign-out" weight="medium" className="h-5 w-5 shrink-0" />
        <span aria-hidden={collapsed} className={`truncate whitespace-nowrap transition-opacity duration-150 ${collapsed ? "opacity-0" : "opacity-100"}`}>
          Sign out
        </span>
      </button>
    </form>
  );
}
