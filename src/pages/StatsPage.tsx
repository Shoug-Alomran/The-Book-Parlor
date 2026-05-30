import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { bookService } from "../services/bookService";
import { statsService, type RatingStats } from "../services/statsService";
import type { UserBook } from "../types";

const bars = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function StatsPage() {
  const [books, setBooks] = useState<UserBook[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats>({ averageRating: null, count: 0 });
  useEffect(() => {
    bookService.getUserBooks().then(setBooks);
    statsService.getRatingStats().then(setRatingStats);
  }, []);
  const stats = useMemo(() => statsService.summarize(books), [books]);
  const monthlyReads = useMemo(() => statsService.booksReadByMonth(books), [books]);
  const maxMonth = Math.max(1, ...monthlyReads);
  return (
    <div>
      <PageHeader eyebrow="Stats" title="Your reading, brewed into patterns." description="Books, pages, formats, genres, tropes, moods, ratings, authors, DNF reasons, and emotional extremes." />
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Pages read", stats.pagesRead],
          ["Average rating", ratingStats.averageRating === null ? "Not enough data yet" : `${ratingStats.averageRating} (${ratingStats.count})`],
          ["Longest book", stats.longestBook || "Not enough data yet"],
          ["DNF reason", stats.dnfReason],
        ].map(([label, value]) => (
          <article key={label} className="cozy-card"><p className="text-sm font-bold text-mocha/70 dark:text-cream/60">{label}</p><p className="mt-3 font-serif text-4xl font-bold">{value}</p></article>
        ))}
      </section>
      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="cozy-card">
          <h2 className="font-serif text-3xl font-bold">Books read by month</h2>
          <div className="mt-5 flex h-72 items-end gap-3">
            {bars.map((bar, index) => <div key={bar} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-2xl bg-gradient-to-t from-mocha to-gold" style={{ height: `${Math.max(12, (monthlyReads[index] / maxMonth) * 220)}px` }} /><span className="text-xs font-bold">{bar}</span></div>)}
          </div>
        </div>
        <div className="cozy-card">
          <h2 className="font-serif text-3xl font-bold">Breakdowns</h2>
          <div className="mt-5 grid gap-3">
            {[
              ["format", stats.topFormat],
              ["genre", stats.favoriteGenre],
              ["trope", stats.mostCommonTrope],
              ["mood", stats.moodOfMonth],
            ].map(([label, value]) => <div key={label} className="rounded-2xl bg-white/55 p-4 dark:bg-white/10"><div className="flex justify-between gap-3 font-bold"><span>{label}</span><span className="text-right">{value}</span></div></div>)}
          </div>
        </div>
      </section>
      {!books.length && <p className="mt-5 rounded-2xl bg-white/55 p-4 text-sm font-bold text-espresso/70 dark:bg-white/10 dark:text-cream/70">Stats will fill in as you add books, finish reading, and rate them.</p>}
    </div>
  );
}
