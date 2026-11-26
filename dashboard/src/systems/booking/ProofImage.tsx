"use client";

import { useState } from "react";
import Dialog from "@/kit/Dialog";

// The customer's payment screenshot: small on the page so the booking fits on one screen, big when pressed, for reading it.
export default function ProofImage({ src, who }: { src: string; who: string }) {
  const [open, setOpen] = useState(false);
  const alt = `Payment screenshot from ${who}`;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="justify-self-start rounded-lg focus-visible:outline-2 focus-visible:outline-accent">
        {/* eslint-disable-next-line @next/next/no-img-element -- a private picture, sent with the page */}
        <img src={src} alt={alt} className="max-h-64 w-auto max-w-full cursor-zoom-in rounded-lg border border-border transition-transform duration-150 hover:scale-[1.02] motion-reduce:transition-none" />
        <span className="mt-2 block text-xs text-text-soft">Press to see it bigger</span>
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Payment screenshot">
        {/* eslint-disable-next-line @next/next/no-img-element -- the same private picture, bigger */}
        <img src={src} alt={alt} className="max-h-[70vh] w-auto max-w-full justify-self-center rounded-lg" />
      </Dialog>
    </>
  );
}
