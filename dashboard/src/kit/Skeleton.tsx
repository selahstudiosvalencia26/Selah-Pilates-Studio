// The built-in loading state (docs/rules/frontend-rules.md, "Loading"). While a page is still fetching its data, the dashboard
// shows a placeholder shaped like the finished page, so nothing is blank and nothing jumps when the real content arrives.
// The shell shows this by itself for every page (src/app/(shell)/loading.tsx), so a system gets it for free. A page whose
// shape is different adds its own `loading.tsx` next to it and picks a shape.
//
// It waits a moment (150 ms) before showing at all, so a fast page never flashes a placeholder. People who prefer less
// motion get a still placeholder. Screen readers hear "Loading" once.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-selected motion-reduce:animate-none ${className}`} />;
}

export type LoadingShape = "list" | "form" | "cards";

export function LoadingPage({ shape = "list", label = "Loading" }: { shape?: LoadingShape; label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="skeleton-wrap grid gap-8">
      <span className="sr-only">{label}…</span>

      <div className="grid gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>

      {shape === "list" && (
        <div className="grid gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[74px] rounded-lg" />
          ))}
        </div>
      )}

      {shape === "form" && (
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
          <div className="grid gap-7">
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid gap-2.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-11 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="hidden h-64 rounded-xl lg:block" />
        </div>
      )}

      {shape === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      )}
    </div>
  );
}
