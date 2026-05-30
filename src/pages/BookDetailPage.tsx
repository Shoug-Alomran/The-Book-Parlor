import { BookMarked, Bug, MessageCircle, RefreshCw, ShoppingBag, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CommentsSection } from "../components/CommentsSection";
import { PageHeader } from "../components/PageHeader";
import { ReadingStatusControls } from "../components/ReadingStatusControls";
import { ReviewsSection } from "../components/ReviewsSection";
import { TropeChips } from "../components/TropeChips";
import { EditionDetailsCard } from "../components/books/EditionDetailsCard";
import { MetadataStatusCard } from "../components/books/MetadataStatusCard";
import { bookService } from "../services/bookService";
import { bookEnrichmentService } from "../services/bookEnrichmentService";
import { communityRatingService, type CommunityRatingBreakdown } from "../services/communityRatingService";
import { commentService } from "../services/commentService";
import { reviewService } from "../services/reviewService";
import type { Book, BookAIDebugInfo, BookAISuggestion, BookEdition, Comment, Review, UserBook } from "../types";

export function BookDetailPage() {
  const { bookId = "" } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userBook, setUserBook] = useState<UserBook>();
  const [aiSuggestions, setAISuggestions] = useState<BookAISuggestion[]>([]);
  const [aiDebug, setAIDebug] = useState<BookAIDebugInfo>();
  const [ratingBreakdown, setRatingBreakdown] = useState<CommunityRatingBreakdown>({ type: "none", sourceLabel: "No ratings yet" });
  const [editions, setEditions] = useState<BookEdition[]>([]);
  const [toast, setToast] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [savingAction, setSavingAction] = useState<"shelf" | "purchased" | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentFailed, setEnrichmentFailed] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [switchingEditionId, setSwitchingEditionId] = useState<string>();
  useEffect(() => {
    bookService.getBook(bookId).then((nextBook) => {
      setBook(nextBook);
      if (nextBook) {
        bookEnrichmentService.listEditions(nextBook).then(setEditions).catch(() => setEditions([]));
        if (needsEnrichment(nextBook)) runAutomaticEnrichment(nextBook);
      }
    });
    bookService.getUserBookForBook(bookId).then(setUserBook).catch(() => setUserBook(undefined));
    bookEnrichmentService.listAISuggestions(bookId).then(setAISuggestions);
    communityRatingService.getCommunityRatingBreakdown(bookId).then(setRatingBreakdown).catch(() => setRatingBreakdown({ type: "none", sourceLabel: "No ratings yet" }));
    reviewService.listForBook(bookId).then(setReviews);
    commentService.listForBook(bookId).then(setComments);
  }, [bookId]);

  const saveToLibrary = async (action: "shelf" | "purchased") => {
    if (!book) return;
    try {
      setSavingAction(action);
      const savedBook = await bookService.saveBook(book, {
        readingStatus: action === "shelf" ? "Want to Read" : undefined,
        ownershipStatus: action === "purchased" ? "Purchased / Physically Owned" : undefined,
      });
      bookService.getUserBookForBook(savedBook.id).then(setUserBook).catch(() => setUserBook(undefined));
      showToast(action === "purchased" ? "Marked as purchased and added to your library." : "Added to your Want to Read shelf.", "success");
    } catch (error) {
      const code = error instanceof Error ? error.message : "save_failed";
      console.error("Book Parlor shelf action failed", error);
      const message = code === "auth_required"
        ? "Sign in to add books to your reading room."
        : code === "profile_unavailable"
          ? "Your account is signed in, but your reader profile is not ready yet. Please refresh and try again."
          : code === "book_save_failed"
            ? "We could not save this book’s metadata. Please search for the book again and try adding it from Search."
            : code === "library_save_failed"
              ? "We could not add this book to your library. Please make sure the Supabase migrations are applied."
          : "We could not update your shelf just now. Please try again.";
      showToast(message, "error");
    } finally {
      setSavingAction(null);
    }
  };

  const showToast = (text: string, tone: "success" | "error") => {
    setToast({ text, tone });
    window.setTimeout(() => setToast(null), 3000);
  };

  const runAutomaticEnrichment = async (targetBook = book) => {
    if (!targetBook || enriching) return;
    try {
      setEnriching(true);
      setEnrichmentFailed(false);
      setLoadingMessage("Fetching book details...");
      window.setTimeout(() => setLoadingMessage("Checking editions..."), 700);
      window.setTimeout(() => setLoadingMessage("Looking for series information..."), 1400);
      const result = await bookEnrichmentService.enrichBook(targetBook);
      setBook(result.book);
      setAISuggestions(result.suggestions);
      setAIDebug(result.ai.debug);
      bookEnrichmentService.listEditions(result.book).then(setEditions).catch(() => setEditions([]));
    } catch (error) {
      console.error("Book Parlor enrichment failed", error);
      setEnrichmentFailed(true);
    } finally {
      setEnriching(false);
      setLoadingMessage("");
    }
  };

  const rerunAIDetection = async () => {
    if (!book) return;
    try {
      setEnriching(true);
      setLoadingMessage("Rerunning AI detection...");
      const result = await bookEnrichmentService.rerunAIDetection(book);
      setBook(result.book);
      setAISuggestions(result.suggestions);
      setAIDebug(result.ai.debug);
      showToast(result.ai.detectionUnavailable ? "AI detection unavailable." : "AI detection rerun complete.", result.ai.detectionUnavailable ? "error" : "success");
    } catch (error) {
      console.error("Book Parlor AI rerun failed", error);
      showToast("We could not rerun AI detection just now.", "error");
    } finally {
      setEnriching(false);
      setLoadingMessage("");
    }
  };

  const createReview = async (input: { title: string; body: string; hasSpoilers: boolean }) => {
    if (!book) return;
    try {
      await reviewService.createReview({ bookId: book.id, ...input });
      setReviews(await reviewService.listForBook(book.id));
      showToast("Review posted.", "success");
    } catch {
      showToast("Sign in before posting a review.", "error");
    }
  };

  const createComment = async (input: { body: string; hasSpoilers: boolean }) => {
    if (!book) return;
    try {
      await commentService.createComment({ bookId: book.id, ...input });
      setComments(await commentService.listForBook(book.id));
      showToast("Comment posted.", "success");
    } catch {
      showToast("Sign in before posting a comment.", "error");
    }
  };

  const switchEdition = async (edition: BookEdition) => {
    if (!book) return;
    try {
      setSwitchingEditionId(edition.id);
      const currentUserBook = userBook ?? await createUserBookForEdition(book);
      const savedEdition = edition.databaseId ? edition : await bookEnrichmentService.saveEdition(book, edition);
      const next = await bookService.updateUserBook(currentUserBook.id, { selectedEdition: savedEdition });
      setUserBook(next);
      showToast("Your saved edition was updated.", "success");
    } catch (error) {
      console.error("Book Parlor edition switch failed", error);
      const message = error instanceof Error && error.message === "edition_schema_missing"
        ? "Edition switching needs the latest Supabase migrations applied."
        : "We could not switch editions just now.";
      showToast(message, "error");
    } finally {
      setSwitchingEditionId(undefined);
    }
  };

  if (!book) return <PageHeader title="Book not found" description="Try searching for it, then add it to your parlor." />;

  return (
    <div>
      {toast && (
        <div className={`fixed right-5 top-5 z-50 rounded-2xl px-5 py-3 text-sm font-bold shadow-glow ${toast.tone === "success" ? "bg-espresso text-cream dark:bg-gold dark:text-espresso" : "bg-rose text-espresso"}`}>
          {toast.text}
          {toast.tone === "error" && toast.text.startsWith("Sign in") && <button type="button" onClick={() => navigate("/auth")} className="ml-3 underline">Sign in</button>}
        </div>
      )}
      <PageHeader eyebrow="Book detail" title={book.title} description={book.authors.join(", ")} action={<Link to={`/books/${book.id}/rate`} className="btn-primary"><Star size={18} />Rate this book</Link>} />
      {(enriching || enrichmentFailed) && (
        <section className="cozy-card mb-6">
          <p className="font-bold">{enriching ? loadingMessage || "Fetching book details..." : "Automatic metadata fetch did not finish."}</p>
          {enrichmentFailed && <button type="button" onClick={() => runAutomaticEnrichment()} className="btn-soft mt-3">Retry metadata fetch</button>}
        </section>
      )}
      {userBook ? (
        <div className="mb-6">
          <ReadingStatusControls userBook={userBook} onChange={setUserBook} />
        </div>
      ) : (
        <section className="cozy-card mb-6">
          <h2 className="font-serif text-2xl font-bold">Add this book to start tracking it.</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={savingAction !== null} onClick={() => saveToLibrary("shelf")} className="btn-primary disabled:opacity-60"><BookMarked size={18} />Want to Read</button>
            <button type="button" disabled={savingAction !== null} onClick={() => saveToLibrary("purchased")} className="btn-soft disabled:opacity-60"><ShoppingBag size={18} />Purchased</button>
          </div>
        </section>
      )}
      <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="cozy-card">
          <img src={book.coverUrl} alt={`${book.title} cover`} className="aspect-[2/3] w-full rounded-2xl object-cover shadow-2xl" />
          <div className="mt-4 grid gap-2">
            <button type="button" disabled={savingAction !== null} onClick={() => saveToLibrary("shelf")} className="btn-primary disabled:opacity-60"><BookMarked size={18} />{savingAction === "shelf" ? "Adding..." : "Add to shelf"}</button>
            <button type="button" disabled={savingAction !== null} onClick={() => saveToLibrary("purchased")} className="btn-soft disabled:opacity-60"><ShoppingBag size={18} />{savingAction === "purchased" ? "Saving..." : "Mark purchased"}</button>
          </div>
        </div>
        <div className="grid gap-5">
          <MetadataStatusCard book={book} loading={enriching} failed={enrichmentFailed} hasAISuggestions={aiSuggestions.length > 0 || Boolean(book.aiSummary)} onEnrich={() => runAutomaticEnrichment()} />
          <EditionDetailsCard book={book} selectedEdition={userBook?.selectedEdition} editions={editions} switchingEditionId={switchingEditionId} onSwitchEdition={switchEdition} />
          <section className="cozy-card">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <span className="chip"><Star size={14} />{ratingSummaryLabel(ratingBreakdown)}</span>
              <span className="chip"><MessageCircle size={14} />{reviews.length + comments.length} discussions</span>
              <span className="chip">{book.pageCount ?? "Unknown"} pages</span>
            </div>
            {hasUsefulDescription(book.description) ? (
              <p className="leading-8 text-espresso/75 dark:text-cream/75">{book.description}</p>
            ) : (
              <div className="rounded-2xl bg-gold/15 p-4">
                <h3 className="font-serif text-2xl font-bold">Description missing</h3>
                <p className="mt-2 text-espresso/70 dark:text-cream/70">{enriching ? "Fetching a description from Google Books and Open Library..." : "No factual description was found yet."}</p>
                {enrichmentFailed && <button type="button" onClick={() => runAutomaticEnrichment()} disabled={enriching} className="btn-primary mt-4">Retry metadata fetch</button>}
              </div>
            )}
            {book.aiSummary && (
              <div className="mt-4 rounded-2xl bg-white/55 p-4 dark:bg-white/10">
                <div className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-mocha/70 dark:text-gold">AI-suggested summary</div>
                <p className="leading-7 text-espresso/75 dark:text-cream/75">{book.aiSummary}</p>
              </div>
            )}
            <div className="mt-5 grid gap-4">
              <SeriesInfo book={book} />
              <div><h3 className="mb-2 font-bold">Genres</h3><TropeChips items={book.categories} /></div>
              <div><h3 className="mb-2 font-bold">Tropes {aiSuggestions.some((item) => item.fieldName === "tropes") && <span className="chip ml-2 bg-gold/20">AI inferred</span>}</h3><TropeChips items={book.tropes.length ? book.tropes : suggestionValues(aiSuggestions, "tropes", 0.75)} />{possibleSuggestionValues(aiSuggestions, "tropes").length > 0 && <div className="mt-2"><span className="mr-2 text-xs font-bold uppercase tracking-[0.14em] text-mocha/60">Possible</span><TropeChips items={possibleSuggestionValues(aiSuggestions, "tropes")} /></div>}</div>
              <div><h3 className="mb-2 font-bold">Moods {aiSuggestions.some((item) => item.fieldName === "moods") && <span className="chip ml-2 bg-gold/20">AI inferred</span>}</h3><TropeChips items={book.moods.length ? book.moods : suggestionValues(aiSuggestions, "moods", 0.75)} tone="mood" />{possibleSuggestionValues(aiSuggestions, "moods").length > 0 && <div className="mt-2"><span className="mr-2 text-xs font-bold uppercase tracking-[0.14em] text-mocha/60">Possible</span><TropeChips items={possibleSuggestionValues(aiSuggestions, "moods")} tone="mood" /></div>}</div>
              <div><h3 className="mb-2 font-bold">Content warnings</h3><TropeChips items={book.contentWarnings ?? []} tone="warning" /></div>
            </div>
          </section>
          <AIDebugPanel debug={aiDebug} suggestions={aiSuggestions} onRerun={rerunAIDetection} loading={enriching} />
          <RatingBreakdownCard breakdown={ratingBreakdown} bookId={book.id} />
        </div>
      </section>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ReviewsSection reviews={reviews} onCreate={createReview} />
        <CommentsSection comments={comments} onCreate={createComment} />
      </div>
    </div>
  );
}

