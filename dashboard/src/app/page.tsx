import { redirect } from "next/navigation";
import { authOn } from "@/lib/auth/config";

// The home screen is at /preview. On a live site without sign-in set up, there is nothing to show yet.
export const dynamic = "force-dynamic";

export default function Home() {
  if (authOn() || process.env.NODE_ENV !== "production") redirect("/preview");
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-3 px-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-text-soft">This dashboard is being set up.</p>
    </main>
  );
}
