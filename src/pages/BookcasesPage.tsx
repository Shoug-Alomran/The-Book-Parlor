import { Grid3X3, Rows3, SquareStack } from "lucide-react";
import { useEffect, useState } from "react";
import { BookcaseShelf } from "../components/BookcaseShelf";
import { PageHeader } from "../components/PageHeader";
import { bookcaseService } from "../services/bookcaseService";
import { bookService } from "../services/bookService";
import type { UserBook } from "../types";

type Mode = "spine" | "cover" | "grid" | "cozy";

export function BookcasesPage() {
  const [books, setBooks] = useState<UserBook[]>([]);
  const [mode, setMode] = useState<Mode>("cozy");
  useEffect(() => { bookService.getUserBooks().then(setBooks); }, []);
  const cases = bookcaseService.getBookcases();
  return (
    <div>
      <PageHeader eyebrow="Bookcases" title="Your cozy visual shelves." description="Purchased is a real ownership bookcase, not a reading status. Open it to see every physically owned book gathered in one warm shelf." />
      <div className="cozy-card mb-5 flex flex-wrap gap-2">
        {(["cozy", "spine", "cover", "grid"] as Mode[]).map((item) => (
          <button key={item} type="button" onClick={() => setMode(item)} className={mode === item ? "btn-primary" : "btn-soft"}>
            {item === "grid" ? <Grid3X3 size={18} /> : item === "cover" ? <SquareStack size={18} /> : <Rows3 size={18} />}
            {item}
          </button>
        ))}
      </div>
      <div className="grid gap-6">
        {cases.map((bookcase) => <BookcaseShelf key={bookcase.id} bookcase={bookcase} books={bookcaseService.booksForCase(bookcase, books)} mode={mode} />)}
      </div>
    </div>
  );
}
