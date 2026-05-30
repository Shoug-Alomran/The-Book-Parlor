import { Barcode, Camera, ImagePlus, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BookCard } from "../components/BookCard";
import { PageHeader } from "../components/PageHeader";
import { SkeletonCard } from "../components/SkeletonCard";
import { TropeChips } from "../components/TropeChips";
import { ownershipStatuses, readingStatuses } from "../data/constants";
import { bookService } from "../services/bookService";
import { tropeDetectionService } from "../services/tropeDetectionService";
import type { Book, OwnershipStatus, ReadingStatus } from "../types";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>("Want to Read");
  const [ownershipStatus, setOwnershipStatus] = useState<OwnershipStatus>("Not Owned");

  const search = async () => {
    setLoading(true);
    const books = await bookService.searchBooks(query);
    setResults(books);
    setLoading(false);
  };

  const save = async (book: Book) => {
    try {
      await bookService.saveBook(book, { readingStatus, ownershipStatus });
      setToast(`${book.title} was added to your library.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not save this book.");
    }
    window.setTimeout(() => setToast(""), 2600);
  };

  return (
    <div>
      <PageHeader eyebrow="Search and add" title="Find the next book for your shelf." description="Search by title, author, or ISBN. Barcode, cover scan, and bookshelf photo scan are staged as future capture flows." />
      <div className="cozy-card">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-mocha/60" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && search()} placeholder="Search title, author, or ISBN" className="w-full rounded-2xl border-0 bg-white/70 py-3 pl-11 pr-4 font-semibold outline-none dark:bg-white/10" />
          </div>
          <button type="button" onClick={search} className="btn-primary">Search</button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            [Barcode, "ISBN scanner"],
            [Camera, "Barcode camera"],
            [ImagePlus, "Cover scan"],
            [Plus, "Manual add"],
          ].map(([Icon, label]) => (
            <button key={label as string} className="btn-soft justify-start"><Icon size={18} />{label as string}</button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select value={readingStatus} onChange={(event) => setReadingStatus(event.target.value as ReadingStatus)} className="rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10">
            {readingStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select value={ownershipStatus} onChange={(event) => setOwnershipStatus(event.target.value as OwnershipStatus)} className="rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10">
            {ownershipStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
      </div>
      {toast && <div className="fixed right-5 top-5 z-50 rounded-2xl bg-espresso px-5 py-3 font-bold text-cream shadow-glow dark:bg-gold dark:text-espresso">{toast}</div>}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {loading && Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
        {!loading && results.map((book) => {
          const quickTags = tropeDetectionService.infer(book.description, book.categories);
          return (
            <div key={book.id} className="relative">
              <BookCard item={book} />
              <div className="cozy-card mt-2">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-mocha/70 dark:text-gold">Quick metadata tags</p>
                <TropeChips items={[...quickTags.tropes, ...quickTags.moods].slice(0, 6)} />
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => save(book)} className="btn-primary w-full">Save and populate profile</button>
                  <Link to={`/books/${book.id}`} className="btn-soft w-full">Preview detail</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
