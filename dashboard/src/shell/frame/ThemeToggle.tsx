"use client";

import { useEffect, useState } from "react";
import Icon from "@/kit/Icon";

// Light or dark, one tap. The choice is kept in a cookie so the server can draw the right colours from the first paint.
// Until a choice is made the dashboard follows the device. The change crossfades the whole page, so it is smooth and
// needs no help from any system: they all use the colour tokens (src/app/globals.css).
type Theme = "light" | "dark";

function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const set = document.documentElement.dataset.theme;
    setTheme(set === "light" || set === "dark" ? set : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  const flip = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const apply = () => {
      document.documentElement.dataset.theme = next;
    };
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
    const smooth = typeof document.startViewTransition === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (smooth) document.startViewTransition(apply);
    else apply();
    setTheme(next);
  };

  const label = theme === "dark" ? "Switch to light mode" : theme === "light" ? "Switch to dark mode" : "Switch between light and dark mode";
  return { theme, flip, label };
}

// The small icon button, for the phone's top line.
export default function ThemeToggle() {
  const { theme, flip, label } = useTheme();
  return (
    <button
      type="button"
      onClick={flip}
      aria-label={label}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-text-soft transition-[color,background-color,transform] duration-150 hover:bg-hover hover:text-text focus-visible:outline-2 focus-visible:outline-accent active:scale-95"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} />
    </button>
  );
}

// The same switch as a row in the side menu: the icon stays put whether the menu is open or folded.
export function ThemeRow({ className, collapsed }: { className: string; collapsed: boolean }) {
  const { theme, flip, label } = useTheme();
  const words = theme === "dark" ? "Light mode" : "Dark mode";
  return (
    <button type="button" onClick={flip} aria-label={label} title={collapsed ? words : undefined} className={className}>
      <Icon name={theme === "dark" ? "sun" : "moon"} weight="medium" className="h-5 w-5 shrink-0" />
      <span aria-hidden={collapsed} className={`truncate whitespace-nowrap transition-opacity duration-150 ${collapsed ? "opacity-0" : "opacity-100"}`}>
        {words}
      </span>
    </button>
  );
}
