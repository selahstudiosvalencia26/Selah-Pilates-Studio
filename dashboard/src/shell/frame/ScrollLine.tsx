"use client";

import { useEffect, useRef } from "react";
import { scrollFromDrag, thumbOf } from "./scrollLineMath";

// The page's scroll line. The browser's scrollbar is hidden on the page column (globals.css), so nothing takes room at the edge
// of the window. This thin line floats over the right edge of the panel instead and does the useful parts of a scrollbar:
//   - it shows how long the page is and where you are on it,
//   - it appears while you scroll or when the pointer is over the page, and fades out a moment later,
//   - the thumb can be dragged.
// It is decoration for the eyes, so screen readers skip it: the page itself still scrolls with the keyboard, the wheel, a
// trackpad or a touch screen. It goes inside the scrolling column (`.frame-scroll`) and reads that column. Colours are the
// dashboard's own variables; the fade uses opacity only and is off for people who asked for less motion.
const IDLE_MS = 1100;

export default function ScrollLine() {
  const rail = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const railEl = rail.current;
    const thumbEl = thumb.current;
    const scroller = railEl?.closest<HTMLElement>(".frame-scroll");
    if (!railEl || !thumbEl || !scroller) return;

    let hideTimer = 0;
    let frame = 0;
    let dragging = false;
    let startY = 0;
    let startScroll = 0;
    let scrollable = false;
    let current = { height: 0, offset: 0 };

    const show = () => {
      if (!scrollable) return;
      railEl.dataset.on = "true";
      window.clearTimeout(hideTimer);
      if (!dragging)
        hideTimer = window.setTimeout(() => delete railEl.dataset.on, IDLE_MS);
    };

    const draw = () => {
      frame = 0;
      const track = railEl.clientHeight;
      const t = thumbOf(
        scroller.scrollTop,
        scroller.scrollHeight,
        scroller.clientHeight,
        track,
      );
      scrollable = t.scrollable;
      current = t;
      railEl.hidden = !t.scrollable;
      if (!t.scrollable) return;
      thumbEl.style.height = `${t.height}px`;
      thumbEl.style.transform = `translateY(${t.offset}px)`;
    };
    const redraw = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onScroll = () => {
      redraw();
      show();
    };

    const down = (event: PointerEvent) => {
      dragging = true;
      startY = event.clientY;
      startScroll = scroller.scrollTop;
      thumbEl.setPointerCapture(event.pointerId);
      railEl.dataset.drag = "true";
      show();
      event.preventDefault();
    };
    const move = (event: PointerEvent) => {
      if (!dragging) return;
      scroller.scrollTop = scrollFromDrag(
        startScroll,
        event.clientY - startY,
        scroller.scrollHeight,
        scroller.clientHeight,
        railEl.clientHeight,
        current.height,
      );
    };
    const up = (event: PointerEvent) => {
      dragging = false;
      delete railEl.dataset.drag;
      if (thumbEl.hasPointerCapture(event.pointerId))
        thumbEl.releasePointerCapture(event.pointerId);
      show();
    };

    draw();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("pointerenter", show);
    scroller.addEventListener("pointermove", show, { passive: true });
    thumbEl.addEventListener("pointerdown", down);
    thumbEl.addEventListener("pointermove", move);
    thumbEl.addEventListener("pointerup", up);
    thumbEl.addEventListener("pointercancel", up);
    // The page changes size as content arrives, and the window can be resized.
    const watcher = new ResizeObserver(redraw);
    watcher.observe(scroller);
    if (scroller.firstElementChild) watcher.observe(scroller.firstElementChild);

    return () => {
      window.clearTimeout(hideTimer);
      if (frame) cancelAnimationFrame(frame);
      watcher.disconnect();
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("pointerenter", show);
      scroller.removeEventListener("pointermove", show);
      thumbEl.removeEventListener("pointerdown", down);
      thumbEl.removeEventListener("pointermove", move);
      thumbEl.removeEventListener("pointerup", up);
      thumbEl.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div
      ref={rail}
      aria-hidden
      hidden
      className="group pointer-events-none fixed bottom-4 right-1 top-4 z-20 w-3 opacity-0 transition-opacity duration-200 motion-reduce:transition-none data-[drag=true]:opacity-100 data-[on=true]:opacity-100"
    >
      <div
        ref={thumb}
        className="pointer-events-none absolute right-0.5 w-1.5 cursor-grab rounded-full bg-border-strong transition-[width,background-color] duration-150 group-data-[drag=true]:cursor-grabbing group-data-[drag=true]:bg-text-soft group-data-[on=true]:pointer-events-auto hover:w-2 hover:bg-text-soft group-data-[drag=true]:w-2 motion-reduce:transition-none"
      />
    </div>
  );
}
