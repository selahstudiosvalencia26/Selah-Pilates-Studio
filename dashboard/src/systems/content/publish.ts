"use server";

import { createLimiter, waitWords } from "@/kit/rateLimit";
import { err, ok, type Result } from "@/kit/result";
import { canSave } from "@/kit/session";

// Publish: ask the website to build itself again with the saved words and photos. WEBSITE_DEPLOY_HOOK is a private address made in
// Vercel (website project, Settings, Git, Deploy Hooks). It is only used here, on the server.
const presses = createLimiter({ max: 6, windowMs: 10 * 60 * 1000 });

export async function publishWebsite(): Promise<Result> {
  if (!(await canSave())) return err("Please sign in again.");
  const hook = (process.env.WEBSITE_DEPLOY_HOOK ?? "").trim();
  if (!hook.startsWith("https://")) return err("Publishing is not set up yet. Your changes are saved. Tell the builder.");
  const limit = presses.hit("owner");
  if (!limit.allowed) return err(`Please wait ${waitWords(limit.retryAfterSeconds)} before publishing again.`);
  try {
    const answer = await fetch(hook, { method: "POST", cache: "no-store" });
    if (!answer.ok) throw new Error(String(answer.status));
    return ok(undefined);
  } catch (e) {
    console.error("content: publish failed", e instanceof Error ? e.message : "unknown");
    return err("Could not publish. Your changes are saved. Try again in a minute.");
  }
}
