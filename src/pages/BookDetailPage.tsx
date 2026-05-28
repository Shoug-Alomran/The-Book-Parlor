import { BookMarked, MessageCircle, ShoppingBag, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CommentsSection } from "../components/CommentsSection";
import { PageHeader } from "../components/PageHeader";
import { ReviewsSection } from "../components/ReviewsSection";
import { TropeChips } from "../components/TropeChips";
import { bookService } from "../services/bookService";
import { communityRatingService, type CommunityRatingBreakdown } from "../services/communityRatingService";
import { commentService } from "../services/commentService";
import { reviewService } from "../services/reviewService";
import type { Book, Comment, Review } from "../types";

export function BookDetailPage() {
  const { bookId = "" } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ratingBreakdown, setRatingBreakdown] = useState<CommunityRatingBreakdown>({ type: "none", sourceLabel: "No ratings yet" });
  const [toast, setToast] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [savingAction, setSavingAction] = useState<"shelf" | "purchased" | null>(null);
  useEffect(() => {
    bookService.getBook(bookId).then(setBook);
    communityRatingService.getCommunityRatingBreakdown(bookId).then(setRatingBreakdown).catch(() => setRatingBreakdown({ type: "none", sourceLabel: "No ratings yet" }));
    reviewService.listForBook(bookId).then(setReviews);
    commentService.listForBook(bookId).then(setComments);
  }, [bookId]);

  const saveToLibrary = async (action: "shelf" | "purchased") => {
    if (!book) return;
    try {
      setSavingAction(action);
      await bookService.saveBook(book, {
        readingStatus: action === "shelf" ? "Want to Read" : undefined,
        ownershipStatus: action === "purchased" ? "Purchased / Physically Owned" : undefined,
      });
      showToast(action === "purchased" ? "Marked as purchased and added to your library." : "Added to your Want to Read shelf.", "success");
    } catch (error) {
      const code = error instanceof Error ? error.message : "save_failed";
      const message = code === "auth_required"
        ? "Sign in to add books to your reading room."
        : code === "profile_unavailable"
          ? "Your account is signed in, but your reader profile is not ready yet. Please refresh and try again."
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
      <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="cozy-card">
          <img src={book.coverUrl} alt={`${book.title} cover`} className="aspect-[2/3] w-full rounded-2xl object-cover shadow-2xl" />
          <div className="mt-4 grid gap-2">
            <button type="button" disabled={savingAction !== null} onClick={() => saveToLibrary("shelf")} className="btn-primary disabled:opacity-60"><BookMarked size={18} />{savingAction === "shelf" ? "Adding..." : "Add to shelf"}</button>
            <button type="button" disabled={savingAction !== null} onClick={() => saveToLibrary("purchased")} className="btn-soft disabled:opacity-60"><ShoppingBag size={18} />{savingAction === "purchased" ? "Saving..." : "Mark purchased"}</button>
          </div>
        </div>
        <div className="grid gap-5">
          <section className="cozy-card">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <span className="chip"><Star size={14} />{ratingSummaryLabel(ratingBreakdown)}</span>
              <span className="chip"><MessageCircle size={14} />{reviews.length + comments.length} discussions</span>
              <span className="chip">{book.pageCount ?? "Unknown"} pages</span>
            </div>
            <p className="leading-8 text-espresso/75 dark:text-cream/75">{book.description}</p>
            <div className="mt-5 grid gap-4">
              <div><h3 className="mb-2 font-bold">Genres</h3><TropeChips items={book.categories} /></div>
              <div><h3 className="mb-2 font-bold">Tropes</h3><TropeChips items={book.tropes} /></div>
              <div><h3 className="mb-2 font-bold">Moods</h3><TropeChips items={book.moods} tone="mood" /></div>
              <div><h3 className="mb-2 font-bold">Content warnings</h3><TropeChips items={book.contentWarnings ?? []} tone="warning" /></div>
            </div>
          </section>
          <RatingBreakdownCard breakdown={ratingBreakdown} bookId={book.id} />
        </div>
      </section>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ReviewsSection reviews={reviews} />
        <CommentsSection comments={comments} />
      </div>
    </div>
  );
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
