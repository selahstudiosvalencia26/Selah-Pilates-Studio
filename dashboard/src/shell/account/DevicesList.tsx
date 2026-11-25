"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { endDevice, endOtherDevices } from "./actions";
import type { SessionInfo } from "./accountAuth";
import { buttonClass } from "@/kit/Button";

// Where the person is signed in. The device in use is named and cannot be ended here (that is "Sign out" in the menu). Each
// other device has one plain button. The server decides what may be ended; this only draws the list.
const quiet = buttonClass("quiet");

// "2 hours ago" in plain words.
function ago(iso: string, now = Date.now()): string {
  const minutes = Math.max(
    0,
    Math.round((now - new Date(iso).getTime()) / 60_000),
  );
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export default function DevicesList({ sessions }: { sessions: SessionInfo[] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [problem, setProblem] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const others = sessions.filter((s) => !s.current);

  const run = (
    job: () => Promise<{ ok: boolean; message?: string }>,
    done: string,
  ) =>
    start(async () => {
      setProblem(null);
      setNote(null);
      const result = await job();
      if (!result.ok)
        return setProblem(
          result.message ?? "Could not update your devices. Try again.",
        );
      setNote(done);
      router.refresh();
    });

  return (
    <div className="grid gap-4">
      <ul className="divide-y divide-border">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex min-h-14 items-center justify-between gap-4 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {s.label}
                {s.current && (
                  <span className="ml-2 rounded-md bg-selected px-1.5 py-0.5 text-xs font-medium text-text">
                    This device
                  </span>
                )}
              </p>
              <p className="text-[13px] text-text-soft">
                {s.current ? "Active now" : `Last active ${ago(s.lastActive)}`}
              </p>
            </div>
            {!s.current && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() => endDevice(s.id), `Signed out ${s.label}.`)
                }
                aria-label={`Sign out ${s.label}`}
                className={quiet}
              >
                Sign out
              </button>
            )}
          </li>
        ))}
      </ul>

      {others.length > 0 && (
        <div>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(() => endOtherDevices(), "Every other device was signed out.")
            }
            className={quiet}
          >
            Sign out all other devices
          </button>
        </div>
      )}
      {others.length === 0 && (
        <p className="text-sm text-text-soft">
          You are signed in on this device only.
        </p>
      )}

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
  );
}
