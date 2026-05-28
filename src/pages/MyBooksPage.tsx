import { useEffect, useMemo, useState } from "react";
import { BookCard } from "../components/BookCard";
import { PageHeader } from "../components/PageHeader";
import { ownershipStatuses, readingStatuses } from "../data/constants";
import { bookService } from "../services/bookService";
import type { OwnershipStatus, ReadingStatus, UserBook } from "../types";

export function MyBooksPage() {
  const [books, setBooks] = useState<UserBook[]>([]);
  const [reading, setReading] = useState<ReadingStatus | "All">("All");
  const [ownership, setOwnership] = useState<OwnershipStatus | "All">("All");
  useEffect(() => { bookService.getUserBooks().then(setBooks); }, []);
  const filtered = useMemo(() => books.filter((item) => (reading === "All" || item.readingStatus === reading) && (ownership === "All" || item.ownershipStatus === ownership)), [books, reading, ownership]);

  return (
    <div>
      <PageHeader eyebrow="My Books" title="A library with feelings." description="Reading status and ownership live separately, so purchased-but-unread and read-but-not-owned both make perfect sense." />
      <div className="cozy-card mb-5 grid gap-3 md:grid-cols-2">
        <select value={reading} onChange={(event) => setReading(event.target.value as ReadingStatus | "All")} className="rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10">
          <option>All</option>
          {readingStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        <select value={ownership} onChange={(event) => setOwnership(event.target.value as OwnershipStatus | "All")} className="rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10">
          <option>All</option>
          {ownershipStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((book) => <BookCard key={book.id} item={book} />)}
      </div>
      {!filtered.length && (
        <section className="cozy-card mt-5 text-center">
          <h2 className="font-serif text-3xl font-bold">Your library is ready for its first book.</h2>
          <p className="mt-3 text-espresso/70 dark:text-cream/70">Log in, search for a title, then save it with reading and ownership statuses.</p>
        </section>
      )}
    </div>
  );
}
