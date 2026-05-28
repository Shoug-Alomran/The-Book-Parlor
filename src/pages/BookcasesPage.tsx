import { Grid3X3, Plus, Rows3, SquareStack } from "lucide-react";
import { useEffect, useState } from "react";
import { BookcaseShelf } from "../components/BookcaseShelf";
import { PageHeader } from "../components/PageHeader";
import { bookcaseService } from "../services/bookcaseService";
import { bookService } from "../services/bookService";
import type { Bookcase, UserBook } from "../types";

type Mode = "spine" | "cover" | "grid" | "cozy";

export function BookcasesPage() {
  const [books, setBooks] = useState<UserBook[]>([]);
  const [cases, setCases] = useState<Bookcase[]>([]);
  const [mode, setMode] = useState<Mode>("cozy");
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    theme: "cafe" as Bookcase["theme"],
    shelfColor: "#7B5138",
    background: "warm plaster",
    decor: "plants, candles, coffee cup",
    visibility: "private" as Bookcase["visibility"],
  });

  const load = async () => {
    const [nextBooks, nextCases] = await Promise.all([bookService.getUserBooks(), bookcaseService.getBookcases()]);
    setBooks(nextBooks);
    setCases(nextCases);
  };

  useEffect(() => { load(); }, []);

  const createCase = async () => {
    try {
      if (!form.name.trim()) throw new Error("Give your bookcase a name first.");
      await bookcaseService.createBookcase({
        ...form,
        decor: form.decor.split(",").map((item) => item.trim()).filter(Boolean),
      });
      setFormOpen(false);
      setMessage("Bookcase created.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create bookcase.");
    }
    window.setTimeout(() => setMessage(""), 2600);
  };

  return (
    <div>
      <PageHeader eyebrow="Bookcases" title="Your cozy visual shelves." description="Create your own bookcases, keep default Purchased/Read/TBR cases, and view books as spines, covers, grids, or cozy shelves." action={<button type="button" onClick={() => setFormOpen((value) => !value)} className="btn-primary"><Plus size={18} />Create bookcase</button>} />
      {message && <div className="fixed right-5 top-5 z-50 rounded-2xl bg-espresso px-5 py-3 font-bold text-cream shadow-glow dark:bg-gold dark:text-espresso">{message}</div>}
      <div className="cozy-card mb-5 grid gap-4">
        <div className="flex flex-wrap gap-2">
          {(["cozy", "spine", "cover", "grid"] as Mode[]).map((item) => (
            <button key={item} type="button" onClick={() => setMode(item)} className={mode === item ? "btn-primary" : "btn-soft"}>
              {item === "grid" ? <Grid3X3 size={18} /> : item === "cover" ? <SquareStack size={18} /> : <Rows3 size={18} />}
              {item}
            </button>
          ))}
        </div>
        {formOpen && (
          <div className="grid gap-3 md:grid-cols-2">
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Bookcase name" className="rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10" />
            <select value={form.theme} onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value as Bookcase["theme"] }))} className="rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10">
              <option value="cafe">Cafe</option>
              <option value="dark-academia">Dark academia</option>
              <option value="fantasy-forest">Fantasy forest</option>
              <option value="cozy-library">Cozy library</option>
            </select>
            <input value={form.shelfColor} onChange={(event) => setForm((current) => ({ ...current, shelfColor: event.target.value }))} placeholder="#7B5138" className="rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10" />
            <input value={form.background} onChange={(event) => setForm((current) => ({ ...current, background: event.target.value }))} placeholder="Background/wallpaper" className="rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10" />
            <input value={form.decor} onChange={(event) => setForm((current) => ({ ...current, decor: event.target.value }))} placeholder="plants, candles, fairy lights" className="rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10" />
            <select value={form.visibility} onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value as Bookcase["visibility"] }))} className="rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10">
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
            <button type="button" onClick={createCase} className="btn-primary md:col-span-2">Save custom bookcase</button>
          </div>
        )}
      </div>
      <div className="grid gap-6">
        {cases.map((bookcase) => <BookcaseShelf key={bookcase.id} bookcase={bookcase} books={bookcaseService.booksForCase(bookcase, books)} mode={mode} />)}
      </div>
    </div>
  );
}
