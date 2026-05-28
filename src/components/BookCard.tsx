import { motion } from "framer-motion";
import { BookOpenCheck, Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import type { Book, UserBook } from "../types";
import { TropeChips } from "./TropeChips";

type Props = {
  item: UserBook | Book;
  compact?: boolean;
};

const isUserBook = (item: UserBook | Book): item is UserBook => "book" in item;

export function BookCard({ item, compact = false }: Props) {
  const book = isUserBook(item) ? item.book : item;
  const status = isUserBook(item) ? item.readingStatus : undefined;
  const ownership = isUserBook(item) ? item.ownershipStatus : undefined;
  return (
    <motion.article whileHover={{ y: -5 }} className="cozy-card overflow-hidden p-0">
      <Link to={`/books/${book.id}`} className="grid h-full grid-cols-[96px_1fr] gap-4 p-4 sm:grid-cols-[120px_1fr]">
        <div className="aspect-[2/3] overflow-hidden rounded-xl bg-mocha/20 shadow-lg">
          {book.coverUrl ? <img src={book.coverUrl} alt={`${book.title} cover`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center p-3 text-center font-serif text-sm font-bold">{book.title}</div>}
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-serif text-xl font-bold leading-tight text-espresso dark:text-cream">{book.title}</h3>
          <p className="mt-1 text-sm font-semibold text-mocha/75 dark:text-cream/65">{book.authors.join(", ")}</p>
          {!compact && <p className="mt-3 line-clamp-3 text-sm leading-6 text-espresso/65 dark:text-cream/65">{book.description}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            {status && <span className="chip"><BookOpenCheck size={13} />{status}</span>}
            {ownership?.includes("Purchased") && <span className="chip"><ShoppingBag size={13} />Purchased</span>}
            {isUserBook(item) && item.isFavorite && <span className="chip"><Heart size={13} />Favorite</span>}
          </div>
          {!compact && <div className="mt-3"><TropeChips items={book.tropes.slice(0, 3)} /></div>}
        </div>
      </Link>
    </motion.article>
  );
}
