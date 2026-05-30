import { RefreshCw, Sparkles } from "lucide-react";
import type { Book } from "../../types";

type Props = {
  book: Book;
  loading?: boolean;
  failed?: boolean;
  hasAISuggestions?: boolean;
  onEnrich: () => void;
};

export function MetadataStatusCard({ book, loading = false, failed = false, hasAISuggestions = false, onEnrich }: Props) {
  const status = statusFor(book);
  const metadata = book.importedMetadata ?? {};
  const audit = metadata.enrichment_audit as Record<string, unknown> | undefined;
  const sources = audit?.factual_sources as string[] | undefined;
  return (
    <section className="cozy-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-mocha/70 dark:text-gold">Metadata status</p>
          <h2 className="mt-2 font-serif text-3xl font-bold">{status}</h2>
          <p className="mt-2 max-w-2xl leading-6 text-espresso/70 dark:text-cream/70">
            {status.includes("Missing") || status === "Needs enrichment"
              ? "Some factual edition details are still being checked. The AI book profile fills subjective reading details like tropes, moods, vibe, and summary."
              : "This book has enough metadata and reading-profile detail to feel at home in your parlor."}
          </p>
        </div>
        {(loading || failed) && (
          <button type="button" onClick={onEnrich} disabled={loading} className="btn-soft">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            {loading ? "Fetching..." : "Retry metadata fetch"}
          </button>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {sources?.includes("google_books") && <span className="chip">Imported from Google Books</span>}
        {sources?.includes("open_library") && <span className="chip">Imported from Open Library</span>}
        {hasAISuggestions && <span className="chip bg-gold/20"><Sparkles size={14} />AI populated</span>}
        {Boolean(metadata.manual_edits) && <span className="chip">Manually edited</span>}
      </div>
    </section>
  );
}

function statusFor(book: Book) {
  const missing: string[] = [];
  if (!book.description || book.description === "No description is available yet.") missing.push("Missing description");
  if (!book.pageCount) missing.push("Missing page count");
  if (!book.categories.length) missing.push("Missing genres");
  if (!missing.length) return "Complete";
  if (missing.length > 2) return "Needs enrichment";
  return missing.join(" · ");
}