function SeriesInfo({ book }: { book: Book }) {
  return (
    <div>
      <h3 className="mb-2 font-bold">Series information</h3>
      {book.seriesName ? (
        <span className="chip">Book {book.seriesPosition ?? "?"} in the {book.seriesName} series</span>
      ) : (
        <span className="chip">Series status unknown</span>
      )}
    </div>
  );
}

async function createUserBookForEdition(book: Book) {
  await bookService.saveBook(book, { readingStatus: "Want to Read" });
  const userBook = await bookService.getUserBookForBook(book.id);
  if (!userBook) throw new Error("library_save_failed");
  return userBook;
}

function needsEnrichment(book: Book) {
  return !hasUsefulDescription(book.description) || !book.pageCount || !book.isbn13 || !book.publisher || !book.openlibraryWorkKey || !book.tropes.length || !book.moods.length;
}

function suggestionValues(suggestions: BookAISuggestion[], fieldName: string, minConfidence = 0.5) {
  return suggestions
    .filter((suggestion) => suggestion.fieldName === fieldName && suggestion.confidence >= minConfidence)
    .map((suggestion) => Array.isArray(suggestion.suggestedValue) ? undefined : suggestion.suggestedValue.value)
    .filter(Boolean) as string[];
}

function possibleSuggestionValues(suggestions: BookAISuggestion[], fieldName: string) {
  return suggestions
    .filter((suggestion) => suggestion.fieldName === fieldName && suggestion.confidence >= 0.5 && suggestion.confidence < 0.75)
    .map((suggestion) => Array.isArray(suggestion.suggestedValue) ? undefined : suggestion.suggestedValue.value)
    .filter(Boolean) as string[];
}

