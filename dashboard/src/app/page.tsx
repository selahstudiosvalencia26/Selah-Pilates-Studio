import { redirect } from "next/navigation";

// While sign-in is not built, the real home screen exists only in development, at /preview.
export default function Home() {
  if (process.env.NODE_ENV !== "production") redirect("/preview");
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-3 px-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-text-soft">This dashboard is being set up.</p>
    </main>
  );
}
