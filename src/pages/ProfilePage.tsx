import { Award, MessageSquare, Star } from "lucide-react";
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

  return (
    <div>
      <PageHeader eyebrow="Profile" title={email ? email.split("@")[0] : "Your reader profile"} description="Favorite genres, public shelves, public bookcases, reviews, comments, reading goals, year in books, and badges live here." />
      <section className="cozy-card mb-5 grid gap-5 md:grid-cols-[160px_1fr]">
        <div className="grid h-40 w-40 place-items-center rounded-3xl bg-gradient-to-br from-rose to-gold font-serif text-5xl font-bold text-espresso">PR</div>
        <div>
          <h2 className="font-serif text-4xl font-bold">{email || "Create an account to personalize this room"}</h2>
          <p className="mt-3 leading-7 text-espresso/70 dark:text-cream/70">Your shelves and bookcases fill from the books you add after logging in.</p>
          <div className="mt-4"><TropeChips items={["Fantasy", "Romance", "Dark Academia", "Cozy Mystery"]} /></div>
        </div>
      </section>
      <section className="mb-5 grid gap-4 md:grid-cols-3">
        {[["Dragon Tamer", Award], ["Emotionally Destroyed", Star], ["Quote Collector", MessageSquare]].map(([label, Icon]) => <article key={label as string} className="cozy-card flex items-center gap-3"><Icon className="text-gold" /><span className="font-bold">{label as string}</span></article>)}
      </section>
      <BookcaseShelf bookcase={defaultBookcases[1]} books={books.filter((item) => item.ownershipStatus === "Purchased / Physically Owned")} />
    </div>
  );
}