function AIDebugPanel({ debug, suggestions, onRerun, loading }: { debug?: BookAIDebugInfo; suggestions: BookAISuggestion[]; onRerun: () => void; loading: boolean }) {
  const enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_AI_DEBUG === "true";
  if (!enabled) return null;
  return (
    <section className="cozy-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-serif text-3xl font-bold"><Bug size={22} />AI debug</h2>
        <button type="button" onClick={onRerun} disabled={loading} className="btn-soft"><RefreshCw size={17} className={loading ? "animate-spin" : ""} />Rerun AI detection</button>
      </div>
      <div className="grid gap-2 text-sm font-semibold md:grid-cols-2">
        <div className="rounded-2xl bg-white/55 p-3 dark:bg-white/10">OpenAI called: {debug?.openaiCalled ? "yes" : "no"}</div>
        <div className="rounded-2xl bg-white/55 p-3 dark:bg-white/10">Description length: {debug?.descriptionLength ?? 0}</div>
        <div className="rounded-2xl bg-white/55 p-3 dark:bg-white/10">Model: {debug?.model ?? "unknown"}</div>
        <div className="rounded-2xl bg-white/55 p-3 dark:bg-white/10">Fallback used: {debug?.fallbackUsed ? "yes" : "no"}</div>
        <div className="rounded-2xl bg-white/55 p-3 dark:bg-white/10">Saved trope count: {debug?.savedTropeCount ?? suggestions.filter((item) => item.fieldName === "tropes").length}</div>
        <div className="rounded-2xl bg-white/55 p-3 dark:bg-white/10">Error: {debug?.error ?? "none"}</div>
      </div>
      <pre className="mt-4 max-h-72 overflow-auto rounded-2xl bg-espresso p-4 text-xs text-cream">{JSON.stringify(debug?.returnedJson ?? {}, null, 2)}</pre>
    </section>
  );
}

