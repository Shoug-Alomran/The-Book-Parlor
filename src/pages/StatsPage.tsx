import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { bookService } from "../services/bookService";
import { statsService } from "../services/statsService";
import type { UserBook } from "../types";

const bars = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export function StatsPage() {
  const [books, setBooks] = useState<UserBook[]>([]);
  useEffect(() => { bookService.getUserBooks().then(setBooks); }, []);
  const stats = useMemo(() => statsService.summarize(books), [books]);
  return (
    <div>
      <PageHeader eyebrow="Stats" title="Your reading, brewed into patterns." description="Books, pages, formats, genres, tropes, moods, ratings, authors, DNF reasons, and emotional extremes." />
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Pages read", stats.pagesRead],
          ["Average rating", "4.4"],
          ["Longest book", "560"],
          ["DNF reason", "slow pacing"],
        ].map(([label, value]) => (
          <article key={label} className="cozy-card"><p className="text-sm font-bold text-mocha/70 dark:text-cream/60">{label}</p><p className="mt-3 font-serif text-4xl font-bold">{value}</p></article>
        ))}
      </section>
      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="cozy-card">
          <h2 className="font-serif text-3xl font-bold">Books read by month</h2>
          <div className="mt-5 flex h-72 items-end gap-3">
            {bars.map((bar, index) => <div key={bar} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-2xl bg-gradient-to-t from-mocha to-gold" style={{ height: `${45 + index * 14}px` }} /><span className="text-xs font-bold">{bar}</span></div>)}
          </div>
        </div>
        <div className="cozy-card">
          <h2 className="font-serif text-3xl font-bold">Breakdowns</h2>
          <div className="mt-5 grid gap-3">
            {["format", "genre", "trope", "mood"].map((label, index) => <div key={label} className="rounded-2xl bg-white/55 p-4 dark:bg-white/10"><div className="flex justify-between font-bold"><span>{label}</span><span>{["Physical", "Fantasy", "slow burn", "cozy"][index]}</span></div></div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
