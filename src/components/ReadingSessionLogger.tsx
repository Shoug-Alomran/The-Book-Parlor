import { Clock } from "lucide-react";

export function ReadingSessionLogger() {
  return (
    <section className="cozy-card">
      <h2 className="font-serif text-3xl font-bold">Reading session</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {["Date", "Start time", "End time", "Pages read", "Mood", "Format used"].map((field) => (
          <input key={field} placeholder={field} className="rounded-2xl border-0 bg-white/70 p-3 outline-none dark:bg-white/10" />
        ))}
        <textarea placeholder="Session notes" className="min-h-24 rounded-2xl border-0 bg-white/70 p-3 outline-none dark:bg-white/10 md:col-span-2" />
        <button className="btn-primary md:col-span-2" type="button"><Clock size={18} />Log session</button>
      </div>
    </section>
  );
}
