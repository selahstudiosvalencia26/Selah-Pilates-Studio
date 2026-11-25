"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import Avatar from "@/shell/frame/Avatar";
import { removeAvatar, saveAvatar } from "./actions";
import { prepareAvatar } from "./avatarClient";
import { buttonClass } from "@/kit/Button";

// Add, change or remove your profile photo. The chosen picture is checked and re-drawn as a small square in the browser, then
// checked again on the server (./avatar.ts, ./actions.ts), so only a clean little picture is ever kept. It shows next to your name
// in the menu, here, and in the People list. The initial letter stays as the fallback.
const quiet = buttonClass("quiet");

export default function AvatarEditor({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, start] = useTransition();
  const [preview, setPreview] = useState<string | null>(null); // shown at once, before the server has answered
  const [problem, setProblem] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const shown = preview ?? avatarUrl;

  const choose = (file: File | undefined) =>
    start(async () => {
      if (!file) return;
      setProblem(null);
      setNote(null);
      const prepared = await prepareAvatar(file);
      if (!prepared.ok) return setProblem(prepared.message);
      setPreview(prepared.dataUrl);
      const saved = await saveAvatar(prepared.dataUrl);
      if (!saved.ok) {
        setPreview(null);
        return setProblem(saved.message);
      }
      setNote("Your photo is saved.");
      router.refresh();
    });

  const remove = () =>
    start(async () => {
      setProblem(null);
      setNote(null);
      const result = await removeAvatar();
      if (!result.ok) return setProblem(result.message);
      setPreview(null);
      setNote("Your photo was removed.");
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar name={name} src={shown} className="h-20 w-20 text-2xl" />
      <div className="grid gap-2">
        <div>
          <p className="text-sm font-medium">Profile photo</p>
          <p className="max-w-sm text-[13px] text-text-soft">
            A square picture works best. It shows next to your name in the menu
            and in People.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className={quiet}
          >
            {busy ? "Saving..." : shown ? "Change photo" : "Add a photo"}
          </button>
          {shown && (
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className={quiet}
            >
              Remove photo
            </button>
          )}
        </div>
        {/* The real file box, out of sight. The buttons above open it, so they look like the rest of the dashboard. */}
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="Choose a profile photo"
          tabIndex={-1}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // choosing the same file again still counts
            choose(file);
          }}
        />
        {problem && (
          <p role="alert" className="text-[13px] text-danger">
            {problem}
          </p>
        )}
        {note && (
          <p role="status" className="text-[13px] text-text-soft">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
