import { Tags } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BookcaseShelf } from "../components/BookcaseShelf";
import { PageHeader } from "../components/PageHeader";
import { bookService } from "../services/bookService";
import type { Bookcase, UserBook } from "../types";

export function TropeBookcasePage() {
  const [books, setBooks] = useState<UserBook[]>([]);
  const [selectedTrope, setSelectedTrope] = useState<string>("All");

  useEffect(() => {
    bookService.getUserBooks().then(setBooks);
  }, []);

  const grouped = useMemo(() => {
    const groups = new Map<string, UserBook[]>();
    books.forEach((item) => {
      const tropes = item.book.tropes.length ? item.book.tropes : ["Unsorted"];
      tropes.forEach((trope) => groups.set(trope, [...(groups.get(trope) ?? []), item]));
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [books]);

  const visibleGroups = selectedTrope === "All" ? grouped : grouped.filter(([trope]) => trope === selectedTrope);

  return (
    <div>
      <PageHeader
        eyebrow="Trope bookcase"
        title="All your added books, sorted by trope."
        description="Every book you save lands here automatically, grouped into digital bookcases by its populated trope profile."
        action={<span className="btn-soft"><Tags size={18} />{books.length} saved books</span>}
      />
      <div className="cozy-card mb-5">
        <select value={selectedTrope} onChange={(event) => setSelectedTrope(event.target.value)} className="w-full rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10 md:max-w-sm">
          <option>All</option>
          {grouped.map(([trope]) => <option key={trope}>{trope}</option>)}
        </select>
      </div>
      <div className="grid gap-6">
        {visibleGroups.length ? visibleGroups.map(([trope, tropeBooks]) => {
          const bookcase: Bookcase = {
            id: `trope-${trope}`,
            name: trope === "Unsorted" ? "Unsorted Books" : `${titleCase(trope)} Bookcase`,
            type: "trope",
            theme: trope.includes("dark") ? "dark-academia" : trope.includes("fae") || trope.includes("fantasy") ? "fantasy-forest" : "cafe",
            shelfColor: trope.includes("dark") ? "#3B2922" : trope.includes("cozy") ? "#9C6B48" : "#7B5138",
            background: "trope wall",
            decor: ["fairy lights", "coffee cup"],
            visibility: "private",
            filterTrope: trope,
          };
          return <BookcaseShelf key={trope} bookcase={bookcase} books={tropeBooks} mode="cozy" />;
        }) : (
          <section className="cozy-card text-center">
            <h2 className="font-serif text-3xl font-bold">No trope shelves yet.</h2>
            <p className="mt-3 text-espresso/70 dark:text-cream/70">Add a book from Search and its book profile will populate here automatically.</p>
          </section>
        )}
      </div>
    </div>
  );
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
