import { BookCard } from "../components/BookCard";
import { PageHeader } from "../components/PageHeader";
import { TropeChips } from "../components/TropeChips";
import { smartShelves, tropes } from "../data/constants";
import { demoBooks } from "../data/demoData";

export function DiscoverPage() {
  return (
    <div>
      <PageHeader eyebrow="Discover" title="Find books by vibe, trope, and shelf mood." description="MVP recommendations are rule-based from favorite genres, high-rated tropes, saved moods, and owned unread books, with AI-ready service boundaries for later." />
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="cozy-card lg:col-span-2">
          <h2 className="mb-4 font-serif text-3xl font-bold">Trending in the parlor</h2>
          <div className="grid gap-4 xl:grid-cols-2">{demoBooks.map((book) => <BookCard key={book.id} item={book} compact />)}</div>
        </div>
        <div className="grid gap-4">
          <article className="cozy-card">
            <h2 className="font-serif text-3xl font-bold">Popular by trope</h2>
            <div className="mt-4"><TropeChips items={tropes.slice(0, 12)} /></div>
          </article>
          <article className="cozy-card">
            <h2 className="font-serif text-3xl font-bold">Smart shelves</h2>
            <div className="mt-4"><TropeChips items={smartShelves.slice(0, 10)} tone="mood" /></div>
          </article>
        </div>
      </section>
      <section className="cozy-card mt-5">
        <h2 className="font-serif text-3xl font-bold">If you loved cozy magic, try these</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {["new releases", "popular by genre", "community favorites"].map((label) => (
            <div key={label} className="rounded-2xl bg-white/55 p-5 dark:bg-white/10">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-mocha/70 dark:text-gold">{label}</p>
              <p className="mt-3 leading-6 text-espresso/70 dark:text-cream/70">Placeholder rail ready for Supabase aggregates and external metadata feeds.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
