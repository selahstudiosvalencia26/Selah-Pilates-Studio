"use client";

import { CaretRight, FacebookLogo, InstagramLogo } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { askHref, bookHref } from "@/content/booking";
import { pages } from "@/content/pages";
import { LinkButton } from "@/components/Button";
import { NavLinks } from "@/components/NavLinks";

// A compact floating bar, centered and always fixed at the top.
export function Navigation() {
  const pathname = usePathname();
  // Already on the classes: the button asks for a booking rather than reloading the same page.
  const book = pathname.startsWith("/class") ? askHref : bookHref;
  const [open, setOpen] = useState(false);
  // Only the first load of the home page plays the intro. Later page changes show the bar at once.
  const [intro] = useState(pathname === "/");

  // On a phone, at the top of the home page, the header is see-through so the photo fills the screen. It turns into the white bar
  // as soon as the page is scrolled. Only when there really is a photo behind it, or the white words would not be readable.
  const [overPhoto, setOverPhoto] = useState(false);
  useEffect(() => {
    const check = () =>
      setOverPhoto(
        window.scrollY < 24 &&
          Boolean(document.querySelector("[data-hero-photo]")),
      );
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [pathname]);
  const clear = overPhoto && !open;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const wide = window.matchMedia("(min-width: 1024px)");
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", close);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", close);
    };
  }, [open]);

  const rise = `transition-[opacity,translate] duration-250 ease-[var(--ease-out)] motion-reduce:transition-none ${open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-5 z-50 flex flex-col items-center px-gutter max-sm:px-6 sm:top-9 ${intro ? "intro-nav" : ""}`}
      >
        <div
          className={`flex w-full items-center justify-between gap-3 rounded-full py-1.5 pl-5 pr-1.5 transition-[background-color,box-shadow,color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:pl-7 lg:grid lg:max-w-6xl lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:py-2 lg:pl-8 lg:pr-2 ${clear ? "bg-page/0 text-page shadow-[0_8px_30px_rgb(27_42_53/0),0_0_0_1px_rgb(188_211_226/0)]" : "bg-page text-ink shadow-[0_10px_34px_rgb(27_42_53/0.12),0_0_0_1px_var(--color-line)]"}`}
        >
          <Link
            href="/"
            onClick={() => setOpen(false)}
            aria-label={site.name}
            className="inline-flex min-h-11 flex-col justify-center whitespace-nowrap font-serif uppercase leading-none lg:justify-self-start"
          >
            <span className="text-xl tracking-[0.12em] lg:text-2xl">
              {site.name.split(" ")[0]}
            </span>
            <span className="mt-1 font-sans text-[0.65rem] tracking-[0.28em] opacity-75">
              {site.name.split(" ").slice(1).join(" ")}
            </span>
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <NavLinks light={clear} />
          </nav>

          <div className="hidden lg:block lg:justify-self-end">
            <LinkButton
              href={book}
              variant={clear ? "light" : "dark"}
              className="min-h-11 px-6 text-base"
            >
              Book a session
            </LinkButton>
          </div>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex h-11 items-center gap-3 rounded-full border pl-5 pr-4 text-base transition-[transform,background-color,color,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 lg:hidden ${clear ? "border-transparent bg-sand text-ink max-sm:border-page/40 max-sm:bg-page/15 max-sm:text-page" : "border-transparent bg-sand text-ink"}`}
          >
            {/* The two words sit on top of each other and slide past, so the button never changes width. */}
            <span className="relative grid overflow-hidden text-left">
              <span
                aria-hidden={open}
                className={`col-start-1 row-start-1 transition-[translate,opacity] duration-300 motion-reduce:transition-none ${open ? "-translate-y-full opacity-0" : ""}`}
              >
                Menu
              </span>
              <span
                aria-hidden={!open}
                className={`col-start-1 row-start-1 transition-[translate,opacity] duration-300 motion-reduce:transition-none ${open ? "" : "translate-y-full opacity-0"}`}
              >
                Close
              </span>
            </span>
            <span aria-hidden="true" className="relative block h-3 w-5">
              <span
                className={`absolute left-0 h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none ${open ? "top-[5px] rotate-45" : "top-[1px]"}`}
              />
              <span
                className={`absolute left-0 h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none ${open ? "top-[5px] -rotate-45" : "top-[9px]"}`}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Always on the page so it can fade out too. While closed it is invisible and cannot be reached by keyboard. */}
      <div
        id="mobile-menu"
        inert={!open}
        className={`fixed inset-0 z-40 flex flex-col overflow-y-auto bg-page px-gutter pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-28 transition-[clip-path,visibility] duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none lg:hidden ${open ? "visible [clip-path:circle(160%_at_85%_5%)]" : "invisible [clip-path:circle(0%_at_85%_5%)]"}`}
      >
        <nav aria-label="Mobile">
          <ul className="grid gap-2">
            {pages.map((p, i) => {
              const current =
                p.href === "/" ? pathname === "/" : pathname.startsWith(p.href);
              return (
                <li
                  key={p.href}
                  style={{ transitionDelay: open ? `${60 + i * 40}ms` : "0ms" }}
                  className={rise}
                >
                  <Link
                    href={p.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-13 items-center justify-between gap-4 rounded-2xl px-5 text-xl transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none ${current ? "bg-sand" : ""}`}
                  >
                    {p.label}
                    {current ? (
                      <span className="text-base font-normal text-muted">
                        You are here
                      </span>
                    ) : (
                      <CaretRight aria-hidden="true" size={22} />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          style={{
            transitionDelay: open ? `${60 + pages.length * 40}ms` : "0ms",
          }}
          className={`mt-auto grid gap-3 pt-8 ${rise}`}
        >
          <LinkButton
            href={book}
            variant="dark"
            className=" w-full"
            onClick={() => setOpen(false)}
          >
            Book a session
          </LinkButton>
          {(site.facebook || site.instagram) && (
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  href: site.facebook,
                  label: "Facebook",
                  Icon: FacebookLogo,
                },
                {
                  href: site.instagram,
                  label: "Instagram",
                  Icon: InstagramLogo,
                },
              ].map(
                ({ href, label, Icon }) =>
                  href && (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-line text-base"
                    >
                      <Icon aria-hidden="true" size={22} />
                      {label}
                    </a>
                  ),
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
