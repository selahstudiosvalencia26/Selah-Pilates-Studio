"use client";

import { useEffect, useRef } from "react";

// A scrollbar drawn on top of the page, so it never takes width from the layout.
// It is always visible (with a faint track), easy to grab, and the thumb can be dragged.
export function ScrollIndicator() {
  const rail = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const railEl = rail.current;
    const thumbEl = thumb.current;
    if (!railEl || !thumbEl) return;

    let frame = 0;
    let dragging = false;
    let startY = 0;
    let startScroll = 0;
    let thumbHeight = 0;

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) {
        railEl.style.display = "none";
        return;
      }
      railEl.style.display = "block";
      thumbHeight = Math.max(
        64,
        (window.innerHeight / doc.scrollHeight) * window.innerHeight,
      );
      const top = (window.scrollY / max) * (window.innerHeight - thumbHeight);
      thumbEl.style.height = `${thumbHeight}px`;
      thumbEl.style.transform = `translateY(${top}px)`;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      startY = event.clientY;
      startScroll = window.scrollY;
      thumbEl.setPointerCapture(event.pointerId);
      railEl.dataset.dragging = "true";
      event.preventDefault();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const room = window.innerHeight - thumbHeight;
      if (room <= 0) return;
      window.scrollTo(0, startScroll + ((event.clientY - startY) / room) * max);
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      delete railEl.dataset.dragging;
      if (thumbEl.hasPointerCapture(event.pointerId))
        thumbEl.releasePointerCapture(event.pointerId);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    thumbEl.addEventListener("pointerdown", onPointerDown);
    thumbEl.addEventListener("pointermove", onPointerMove);
    thumbEl.addEventListener("pointerup", onPointerUp);
    thumbEl.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      thumbEl.removeEventListener("pointerdown", onPointerDown);
      thumbEl.removeEventListener("pointermove", onPointerMove);
      thumbEl.removeEventListener("pointerup", onPointerUp);
      thumbEl.removeEventListener("pointercancel", onPointerUp);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={rail}
      aria-hidden="true"
      className="group pointer-events-none fixed bottom-0 right-0 top-0 z-[60] hidden w-4 md:block"
    >
      {/* A hairline track and a slim thumb that thickens a little when you reach for it. The wide invisible edge makes it easy to grab. */}
      <div className="absolute inset-y-3 right-[7px] w-px rounded-full bg-ink/10" />
      <div
        ref={thumb}
        className="pointer-events-auto absolute right-1.5 w-[3px] cursor-grab rounded-full bg-ink/35 transition-[width,background-color,right] duration-200 ease-out before:absolute before:-inset-x-2 before:inset-y-0 before:content-[''] hover:right-[5px] hover:w-[5px] hover:bg-ink/70 group-data-[dragging=true]:right-[5px] group-data-[dragging=true]:w-[5px] group-data-[dragging=true]:cursor-grabbing group-data-[dragging=true]:bg-ink/80 motion-reduce:transition-none"
      />
    </div>
  );
}
