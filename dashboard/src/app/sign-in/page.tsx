import type { Metadata } from "next";
import { getBranding } from "@/shell/branding/server";
import BrandMark from "@/shell/frame/BrandMark";
import { devSkipAllowed } from "@/shell/signin/devSkip";
import SignInForm from "@/shell/signin/SignInForm";

export const metadata: Metadata = { title: "Sign in" };

// The sign-in screen. The same rounded panel on the frame colour as the dashboard, with the business at the top left and one
// plain form in the middle. The business has a default logo (its first letter) until the owner adds their own.
export default async function SignInPage() {
  const brand = await getBranding();
  return (
    <div className="min-h-dvh bg-sidebar p-2">
      <main className="relative flex min-h-[calc(100dvh-1rem)] flex-col rounded-2xl border border-border bg-background px-4 py-6 sm:px-8">
        <header className="flex items-center gap-2.5">
          <BrandMark name={brand.name} logoUrl={brand.logoUrl} size="sm" />
          <p className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.01em]">{brand.name}</p>
        </header>

        <div className="grid flex-1 place-items-center py-10">
          <div className="grid w-full max-w-[22rem] gap-8">
            <h1 className="text-center text-2xl font-semibold tracking-[-0.015em]">Sign in</h1>
            <SignInForm devSkip={devSkipAllowed()} />
            <p className="text-center text-[13px] leading-relaxed text-text-soft">
              Only people who were invited can sign in.
              <br />
              No invite yet? Ask the owner of {brand.name}.
            </p>
          </div>
        </div>

        <p className="text-center text-[13px] text-text-soft">© {new Date().getFullYear()} {brand.name}</p>
      </main>
    </div>
  );
}
