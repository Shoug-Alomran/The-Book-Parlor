import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BookCard } from "../components/BookCard";
import { PageHeader } from "../components/PageHeader";
import { SkeletonCard } from "../components/SkeletonCard";
import { TropeChips } from "../components/TropeChips";
import { moods, smartShelves, tropes } from "../data/constants";
import { bookService } from "../services/bookService";
import type { Book } from "../types";

type DiscoveryFilter = {
  label: string;
  kind: "trope" | "mood" | "shelf";
};

export function DiscoverPage() {
  const [activeFilter, setActiveFilter] = useState<DiscoveryFilter | null>(null);
  const [externalMatches, setExternalMatches] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const visibleBooks = useMemo(() => dedupeBooks(externalMatches), [externalMatches]);

  useEffect(() => {
    setLoading(true);
    bookService.discoverBooks()
      .then((books) => {
        setExternalMatches(books);
        if (!books.length) setMessage("Could not load discovery books right now. Try Search or tap a mood.");
      })
      .catch(() => setMessage("Could not load discovery books right now. Try Search or tap a mood."))
      .finally(() => setLoading(false));
  }, []);

  const selectTag = async (label: string, kind: DiscoveryFilter["kind"]) => {
    const next = { label, kind };
    setActiveFilter(next);
    setExternalMatches([]);
    setMessage("");
    setLoading(true);
    try {
      const books = await bookService.searchBooks(buildDiscoveryQuery(label, kind));
      setExternalMatches(books);
      if (!books.length) setMessage("No live metadata matches came back for that mood yet. Try another tag or use Search.");
    } catch {
      setMessage("Could not fetch live matches right now. Try another tag or use Search.");
    } finally {
      setLoading(false);
    }
  };

  const clearFilter = () => {
    setActiveFilter(null);
    setExternalMatches([]);
    setMessage("");
  };

  return (
    <div>
      <PageHeader eyebrow="Discover" title="Find books by vibe, trope, and shelf mood." description="MVP recommendations are rule-based from favorite genres, high-rated tropes, saved moods, and owned unread books, with AI-ready service boundaries for later." />
      {activeFilter && (
        <section className="cozy-card mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-mocha/70 dark:text-gold">Currently browsing</p>
            <h2 className="font-serif text-3xl font-bold">{activeFilter.label}</h2>
            <p className="mt-1 text-sm font-semibold text-espresso/65 dark:text-cream/65">{visibleBooks.length} book match{visibleBooks.length === 1 ? "" : "es"} for this mood.</p>
          </div>
          <button type="button" onClick={clearFilter} className="btn-soft"><X size={18} />Clear filter</button>
        </section>
      )}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="cozy-card lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-3xl font-bold">{activeFilter ? `Books for ${activeFilter.label}` : "Fresh from external book metadata"}</h2>
            {activeFilter && <span className="chip"><Search size={13} />Live metadata search</span>}
          </div>
          {message && <p className="mb-4 rounded-2xl bg-gold/20 p-3 text-sm font-bold">{message}</p>}
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleBooks.map((book) => <BookCard key={book.id} item={book} compact />)}
            {loading && Array.from({ length: 2 }).map((_, index) => <SkeletonCard key={`skeleton-${index}`} />)}
          </div>
          {!loading && !visibleBooks.length && (
            <div className="rounded-2xl bg-white/55 p-5 text-center dark:bg-white/10">
              <h3 className="font-serif text-2xl font-bold">No live books loaded yet.</h3>
              <p className="mt-2 text-sm text-espresso/70 dark:text-cream/70">Try another mood, trope, smart shelf, or search for a title directly.</p>
            </div>
          )}
        </div>
        <div className="grid gap-4">
          <article className="cozy-card">
            <h2 className="font-serif text-3xl font-bold">Popular by trope</h2>
            <div className="mt-4"><TropeChips items={tropes.slice(0, 12)} activeItem={activeFilter?.label} onSelect={(item) => selectTag(item, "trope")} /></div>
          </article>
          <article className="cozy-card">
            <h2 className="font-serif text-3xl font-bold">Mood finder</h2>
            <div className="mt-4"><TropeChips items={moods} tone="mood" activeItem={activeFilter?.label} onSelect={(item) => selectTag(item, "mood")} /></div>
          </article>
          <article className="cozy-card">
            <h2 className="font-serif text-3xl font-bold">Smart shelves</h2>
            <div className="mt-4"><TropeChips items={smartShelves.slice(0, 10)} tone="mood" activeItem={activeFilter?.label} onSelect={(item) => selectTag(item, "shelf")} /></div>
          </article>
        </div>
      </section>
    </div>
  );
}

function bookMatchesFilter(book: Book, label: string) {
  const needle = normalize(label);
  const values = [
    book.title,
    book.description,
    ...book.categories,
    ...book.tropes,
    ...book.moods,
    ...(book.externalSubjects ?? []),
  ].map(normalize);

  const aliases = smartShelfAliases(needle);
  return values.some((value) => value.includes(needle) || aliases.some((alias) => value.includes(alias)));
}

function buildDiscoveryQuery(label: string, kind: DiscoveryFilter["kind"]) {
  const clean = label.replace(/-/g, " ");
  if (kind === "trope") return `${clean} fiction`;
  if (kind === "mood") return `${clean} books`;
  return `${clean} books`;
}

function smartShelfAliases(label: string) {
  const map: Record<string, string[]> = {
    "enemies to lovers": ["enemies-to-lovers", "enemy", "rival"],
    "mafia romance": ["mafia", "crime family"],
    "fantasy romance": ["fantasy", "romance", "romantasy"],
    "owned but unread": ["want to read", "tbr"],
    "high spice tbr": ["spice", "romance"],
    "books that might destroy me": ["devastating", "emotional", "grief"],
    "comfort reads": ["comforting", "cozy", "healing"],
    "slow burn": ["slow burn"],
    "dark academia": ["dark academia", "academy"],
    "fae books": ["fae", "faerie", "fairy"],
    "emotional damage": ["emotional", "devastating"],
    "cozy reads": ["cozy", "comforting"],
  };
  return map[label] ?? [];
}

function dedupeBooks(books: Book[]) {
  const seen = new Set<string>();
  return books.filter((book) => {
    const key = book.isbn13 ?? book.googleBooksId ?? book.externalId ?? `${book.title}-${book.authors.join(",")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[-_]/g, " ").trim();
}
