import { Link } from "react-router-dom";
import { BookPlus, Coffee, Flame, LibraryBig, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BookCard } from "../components/BookCard";
import { PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { bookService } from "../services/bookService";
import { statsService } from "../services/statsService";
import type { UserBook } from "../types";
import type { LucideIcon } from "lucide-react";

const statCards: Array<[string, keyof ReturnType<typeof statsService.summarize>, LucideIcon]> = [
  ["Books read", "readCount", Sparkles],
  ["TBR count", "tbrCount", LibraryBig],
  ["Purchased", "purchasedCount", Coffee],
  ["Owned unread", "ownedUnreadCount", Flame],
];

export function DashboardPage() {
  const [books, setBooks] = useState<UserBook[]>([]);
  useEffect(() => { bookService.getUserBooks().then(setBooks); }, []);
  const stats = useMemo(() => statsService.summarize(books), [books]);
  const current = books.find((item) => item.readingStatus === "Currently Reading");
  const goalProgress = Math.round((stats.readCount / stats.yearlyGoal) * 100);

  return (
    <div>
      <PageHeader
        eyebrow="Welcome back"
        title="Your table by the window is ready."
        description="Track your reading, tend your shelves, and keep the emotional metadata that makes every book feel personal."
        action={<Link to="/search" className="btn-primary"><BookPlus size={18} />Quick add book</Link>}
      />

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="glass-panel relative overflow-hidden rounded-3xl p-6 md:p-8">
          <div className="absolute right-6 top-6 text-gold/60"><Coffee size={48} /></div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-mocha/70 dark:text-gold">Currently reading</p>
          {current ? (
            <div className="mt-5 grid gap-5 md:grid-cols-[160px_1fr]">
              <img src={current.book.coverUrl} alt={current.book.title} className="aspect-[2/3] w-full rounded-2xl object-cover shadow-2xl" />
              <div>
                <h2 className="font-serif text-4xl font-bold">{current.book.title}</h2>
                <p className="mt-2 font-semibold text-mocha/70 dark:text-cream/65">{current.book.authors.join(", ")}</p>
                <p className="mt-4 leading-7 text-espresso/70 dark:text-cream/70">{current.book.description}</p>
                <div className="mt-5">
                  <ProgressBar value={((current.currentPage ?? 0) / (current.book.pageCount ?? 1)) * 100} label={`${current.currentPage} of ${current.book.pageCount} pages`} />
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-lg">Pick a book to start your next reading session.</p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {statCards.map(([label, key, Icon]) => (
            <article key={label} className="cozy-card">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-mocha/70 dark:text-cream/65">{label}</span>
                <Icon className="text-cafe dark:text-gold" />
              </div>
              <p className="mt-3 font-serif text-5xl font-bold">{stats[key]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="cozy-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-3xl font-bold">Yearly goal bookcase</h2>
            <span className="chip">{stats.readCount}/{stats.yearlyGoal}</span>
          </div>
          <ProgressBar value={goalProgress} label="Reading goal" />
          <div className="mt-5 flex gap-1 overflow-hidden rounded-2xl bg-mocha/20 p-3 dark:bg-white/10">
            {Array.from({ length: 18 }).map((_, index) => (
              <div key={index} className={`h-24 flex-1 rounded-t ${index < Math.round(goalProgress / 6) ? "bg-gradient-to-t from-mocha to-gold" : "bg-white/35 dark:bg-white/10"}`} />
            ))}
          </div>
        </div>
        <div className="cozy-card">
          <h2 className="font-serif text-3xl font-bold">Reading personality</h2>
          <div className="mt-4 grid gap-3 text-sm font-semibold">
            <p>Favorite genre: <span className="text-mocha dark:text-gold">{stats.favoriteGenre}</span></p>
            <p>Most read author: <span className="text-mocha dark:text-gold">{stats.mostReadAuthor}</span></p>
            <p>Common trope: <span className="text-mocha dark:text-gold">{stats.mostCommonTrope}</span></p>
            <p>Mood of the month: <span className="text-mocha dark:text-gold">{stats.moodOfMonth}</span></p>
            <p>Reading streak: <span className="text-mocha dark:text-gold">{stats.streak} days</span></p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-4 font-serif text-3xl font-bold">Recent shelf activity</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {books.slice(0, 4).map((book) => <BookCard key={book.id} item={book} compact />)}
        </div>
      </section>
    </div>
  );
}
