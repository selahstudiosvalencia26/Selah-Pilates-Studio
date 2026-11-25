"use client";

import { useLinkStatus } from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { LoadingPage } from "@/kit/Skeleton";

// Instant feedback when a menu link is pressed. Next.js keeps the old page on screen until the next one is ready, so a slow
// page looked like the click did nothing. This closes that gap: the moment a link is pending, the page area shows the loading
// placeholder (a short pause first, so a fast page never flashes it).
//
// Three parts that share one small bit of state:
//   <NavPendingProvider>   wraps the whole frame (menu AND page area), so both can reach the same state.
//   <PendingReporter />    goes inside each <Link> of the menu, the tabs and the account link, and says "I am waiting".
//   <NavPendingScope>      wraps the page content and draws the placeholder over it while anything is waiting.
// With the framework's own loading.tsx (which takes over once the new page has started to arrive) there is never a stretch
// with no sign of life.
type Pending = {
  pending: boolean;
  report: (id: string, pending: boolean) => void;
};
const Context = createContext<Pending>({ pending: false, report: () => {} });

export function NavPendingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const waiting = useRef(new Set<string>());
  const [pending, setPending] = useState(false);
  const report = useCallback((id: string, isPending: boolean) => {
    if (isPending) waiting.current.add(id);
    else waiting.current.delete(id);
    setPending(waiting.current.size > 0);
  }, []);
  const value = useMemo(() => ({ pending, report }), [pending, report]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

// Wraps the page content. Draws the placeholder over the old page while any link is pending.
export function NavPendingScope({ children }: { children: React.ReactNode }) {
  const { pending } = useContext(Context);
  return (
    <div className="relative" aria-busy={pending || undefined}>
      {children}
      {pending && (
        <div className="pending-cover absolute inset-0 z-[1] bg-background">
          <LoadingPage />
        </div>
      )}
    </div>
  );
}

// Goes inside a <Link>. Tells the frame that this link is waiting for its page.
export function PendingReporter() {
  const { pending } = useLinkStatus();
  const { report } = useContext(Context);
  const id = useId();
  useEffect(() => {
    report(id, pending);
    return () => report(id, false);
  }, [pending, report, id]);
  return null;
}
