import { BookCopy } from "lucide-react";
import type { Book } from "../../types";

type Props = {
  book: Book;
};

export function EditionDetailsCard({ book }: Props) {
  const metadata = book.importedMetadata ?? {};
  const pageCountVaries = Boolean(metadata.page_count_varies_by_edition || (metadata.enrichment_audit as any)?.page_count_varies_by_edition);
  const rows = [
    ["Edition", editionName(book)],
    ["Format", "Set on your saved book"],
    ["Publisher", book.publisher ?? "Unknown"],
    ["Published year", book.publishedYear?.toString() ?? "Unknown"],
    ["ISBN", book.isbn13 ?? book.isbn10 ?? "Unknown"],
    ["Page count", pageCountVaries ? "Page count varies by edition" : book.pageCount?.toString() ?? "Unknown"],
    ["Source", sourceLabel(book.source)],
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
    </section>
  );
}

function editionName(book: Book) {
  const metadata = book.importedMetadata ?? {};
  const openLibrary = metadata.open_library as Record<string, unknown> | undefined;
  return String(openLibrary?.editionName ?? book.openlibraryEditionKey ?? "Default edition");
}

function sourceLabel(source: string) {
  if (source === "google_books") return "Google Books";
  if (source === "open_library") return "Open Library";
  return source;
}
