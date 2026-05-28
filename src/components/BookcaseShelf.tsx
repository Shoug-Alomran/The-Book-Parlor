import { Coffee, Flame, Leaf, Sparkles } from "lucide-react";
import type { Bookcase, UserBook } from "../types";
import { BookSpine } from "./BookSpine";

type Props = {
  bookcase: Bookcase;
  books: UserBook[];
  mode?: "spine" | "cover" | "grid" | "cozy";
};

const decorIcons = {
  plants: Leaf,
  candles: Flame,
  "fairy lights": Sparkles,
  "coffee cup": Coffee,
  "coffee cup decor": Coffee,
  "cat decor": Sparkles,
  "seasonal decorations": Sparkles,
};

export function BookcaseShelf({ bookcase, books, mode = "cozy" }: Props) {
  const DecorOne = decorIcons[bookcase.decor[0] as keyof typeof decorIcons] ?? Coffee;
  const DecorTwo = decorIcons[bookcase.decor[1] as keyof typeof decorIcons] ?? Sparkles;
  return (
    <section className="rounded-3xl border border-white/40 bg-gradient-to-br from-white/60 to-linen/60 p-5 shadow-glow backdrop-blur-xl dark:border-white/10 dark:from-white/10 dark:to-white/5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold text-espresso dark:text-cream">{bookcase.name}</h2>
          <p className="text-sm font-semibold text-mocha/70 dark:text-cream/60">{bookcase.theme.replace("-", " ")} · {bookcase.visibility}</p>
        </div>
        <div className="flex gap-2 text-mocha dark:text-gold">
          <DecorOne />
          <DecorTwo />
        </div>
      </div>
      <div className="rounded-2xl p-4 shadow-shelf" style={{ backgroundColor: bookcase.shelfColor }}>
        <div className={`flex min-h-52 items-end gap-2 overflow-x-auto rounded-2xl bg-black/10 px-4 pt-8 ${mode === "grid" || mode === "cover" ? "flex-wrap" : ""}`}>
          {books.length ? books.map((item, index) => <BookSpine key={item.id} item={item} index={index} mode={mode} />) : <p className="m-auto max-w-xs text-center font-serif text-2xl font-bold text-cream/80">This shelf is waiting for its first perfect book.</p>}
        </div>
      </div>
    </section>
  );
}
