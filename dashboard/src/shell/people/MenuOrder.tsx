"use client";

import { useLayoutEffect, useRef, useState, useTransition } from "react";
import Icon from "@/kit/Icon";
import { moveId } from "@/shell/menu";
import { saveMenuOrder } from "@/shell/menuOrderActions";
import AddSystemHint from "@/shell/systems/AddSystemHint";

// "Menu order": the owner drags the systems into the order they like. Grab the dots and drag (a mouse or a finger), or
// focus the dots and use the up and down arrow keys. The rows glide to their new place. Today stays first and the
// owner's own pages stay at the bottom. One grouped list, so it reads as the menu itself, not as a pile of boxes.
// With nothing added yet, it points to where systems are added (`installHref`, for the builder) or says to ask.
type Row = { title: string; icon: string };

export default function MenuOrder({ items, top = [], bottom = [], installHref }: { items: { id: string; title: string; icon: string }[]; top?: Row[]; bottom?: Row[]; installHref?: string }) {
  const [order, setOrder] = useState(items.map((i) => i.id));
  const [drag, setDrag] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const byId = new Map(items.map((i) => [i.id, i]));
  const list = useRef<HTMLUListElement>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const tops = useRef(new Map<string, number>());
  const latest = useRef(order);

  // Glide: after the order changes, move each row from where it was to where it is now.
  useLayoutEffect(() => {
    latest.current = order;
    const base = list.current?.getBoundingClientRect().top ?? 0;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (const id of order) {
      const el = rows.current.get(id);
      if (!el) continue;
      const now = el.getBoundingClientRect().top - base;
      const before = tops.current.get(id);
      if (!calm && before !== undefined && Math.abs(before - now) > 1) el.animate([{ transform: `translateY(${before - now}px)` }, { transform: "none" }], { duration: 200, easing: "cubic-bezier(0.2,0,0,1)" });
      tops.current.set(id, now);
    }
  }, [order]);

  const save = () => {
    setSaved(false);
    start(async () => setSaved((await saveMenuOrder(latest.current)).ok));
  };

  // While dragging: the row goes to the place whose neighbours the pointer has passed.
  const over = (id: string, y: number) => {
    const others = latest.current.filter((x) => x !== id);
    const at = others.filter((x) => {
      const r = rows.current.get(x)?.getBoundingClientRect();
      return r ? y > r.top + r.height / 2 : false;
    }).length;
    const next = [...others.slice(0, at), id, ...others.slice(at)];
    if (next.join() !== latest.current.join()) setOrder(next);
  };

  return (
    <section aria-label="Menu order" className="grid gap-3">
      <div className="divide-y divide-border overflow-hidden card">
        <FixedRows rows={top} note="Always first" />
        {order.length === 0 ? (
          <div className="grid gap-3 px-4 py-4">
            <p className="text-sm text-text-soft">Your tools go here once they are added.</p>
            <div>
              <AddSystemHint installHref={installHref} />
            </div>
          </div>
        ) : (
          <ul ref={list} className="divide-y divide-border">
            {order.map((id) => {
              const item = byId.get(id);
              if (!item) return null;
              const held = drag === id;
              return (
                <li
                  key={id}
                  ref={(el) => {
                    if (el) rows.current.set(id, el);
                    else rows.current.delete(id);
                  }}
                  className={`flex h-12 items-center gap-3 pl-4 pr-1 transition-colors duration-150 ${held ? "bg-hover" : "bg-card"}`}
                >
                  <Icon name={item.icon} weight="medium" className="h-5 w-5 shrink-0 text-text-soft" />
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                  <button
                    type="button"
                    aria-label={`Move ${item.title}. Drag, or use the up and down arrow keys.`}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setDrag(id);
                    }}
                    onPointerMove={(e) => held && over(id, e.clientY)}
                    onPointerUp={() => {
                      setDrag(null);
                      save();
                    }}
                    onPointerCancel={() => setDrag(null)}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
                      e.preventDefault();
                      const next = moveId(order, id, e.key === "ArrowUp" ? -1 : 1);
                      if (next === order) return;
                      setOrder(next);
                      latest.current = next;
                      save();
                    }}
                    className="grid h-11 w-11 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-text-soft transition-colors hover:bg-hover hover:text-text focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing"
                  >
                    <span aria-hidden className="grid grid-cols-2 gap-[3px]">
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className="h-[3px] w-[3px] rounded-full bg-current" />
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <FixedRows rows={bottom} note="Always at the bottom" />
      </div>
      <p role="status" className="h-5 text-[13px] text-text-soft">
        {pending ? "Saving..." : saved ? "Saved" : ""}
      </p>
    </section>
  );
}

// A place in the menu that never moves: Today at the top, the owner's own pages at the bottom. Quieter than the rows
// that can be moved, so the eye goes to the ones you can change.
function FixedRows({ rows, note }: { rows: Row[]; note: string }) {
  if (rows.length === 0) return null;
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li key={r.title} className="flex h-12 items-center gap-3 bg-surface/60 px-4">
          <Icon name={r.icon} weight="medium" className="h-5 w-5 shrink-0 text-text-soft" />
          <span className="flex-1 text-sm text-text-soft">{r.title}</span>
          <span className="text-[13px] text-text-soft">{note}</span>
        </li>
      ))}
    </ul>
  );
}
