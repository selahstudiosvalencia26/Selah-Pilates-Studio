"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { bookingApi } from "@/content/booking";

// After paying, the customer attaches the screenshot right here. It is made smaller in their browser first, then sent to the studio.
async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  for (const [side, quality] of [[1400, 0.82], [1100, 0.75], [900, 0.65]] as const) {
    const f = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * f);
    canvas.height = Math.round(bitmap.height * f);
    const draw = canvas.getContext("2d");
    if (!draw) break;
    draw.fillStyle = "white";
    draw.fillRect(0, 0, canvas.width, canvas.height);
    draw.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const picture = canvas.toDataURL("image/jpeg", quality);
    if (picture.length <= 580_000) return picture;
  }
  throw new Error("too big");
}

export default function PayProof({ id, code }: { id: string; code: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [problem, setProblem] = useState("");

  const send = async (file: File | undefined) => {
    if (!file) return;
    setState("sending");
    setProblem("");
    try {
      const image = await shrink(file);
      const r = await fetch(`${bookingApi}/api/booking/proof`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, code, image }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.message);
      setState("sent");
    } catch (e) {
      setState("idle");
      setProblem(e instanceof Error && e.message.endsWith(".") ? e.message : "Could not send it. Please try again, or message us the screenshot.");
    }
  };

  if (state === "sent")
    return (
      <p role="status" className="mt-6 rounded-3xl bg-page p-6 font-serif text-2xl">
        Screenshot received. We will confirm your slot soon.
      </p>
    );

  return (
    <div className="mt-6 rounded-3xl bg-page p-7">
      <p className="font-serif text-2xl">Paid? Attach your receipt.</p>
      <p className="mt-1 text-muted">A screenshot of the payment is enough.</p>
      <label className="mt-4 inline-block cursor-pointer has-[:focus-visible]:outline-2">
        <input type="file" accept="image/*" disabled={state === "sending"} className="sr-only" onChange={(e) => void send(e.target.files?.[0])} />
        <Button variant="dark" tabIndex={-1} className="pointer-events-none">
          {state === "sending" ? "Sending" : "Choose screenshot"}
        </Button>
      </label>
      {problem && (
        <p role="alert" className="mt-3">
          {problem}
        </p>
      )}
    </div>
  );
}
