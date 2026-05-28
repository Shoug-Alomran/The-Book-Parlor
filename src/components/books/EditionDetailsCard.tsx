import { BookCopy } from "lucide-react";
import type { Book, BookEdition } from "../../types";

type Props = {
  book: Book;
  selectedEdition?: BookEdition;
  editions?: BookEdition[];
  switchingEditionId?: string;
  onSwitchEdition?: (edition: BookEdition) => void;
};

export function EditionDetailsCard({ book, selectedEdition, editions = [], switchingEditionId, onSwitchEdition }: Props) {
  const metadata = book.importedMetadata ?? {};
  const pageCountVaries = Boolean(metadata.page_count_varies_by_edition || (metadata.enrichment_audit as any)?.page_count_varies_by_edition);
  const current = selectedEdition ?? bookToEdition(book);
  const rows = [
    ["Edition title", current.editionTitle],
    ["Format", current.format ?? "Unknown"],
    ["ISBN-10", current.isbn10 ?? "Unknown"],
    ["ISBN-13", current.isbn13 ?? "Unknown"],
    ["Page count", pageCountVaries && !current.pageCount ? "Page count varies by edition" : current.pageCount?.toString() ?? "Unknown"],
    ["Language", current.language ?? "Unknown"],
    ["Publisher", current.publisher ?? "Unknown"],
    ["Published date", current.publishedDate ?? current.publishedYear?.toString() ?? "Unknown"],
    ["Source", sourceLabel(current.source)],
  ];
  return (
    <section className="cozy-card">
      <div className="mb-4 flex items-center gap-3">
        <BookCopy size={22} />
        <h2 className="font-serif text-3xl font-bold">Edition details</h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white/55 p-3 dark:bg-white/10">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-mocha/70 dark:text-cream/60">{label}</div>
            <div className="mt-1 font-bold">{value}</div>
          </div>
        ))}
      </div>
      {pageCountVaries && <p className="mt-3 text-sm font-semibold text-mocha/70 dark:text-cream/65">You can track your own edition’s page count through reading progress.</p>}
      <div className="mt-6">
        <h3 className="font-serif text-2xl font-bold">Editions</h3>
        <p className="mt-1 text-sm font-semibold text-mocha/70 dark:text-cream/65">Switching editions updates your saved copy, not the global book record.</p>
        <div className="mt-4 grid gap-3">
          <EditionRow edition={current} current />
          {editions.filter((edition) => edition.id !== current.id).map((edition) => (
            <EditionRow
              key={edition.id}
              edition={edition}
              switching={switchingEditionId === edition.id}
              onSwitch={onSwitchEdition ? () => onSwitchEdition(edition) : undefined}
            />
          ))}
          {!editions.length && <div className="rounded-2xl bg-white/55 p-4 text-sm font-semibold text-mocha/75 dark:bg-white/10 dark:text-cream/70">No other editions found yet. Try enriching this book to check Open Library.</div>}
        </div>
      </div>
    </section>
  );
}

function EditionRow({ edition, current = false, switching = false, onSwitch }: { edition: BookEdition; current?: boolean; switching?: boolean; onSwitch?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/55 p-4 dark:bg-white/10">
      <div>
        <div className="font-bold">{current ? "Current edition" : edition.editionTitle}</div>
        <div className="mt-1 text-sm font-semibold text-mocha/70 dark:text-cream/65">
          {[edition.format, edition.publisher, edition.publishedDate ?? edition.publishedYear, edition.pageCount ? `${edition.pageCount} pages` : undefined].filter(Boolean).join(" · ") || "Edition details unavailable"}
        </div>
      </div>
      {current ? <span className="chip">Current edition</span> : <button type="button" onClick={onSwitch} className="btn-soft px-4">{switching ? "Switching..." : "Switch to this edition"}</button>}
    </div>
  );
}

function bookToEdition(book: Book): BookEdition {
  return {
    id: book.googleBooksId ? `google_books:${book.googleBooksId}` : book.openlibraryEditionKey ? `open_library:${book.openlibraryEditionKey}` : book.id,
    editionTitle: book.editionTitle ?? book.subtitle ?? book.title,
    format: book.format,
    isbn10: book.isbn10,
    isbn13: book.isbn13,
    pageCount: book.pageCount,
    language: book.language,
    publisher: book.publisher,
    publishedDate: book.publishedDate,
    publishedYear: book.publishedYear,
    coverUrl: book.coverUrl,
    source: book.source === "open_library" ? "open_library" : book.source === "manual" ? "manual" : "google_books",
    openlibraryEditionKey: book.openlibraryEditionKey,
    googleBooksId: book.googleBooksId,
  };
}

function sourceLabel(source: string) {
  if (source === "google_books") return "Google Books";
  if (source === "open_library") return "Open Library";
  return source;
}
