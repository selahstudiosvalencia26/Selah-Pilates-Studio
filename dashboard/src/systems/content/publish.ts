import { after } from "next/server";

// Saving on the live site also updates the website: it is asked to build itself again with the saved words and photos.
// WEBSITE_DEPLOY_HOOK is a private address made in Vercel (website project, Settings, Git, Deploy Hooks). Server only.
const hook = () => (process.env.WEBSITE_DEPLOY_HOOK ?? "").trim();

export const publishingOn = (): boolean => hook().startsWith("https://");

/** Ask for a new build after the answer has gone out, so saving is never slowed down or undone by it. */
export function publishSoon(): void {
  if (!publishingOn()) return;
  after(async () => {
    try {
      const answer = await fetch(hook(), { method: "POST", cache: "no-store" });
      if (!answer.ok) throw new Error(String(answer.status));
    } catch (e) {
      console.error("content: publish failed", e instanceof Error ? e.message : "unknown");
    }
  });
}
