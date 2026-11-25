// What a signed-in owner sees on the live site while the rest is being connected: what works now and what comes next. No sample
// data is shown, so nothing here can be mistaken for real bookings.
const STEPS = [
  { title: "Sign in", note: "Only invited people can get in.", done: true },
  { title: "Bookings", note: "Classes, schedule, bookings and deposits, saved online.", done: false },
  { title: "Website editing", note: "Change your words and photos from here.", done: false },
  { title: "Emails", note: "Booking messages sent to you and your customers.", done: false },
];

export default function FirstStage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.015em]">You are signed in</h1>
        <p className="mt-1 text-sm text-text-soft">Your dashboard is being connected one part at a time.</p>
      </div>
      <ol className="grid gap-3">
        {STEPS.map((s) => (
          <li key={s.title} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-text-soft">{s.note}</p>
            </div>
            <span className={`shrink-0 text-xs font-medium ${s.done ? "text-success" : "text-text-soft"}`}>{s.done ? "Ready" : "Coming"}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
