import { BookMarked, MessageCircle, ShoppingBag, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CommentsSection } from "../components/CommentsSection";
import { PageHeader } from "../components/PageHeader";
import { ReviewsSection } from "../components/ReviewsSection";
import { TropeChips } from "../components/TropeChips";
import { bookService } from "../services/bookService";
import { commentService } from "../services/commentService";
import { reviewService } from "../services/reviewService";
import type { Book, Comment, Review } from "../types";

export function BookDetailPage() {
  const { bookId = "" } = useParams();
  const [book, setBook] = useState<Book>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  useEffect(() => {
    bookService.getBook(bookId).then(setBook);
    reviewService.listForBook(bookId).then(setReviews);
    commentService.listForBook(bookId).then(setComments);
  }, [bookId]);

  if (!book) return <PageHeader title="Book not found" description="Try searching for it, then add it to your parlor." />;

  return (
    <div>
      <PageHeader eyebrow="Book detail" title={book.title} description={book.authors.join(", ")} action={<Link to={`/books/${book.id}/rate`} className="btn-primary"><Star size={18} />Rate this book</Link>} />
      <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="cozy-card">
          <img src={book.coverUrl} alt={`${book.title} cover`} className="aspect-[2/3] w-full rounded-2xl object-cover shadow-2xl" />
          <div className="mt-4 grid gap-2">
            <button className="btn-primary"><BookMarked size={18} />Add to shelf</button>
            <button className="btn-soft"><ShoppingBag size={18} />Mark purchased</button>
          </div>
        </div>
        <div className="grid gap-5">
          <section className="cozy-card">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <span className="chip"><Star size={14} />4.4 community avg</span>
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
          <section className="cozy-card">
            <h2 className="mb-3 font-serif text-3xl font-bold">Community rating breakdown</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {["Overall", "Emotional Damage", "Worldbuilding", "Romance", "Pacing", "Ending"].map((metric, index) => (
                <div key={metric} className="rounded-2xl bg-white/55 p-3 dark:bg-white/10">
                  <div className="flex justify-between text-sm font-bold"><span>{metric}</span><span>{(4.7 - index * 0.2).toFixed(1)}</span></div>
                  <div className="mt-2 h-2 rounded-full bg-mocha/10"><div className="h-2 rounded-full bg-gold" style={{ width: `${94 - index * 4}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ReviewsSection reviews={reviews} />
        <CommentsSection comments={comments} />
      </div>
    </div>
  );
}
