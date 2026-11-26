"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import AskFirst from "./AskFirst";
import { bulkAction, type BulkKind } from "./bulk";
import type { Booking } from "./schema";
import { btn, card, link, primary } from "./ui";

// What can be done with the ticked bookings. Only steps that fit at least one of them are offered. Delete and Cancel ask first;
// Delete can still be undone afterwards. The result is told in words.
const WORDS: Record<BulkKind, string> = { paid: "marked paid", done: "marked done", cancel: "cancelled", delete: "deleted", restore: "put back" };
const many = (n: number) => `${n} ${n === 1 ? "booking" : "bookings"}`;

export default function BulkBar({ picked, onClear }: { picked: Booking[]; onClear: () => void }) {
  const router = useRouter();
  const [asking, setAsking] = useState<"cancel" | "delete" | null>(null);
  const [note, setNote] = useState<{ text: string; undo: string[]; bad: boolean } | null>(null);
  const [pending, start] = useTransition();

  const run = (kind: BulkKind, ids: string[]) =>
    start(async () => {
      const r = await bulkAction({ kind, ids });
      if (!r.ok) return setNote({ text: r.message, undo: [], bad: true });
      const { done, skipped } = r.data;
      const left = skipped ? ` ${many(skipped)} left as before: that step does not fit, or your role does not allow it.` : "";
      setNote({ text: `${many(done.length)} ${WORDS[kind]}.${left}`, undo: kind === "delete" ? done : [], bad: done.length === 0 });
      onClear();
      router.refresh();
    });
  const ids = picked.map((b) => b.id);
  const some = (test: (b: Booking) => boolean) => picked.some(test);

  return (
    <>
      <AskFirst
        open={asking !== null}
        title={asking === "delete" ? `Delete ${many(picked.length)}?` : `Cancel ${many(picked.length)}?`}
        text={asking === "delete" ? "They are removed from the list. You can undo it right after." : "Their slots are freed. A deposit already paid is kept. This cannot be undone."}
        yes={asking === "delete" ? "Delete" : "Cancel them"}
        onYes={() => asking && run(asking, ids)}
        onClose={() => setAsking(null)}
      />
      {note && (
        <p role="status" className={`flex flex-wrap items-center gap-3 text-sm ${note.bad ? "text-danger" : "text-text-soft"}`}>
          {note.text}
          {note.undo.length > 0 && (
            <button type="button" className={link} disabled={pending} onClick={() => run("restore", note.undo)}>
              Undo
            </button>
          )}
        </p>
      )}
      {picked.length > 0 && (
        <div className={`${card} flex flex-wrap items-center gap-2 p-3 transition-[opacity,translate] duration-200 ease-out starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none`}>
          <span className="px-1 text-sm font-medium">{picked.length} ticked</span>
          {some((b) => b.status === "requested") && (
            <button type="button" className={primary} disabled={pending} onClick={() => run("paid", ids)}>
              Mark paid
            </button>
          )}
          {some((b) => b.status === "confirmed") && (
            <button type="button" className={btn} disabled={pending} onClick={() => run("done", ids)}>
              Mark done
            </button>
          )}
          {some((b) => b.status === "requested" || b.status === "confirmed") && (
            <button type="button" className={btn} disabled={pending} onClick={() => setAsking("cancel")}>
              Cancel
            </button>
          )}
          <button type="button" className={btn} disabled={pending} onClick={() => setAsking("delete")}>
            Delete
          </button>
          <button type="button" className={`${link} ml-auto`} onClick={onClear}>
            Untick all
          </button>
          {some((b) => b.status === "requested" && b.deposit === "waiting") && <p className="w-full px-1 text-xs text-text-soft">Mark paid records the amount asked as paid by GCash today. Check the money arrived first.</p>}
        </div>
      )}
    </>
  );
}
