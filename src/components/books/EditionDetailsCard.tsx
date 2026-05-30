import { BookCopy } from "lucide-react";
import type { Book, BookEdition, SourcedFact } from "../../types";

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
  const sourceFacts = (metadata.fact_sources ?? {}) as Record<string, SourcedFact | undefined>;
  const rows = [
    { label: "Edition title", value: current.editionTitle },
    { label: "Format", value: current.format ?? "Not confirmed yet", source: sourceFacts.format },
    { label: "ISBN-10", value: current.isbn10 ?? "Not listed for this edition", source: sourceFacts.isbn10 },
    { label: "ISBN-13", value: current.isbn13 ?? "Not listed for this edition", source: sourceFacts.isbn13 },
    { label: "Page count", value: pageCountVaries && !current.pageCount ? "Page count varies by edition" : current.pageCount?.toString() ?? "Not confirmed yet", source: sourceFacts.pageCount },
    { label: "Language", value: current.language ? languageLabel(current.language) : "Not confirmed yet", source: sourceFacts.language },
    { label: "Publisher", value: current.publisher ?? "Not confirmed yet", source: sourceFacts.publisher },
    { label: "Published date", value: current.publishedDate ?? current.publishedYear?.toString() ?? "Not confirmed yet", source: sourceFacts.publishedDate },
    { label: "Series", value: book.seriesName ? `${book.seriesPosition ? `Book ${book.seriesPosition} in ` : ""}${book.seriesName}` : book.importedMetadata?.ai_series_status ? String(book.importedMetadata.ai_series_status) : "No confirmed series yet", source: sourceFacts.seriesName },
    { label: "Source", value: sourceLabel(current.source) },
  ];
  return (
    <section className="cozy-card">
      <div className="mb-4 flex items-center gap-3">
        <BookCopy size={22} />
        <h2 className="font-serif text-3xl font-bold">Edition details</h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl bg-white/55 p-3 dark:bg-white/10">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-mocha/70 dark:text-cream/60">{row.label}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 font-bold">
              <span>{row.value}</span>
              {row.source && <SourceBadge fact={row.source} />}
            </div>
            {needsManualEdit(row.value) && <div className="mt-2 text-xs font-bold text-mocha/60 dark:text-cream/55">Manual edit available</div>}
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

function SourceBadge({ fact }: { fact: SourcedFact }) {
  const label = `Source: ${fact.source}`;
  const className = "rounded-full bg-sage/20 px-2 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-mocha/70 dark:bg-sage/30 dark:text-cream/70";
  if (fact.sourceUrl) {
    return <a href={fact.sourceUrl} target="_blank" rel="noreferrer" className={className}>{label}</a>;
  }
  return <span className={className}>{label}</span>;
}

function EditionRow({ edition, current = false, switching = false, onSwitch }: { edition: BookEdition; current?: boolean; switching?: boolean; onSwitch?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/55 p-4 dark:bg-white/10">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {edition.coverUrl && <img src={edition.coverUrl} alt="" className="h-20 w-14 rounded-lg object-cover shadow" />}
        <div className="min-w-0">
        <div className="font-bold">{current ? "Current edition" : edition.editionTitle}</div>
        <div className="mt-1 text-sm font-semibold text-mocha/70 dark:text-cream/65">
          {[edition.format, edition.isbn13 ? `ISBN-13 ${edition.isbn13}` : edition.isbn10 ? `ISBN-10 ${edition.isbn10}` : undefined, edition.publisher, edition.publishedDate ?? edition.publishedYear, edition.pageCount ? `${edition.pageCount} pages` : undefined, edition.language ? languageLabel(edition.language) : undefined].filter(Boolean).join(" · ") || "Edition details are still being checked"}
        </div>
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

function languageLabel(value: string) {
  const language = value.toLowerCase();
  if (["eng", "en", "english"].includes(language)) return "English";
  if (["spa", "es", "spanish"].includes(language)) return "Spanish";
  return value;
}

function needsManualEdit(value: string | number) {
  return typeof value === "string" && (value.startsWith("Not ") || value.startsWith("No confirmed"));
}
