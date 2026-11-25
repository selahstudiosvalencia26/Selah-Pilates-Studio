"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { savePhotos } from "./actions";
import Collapse from "./Collapse";
import { preparePhoto } from "./photoClient";
import { PHOTO_LIMITS, type Photos } from "./photoRules";
import { Remove } from "./Remove";
import { useUndo } from "./Undo";
import { useSavePart } from "./SaveGroup";
import { slotById, type Slot } from "./site/slots";
import { btn, field, hintCls, labelCls } from "./ui";

type Edit = {
  alt?: string;
  blob?: Blob;
  url?: string;
  remove?: boolean;
  x?: number;
  y?: number;
};

const round = (n: number) =>
  Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;

// The photos of one page, like the Dan Cafe dashboard: one calm row for each place on the website that holds a photo (a small
// picture, its name, where it shows, and Add or Edit). A row opens to add or replace the picture, choose which part stays in view
// when the page crops it, see how it will look, and describe it. Until a photo is added the website keeps showing its "Photo to
// add" frame. Changes join the screen's one Save, so the words and the photos are saved together.
export default function PhotoRows({
  ids = [],
  places,
  saved,
  group,
}: {
  ids?: string[];
  /** Photo places that are not in the fixed list (a class's card), given directly. */
  places?: Slot[];
  saved: Photos;
  group: string;
}) {
  const router = useRouter();
  const slots =
    places ?? ids.map((id) => slotById(id)).filter((x): x is Slot => !!x);
  const [base, setBase] = useState(saved);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [bad, setBad] = useState<string | null>(null);
  const pick = useRef<HTMLInputElement>(null);
  const undo = useUndo();

  // After a save the server sends the new list down; take it in.
  const [seen, setSeen] = useState(saved);
  if (saved !== seen) {
    setSeen(saved);
    setBase(saved);
  }

  const edit = (id: string, part: Partial<Edit>) =>
    setEdits((all) => ({ ...all, [id]: { ...all[id], ...part } }));
  const altOf = (s: Slot) => edits[s.id]?.alt ?? base[s.id]?.alt ?? s.alt;
  const spotOf = (id: string) => ({
    x: edits[id]?.x ?? base[id]?.x ?? 50,
    y: edits[id]?.y ?? base[id]?.y ?? 50,
  });
  const srcOf = (id: string): string | null => {
    const e = edits[id];
    if (e?.remove) return null;
    if (e?.url) return e.url;
    const b = base[id];
    return b ? `/api/content/photo/${b.file}` : null;
  };

  useSavePart(`photos-${group}`, Object.keys(edits).length > 0, async () => {
    const changes: {
      slot: string;
      alt: string;
      x?: number;
      y?: number;
      remove?: boolean;
      fileKey?: string;
    }[] = [];
    const form = new FormData();
    for (const [id, e] of Object.entries(edits)) {
      const slot = slots.find((s) => s.id === id)!;
      if (e.remove) {
        if (base[id]) changes.push({ slot: id, alt: "", remove: true });
        continue;
      }
      if (!e.blob && !base[id]) continue; // nothing to save for a place that never had a photo
      const alt = altOf(slot).trim();
      if (!alt) {
        setBad(id);
        setOpen(id);
        return `Describe the photo "${slot.label}". Screen readers and Google read the description.`;
      }
      const change: (typeof changes)[number] = { slot: id, alt, ...spotOf(id) };
      if (e.blob) {
        change.fileKey = `file-${changes.length}`;
        form.set(change.fileKey, e.blob, `${id}.webp`);
      }
      changes.push(change);
    }
    if (changes.length === 0) {
      setEdits({});
      return null;
    }
    form.set("changes", JSON.stringify(changes));
    const r = await savePhotos(form);
    if (!r.ok) return r.message;
    for (const e of Object.values(edits)) if (e.url) URL.revokeObjectURL(e.url);
    setEdits({});
    setBad(null);
    router.refresh();
    return null;
  });

  const choose = async (id: string, files: FileList | null) => {
    const file = files?.[0];
    if (pick.current) pick.current.value = "";
    if (!file) return;
    const r = await preparePhoto(file);
    if (!r.ok) return setNotes((n) => ({ ...n, [id]: r.message }));
    setNotes((n) => ({ ...n, [id]: "" }));
    const old = edits[id]?.url;
    if (old) URL.revokeObjectURL(old);
    edit(id, { blob: r.blob, url: r.url, remove: false });
  };

  // Where the pointer is on the picture, as a percentage across and down.
  const aim = (id: string, x: number, y: number) =>
    edit(id, { x: round(x), y: round(y) });
  const aimFrom = (id: string, e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    aim(
      id,
      ((e.clientX - r.left) / r.width) * 100,
      ((e.clientY - r.top) / r.height) * 100,
    );
  };

  return (
    <div role="group" aria-label="Photos" className="grid gap-3">
      <input
        ref={pick}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => open && void choose(open, e.target.files)}
      />
      <ul className="grid gap-3">
        {slots.map((s) => {
          const src = srcOf(s.id);
          const isOpen = open === s.id;
          const spot = spotOf(s.id);
          const changed = !!edits[s.id];
          return (
            <li key={s.id} className="rounded-xl border border-border">
              <div className="flex items-center gap-4 p-3">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a preview served by the dashboard, or a local file
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-14 w-[4.5rem] shrink-0 rounded-md bg-surface object-cover"
                    style={{ objectPosition: `${spot.x}% ${spot.y}%` }}
                  />
                ) : (
                  <span
                    aria-hidden
                    className="grid h-14 w-[4.5rem] shrink-0 place-items-center rounded-md border border-dashed border-border-strong bg-surface text-[11px] text-text-soft"
                  >
                    No photo
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-text-soft">{s.where}</p>
                </div>
                <span className="hidden text-xs text-text-soft sm:inline">
                  {changed ? "Changed" : src ? "Photo added" : "No photo yet"}
                </span>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpen(isOpen ? null : s.id);
                    setBad(null);
                  }}
                  className={btn}
                >
                  {isOpen ? "Done" : src ? "Edit" : "Add photo"}
                </button>
              </div>

              <Collapse open={isOpen}>
                <div className="grid gap-6 border-t border-border p-4">
                  {!src ? (
                    <div className="grid gap-3">
                      <p className="text-sm text-text-soft">Add: {s.hint}</p>
                      <div>
                        <button
                          type="button"
                          onClick={() => pick.current?.click()}
                          className={btn}
                        >
                          Choose a photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_11rem]">
                      <div className="grid content-start gap-3">
                        <p className={labelCls}>
                          Drag the point to the part of the photo that matters
                          most
                        </p>
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label={`Choose the part of the ${s.label.toLowerCase()} that stays in view. Drag the point, click, or use the arrow keys.`}
                          onPointerDown={(e) => {
                            e.currentTarget.setPointerCapture(e.pointerId);
                            setDragging(true);
                            aimFrom(s.id, e);
                          }}
                          onPointerMove={(e) => dragging && aimFrom(s.id, e)}
                          onPointerUp={(e) => {
                            setDragging(false);
                            if (e.currentTarget.hasPointerCapture(e.pointerId))
                              e.currentTarget.releasePointerCapture(
                                e.pointerId,
                              );
                          }}
                          onPointerCancel={() => setDragging(false)}
                          onKeyDown={(e) => {
                            const step = e.shiftKey ? 10 : 2;
                            const move = {
                              ArrowLeft: [-step, 0],
                              ArrowRight: [step, 0],
                              ArrowUp: [0, -step],
                              ArrowDown: [0, step],
                            }[e.key];
                            if (!move) return;
                            e.preventDefault();
                            aim(s.id, spot.x + move[0], spot.y + move[1]);
                          }}
                          className={`relative mx-auto w-fit max-w-full touch-none select-none overflow-hidden rounded-lg bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${dragging ? "cursor-grabbing" : "cursor-crosshair"}`}
                        >
                          {/* The box is exactly as big as the picture, so the point is measured on the picture itself. */}
                          {/* eslint-disable-next-line @next/next/no-img-element -- a preview served by the dashboard, or a local file */}
                          <img
                            src={src}
                            alt=""
                            draggable={false}
                            className="block max-h-72 w-auto max-w-full select-none"
                          />
                          <span
                            aria-hidden
                            className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent/50 shadow-[0_0_0_1.5px_rgba(0,0,0,0.5)] transition-[width,height] duration-100 motion-reduce:transition-none ${dragging ? "size-8" : "size-6"}`}
                            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                          />
                        </div>
                      </div>
                      <figure className="grid content-start gap-1.5">
                        <p className={labelCls}>How it will look</p>
                        {/* eslint-disable-next-line @next/next/no-img-element -- a preview served by the dashboard, or a local file */}
                        <img
                          src={src}
                          alt=""
                          className="w-full rounded-md bg-surface object-cover"
                          style={{
                            aspectRatio: String(s.frame),
                            objectPosition: `${spot.x}% ${spot.y}%`,
                          }}
                        />
                        <figcaption className="text-xs text-text-soft">
                          The frame on the website
                        </figcaption>
                      </figure>
                    </div>
                  )}

                  {src && (
                    <div className="grid gap-4">
                      <div>
                        <label htmlFor={`alt-${s.id}`} className={labelCls}>
                          Description
                        </label>
                        <textarea
                          id={`alt-${s.id}`}
                          rows={2}
                          value={altOf(s)}
                          aria-invalid={bad === s.id || undefined}
                          placeholder="Describe what is in the photo"
                          onChange={(e) => edit(s.id, { alt: e.target.value })}
                          className={`${field} h-auto min-h-14 py-2 text-[13px] leading-snug`}
                        />
                        <p className={hintCls}>
                          For people who cannot see the photo, and for Google.
                          Say what is in it.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => pick.current?.click()}
                          className={btn}
                        >
                          Replace photo
                        </button>
                        <Remove
                          what={`the ${s.label.toLowerCase()}`}
                          onRemove={() => {
                            const before = edits[s.id];
                            edit(s.id, {
                              remove: true,
                              blob: undefined,
                              url: undefined,
                            });
                            undo.offer(`Removed the ${s.label.toLowerCase()}.`, () =>
                              setEdits((all) => {
                                const next = { ...all };
                                if (before) next[s.id] = before;
                                else delete next[s.id];
                                return next;
                              }),
                            );
                          }}
                        />
                        <span className="text-xs text-text-soft">
                          JPG, PNG or WebP, at least {PHOTO_LIMITS.minLongSide}{" "}
                          pixels wide, up to {PHOTO_LIMITS.pickMaxMb} MB.
                        </span>
                      </div>
                    </div>
                  )}
                  {notes[s.id] && (
                    <p role="alert" className="text-sm text-danger">
                      {notes[s.id]}
                    </p>
                  )}
                </div>
              </Collapse>
            </li>
          );
        })}
      </ul>
      {undo.view}
    </div>
  );
}
