import { BookPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { BookcaseShelf } from "../components/BookcaseShelf";
import { PageHeader } from "../components/PageHeader";
import { TropeChips } from "../components/TropeChips";
import { defaultBookcases } from "../data/constants";
import { bookService } from "../services/bookService";
import { authService } from "../services/authService";
import type { UserBook } from "../types";

export function ProfilePage() {
  const [books, setBooks] = useState<UserBook[]>([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    bookService.getUserBooks().then(setBooks);
    authService.getUser().then((user) => setEmail(user?.email ?? ""));
  }, []);

  const favoriteGenres = Array.from(new Set(books.flatMap((item) => item.book.categories))).slice(0, 4);
  const achievements = earnedAchievements(books);

  return (
    <div>
      <PageHeader eyebrow="Profile" title={email ? email.split("@")[0] : "Your reader profile"} description="Favorite genres, public shelves, public bookcases, reviews, comments, reading goals, year in books, and badges live here." />
      <section className="cozy-card mb-5 grid gap-5 md:grid-cols-[160px_1fr]">
        <div className="grid h-40 w-40 place-items-center rounded-3xl bg-gradient-to-br from-rose to-gold font-serif text-5xl font-bold text-espresso">PR</div>
        <div>
          <h2 className="font-serif text-4xl font-bold">{email || "Create an account to personalize this room"}</h2>
          <p className="mt-3 leading-7 text-espresso/70 dark:text-cream/70">Your shelves and bookcases fill from the books you add after logging in.</p>
          <div className="mt-4">{favoriteGenres.length ? <TropeChips items={favoriteGenres} /> : <Link to="/search" className="btn-primary"><BookPlus size={18} />Add your first book</Link>}</div>
        </div>
      </section>
      <section className="cozy-card mb-5">
        <h2 className="font-serif text-3xl font-bold">Achievements</h2>
        {achievements.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {achievements.map((badge) => <div key={badge} className="rounded-2xl bg-white/55 p-4 font-bold dark:bg-white/10">{badge}</div>)}
          </div>
        ) : (
          <p className="mt-2 text-sm font-bold text-espresso/70 dark:text-cream/70">Badges will unlock from your real reading activity.</p>
        )}
      </section>
      <BookcaseShelf bookcase={defaultBookcases[1]} books={books.filter((item) => item.ownershipStatus === "Purchased / Physically Owned")} />
    </div>
  );
}

function earnedAchievements(books: UserBook[]) {
  const fantasyReads = books.filter((item) => item.readingStatus === "Read" && item.book.categories.some((genre) => /fantasy/i.test(genre))).length;
  const slowBurnReads = books.filter((item) => item.readingStatus === "Read" && item.book.tropes.some((trope) => /slow burn/i.test(trope))).length;
  const ownedUnread = books.filter((item) => item.ownershipStatus === "Purchased / Physically Owned" && item.readingStatus !== "Read").length;
  return [
    fantasyReads >= 15 ? "Dragon Tamer" : "",
    slowBurnReads >= 20 ? "Slow Burn Survivor" : "",
    ownedUnread >= 100 ? "Book Hoarder" : "",
    books.some((item) => item.isFavorite) ? "Shelf Curator" : "",
  ].filter(Boolean);
}
