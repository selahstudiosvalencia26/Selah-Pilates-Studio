// A page that is slow on purpose, only to show the built-in loading state while it waits for its data. Development only
// (the shell layout is not found in production).
export default async function SlowPage() {
  await new Promise((resolve) => setTimeout(resolve, 2500));
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-semibold tracking-[-0.015em]">Loaded</h1>
      <p className="max-w-2xl text-text-soft">This page waited 2.5 seconds for its data. While it waited, the page area showed the loading placeholder. The menu link that was pressed does that by itself (NavPending.tsx), and the page needed no code for it.</p>
    </div>
  );
}
