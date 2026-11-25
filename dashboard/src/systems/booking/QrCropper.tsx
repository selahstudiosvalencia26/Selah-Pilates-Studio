"use client";

import { useRef, useState } from "react";
import { buttonClass } from "@/kit/Button";
import Dialog from "@/kit/Dialog";
import { MAX_QR_CHARS } from "./schema";
import { hintCls, labelCls } from "./ui";

// Before a QR picture is used: drag it, zoom in on the code, and keep only the square shown. It starts with the whole
// picture inside the square, so nothing is cut unless the person zooms in.
const VIEW = 288; // the square on screen
const OUT = 800; // the square that is saved
const MAX_ZOOM = 5;

type Props = { src: string; onCancel: () => void; onDone: (qr: string) => void };

export default function QrCropper({ src, onCancel, onDone }: Props) {
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [at, setAt] = useState({ x: 0, y: 0 }); // how far the picture is moved from the middle
  const [problem, setProblem] = useState("");

  const scale = size ? (VIEW / Math.max(size.w, size.h)) * zoom : 1;
  const shown = size ? { w: size.w * scale, h: size.h * scale } : { w: VIEW, h: VIEW };
  // A picture wider than the square can slide only until its edge meets the square's; a smaller one stays in the middle.
  const held = (v: number, side: number) => {
    const room = Math.max(0, (side - VIEW) / 2);
    return Math.min(room, Math.max(-room, v));
  };
  const x = held(at.x, shown.w);
  const y = held(at.y, shown.h);
  const left = (VIEW - shown.w) / 2 + x;
  const top = (VIEW - shown.h) / 2 + y;
  const move = (dx: number, dy: number) => setAt({ x: held(x + dx, shown.w), y: held(y + dy, shown.h) });

  const use = () => {
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const draw = canvas.getContext("2d");
    if (!draw || !image.current) return setProblem("That picture could not be used. Try another one.");
    draw.fillStyle = "white"; // a see-through or narrow picture gets a white back, so the code can still be scanned
    draw.fillRect(0, 0, OUT, OUT);
    const f = OUT / VIEW;
    draw.drawImage(image.current, left * f, top * f, shown.w * f, shown.h * f);
    const png = canvas.toDataURL("image/png");
    const qr = png.length <= MAX_QR_CHARS ? png : canvas.toDataURL("image/jpeg", 0.9);
    if (qr.length > MAX_QR_CHARS) return setProblem("That picture is too detailed. Zoom in on the QR code and try again.");
    onDone(qr);
  };

  return (
    <Dialog
      open
      onClose={onCancel}
      title="Adjust the QR picture"
      actions={
        <>
          <button type="button" className={buttonClass()} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={buttonClass("primary")} disabled={!size} onClick={use}>
            Use picture
          </button>
        </>
      }
    >
      <div className="grid justify-items-center gap-4">
        <div
          role="application"
          tabIndex={0}
          aria-label="Move the picture: drag it, or use the arrow keys"
          style={{ width: VIEW, height: VIEW }}
          className="relative cursor-grab touch-none select-none overflow-hidden rounded-xl border border-border bg-surface active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-accent"
          onPointerDown={(e) => (e.currentTarget.setPointerCapture(e.pointerId), (drag.current = { x: e.clientX, y: e.clientY }))}
          onPointerMove={(e) => {
            if (!drag.current) return;
            move(e.clientX - drag.current.x, e.clientY - drag.current.y);
            drag.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onKeyDown={(e) => {
            const step = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[e.key];
            if (!step) return;
            e.preventDefault();
            move(step[0], step[1]);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- the picture the person just chose, still on their computer */}
          <img ref={image} src={src} alt="" draggable={false} onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} style={{ position: "absolute", left, top, width: shown.w, height: shown.h, maxWidth: "none" }} />
          {/* Guides for centring: thirds, a middle cross and an even margin. On screen only, never part of the saved picture. */}
          <svg aria-hidden viewBox={`0 0 ${VIEW} ${VIEW}`} className="pointer-events-none absolute inset-0 h-full w-full text-accent transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none">
            <path d={`M${VIEW / 3} 0V${VIEW} M${(VIEW * 2) / 3} 0V${VIEW} M0 ${VIEW / 3}H${VIEW} M0 ${(VIEW * 2) / 3}H${VIEW}`} stroke="currentColor" strokeWidth="1" opacity="0.55" fill="none" />
            <path d={`M${VIEW / 2} 0V${VIEW} M0 ${VIEW / 2}H${VIEW}`} stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="16" y="16" width={VIEW - 32} height={VIEW - 32} stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 5" fill="none" />
          </svg>
        </div>
        <div className="grid w-full gap-1">
          <label htmlFor="qr-zoom" className={labelCls}>
            Zoom
          </label>
          <input id="qr-zoom" type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="h-11 w-full accent-accent" />
          <p className={hintCls}>Zoom in and drag until the QR code sits evenly inside the dashed square.</p>
          {problem && (
            <p role="alert" className="text-sm text-danger">
              {problem}
            </p>
          )}
        </div>
      </div>
    </Dialog>
  );
}