function hasUsefulDescription(description?: string) {
  return Boolean(description && description.trim() && description !== "No description is available yet.");
}

function RatingBreakdownCard({ breakdown, bookId }: { breakdown: CommunityRatingBreakdown; bookId: string }) {
  if (breakdown.type === "internal") {
    return (
      <section className="cozy-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl font-bold">Book Parlor community rating breakdown</h2>
            <p className="mt-1 text-sm font-semibold text-mocha/70 dark:text-cream/65">{breakdown.totalRatings} reader rating{breakdown.totalRatings === 1 ? "" : "s"}</p>
          </div>
          <span className="chip bg-sage/20"><Star size={14} />Book Parlor community</span>
        </div>
        <div className="mb-4 rounded-2xl bg-white/55 p-4 dark:bg-white/10">
          <div className="flex justify-between text-sm font-bold"><span>Overall</span><span>{breakdown.overallAverage.toFixed(1)}</span></div>
          <div className="mt-2 h-2 rounded-full bg-mocha/10"><div className="h-2 rounded-full bg-gold" style={{ width: `${(breakdown.overallAverage / 5) * 100}%` }} /></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {breakdown.detailedAverages.filter((item) => item.label !== "Overall").map((metric) => (
            <div key={metric.label} className="rounded-2xl bg-white/55 p-3 dark:bg-white/10">
              <div className="flex justify-between text-sm font-bold"><span>{metric.label}</span><span>{metric.average.toFixed(1)}</span></div>
              <div className="mt-2 h-2 rounded-full bg-mocha/10"><div className="h-2 rounded-full bg-gold" style={{ width: `${(metric.average / 5) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (breakdown.type === "external") {
    return (
      <section className="cozy-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-3xl font-bold">External rating</h2>
          <span className="chip bg-gold/20"><Star size={14} />Imported from Google Books</span>
        </div>
        <div className="rounded-2xl bg-white/55 p-5 dark:bg-white/10">
          <p className="font-serif text-5xl font-bold">{breakdown.averageRating.toFixed(1)}</p>
          <p className="mt-2 text-sm font-semibold text-mocha/70 dark:text-cream/65">{breakdown.ratingsCount.toLocaleString()} Google Books rating{breakdown.ratingsCount === 1 ? "" : "s"}</p>
          <p className="mt-4 leading-6 text-espresso/70 dark:text-cream/70">Detailed Book Parlor ratings will appear once readers rate this book.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="cozy-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-3xl font-bold">No ratings yet</h2>
        <span className="chip">No ratings yet</span>
      </div>
      <p className="leading-6 text-espresso/70 dark:text-cream/70">Be the first to rate this book after finishing it.</p>
      <Link to={`/books/${bookId}/rate`} className="btn-primary mt-4">Be the first to rate</Link>
    </section>
  );
}

function ratingSummaryLabel(breakdown: CommunityRatingBreakdown) {
  if (breakdown.type === "internal") return `${breakdown.overallAverage.toFixed(1)} Book Parlor avg`;
  if (breakdown.type === "external") return `${breakdown.averageRating.toFixed(1)} external avg`;
  return "No ratings yet";
}
