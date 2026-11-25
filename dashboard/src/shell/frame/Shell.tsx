import type { MenuItem } from "@/shell/menu";
import MobileMenu from "./MobileMenu";
import BrandMark from "./BrandMark";
import { NavPendingProvider, NavPendingScope } from "./NavPending";
import ScrollLine from "./ScrollLine";
import Sidebar from "./Sidebar";

// The frame around every signed-in page: the side menu on a computer, a top line with a menu button on a phone.
// It only draws what it is given. Who the person is and what they may see is decided on the server, before this.
export default function Shell({
  business,
  logoUrl = null,
  person,
  items,
  children,
}: {
  business: string;
  logoUrl?: string | null;
  person: { name: string; role: string; avatarUrl?: string | null };
  items: MenuItem[];
  children: React.ReactNode;
}) {
  return (
    <NavPendingProvider>
      <div className="flex h-dvh overflow-hidden bg-sidebar">
        <Sidebar
          business={business}
          logoUrl={logoUrl}
          person={person}
          items={items}
        />
        {/* The frame is locked to the screen on every device. Only the content scrolls, in the one column below, so its
          scrollbar sits at the edge of the window. The rounded edge is drawn over the content (the sticky layer), so the
          panel looks fixed while the content moves under it. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-4 lg:hidden">
            <div className="flex min-w-0 items-center gap-2.5">
              <BrandMark name={business} logoUrl={logoUrl} size="sm" />
              <p className="min-w-0 truncate text-base font-semibold">
                {business}
              </p>
            </div>
            <MobileMenu items={items} person={person} />
          </header>
          <div className="frame-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain [container-type:size]">
            <ScrollLine />
            <div className="flex min-h-full flex-col">
              <div
                aria-hidden
                className="pointer-events-none sticky top-0 z-10 -mb-[100cqh] h-[100cqh] overflow-hidden"
              >
                <div className="absolute inset-x-2 bottom-2 top-0 rounded-2xl border border-border shadow-[0_0_0_100vmax_var(--sidebar)] lg:inset-2 lg:ml-0" />
              </div>
              <div className="mx-2 mb-2 flex flex-1 flex-col bg-background lg:m-2 lg:ml-0">
                <main className="w-full flex-1 p-4 sm:p-6 lg:p-10">
                  <NavPendingScope>{children}</NavPendingScope>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NavPendingProvider>
  );
}
