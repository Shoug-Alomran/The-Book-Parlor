import { Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { GenreRatingTemplate } from "../components/GenreRatingTemplate";
import { PageHeader } from "../components/PageHeader";
import { ratingGenres } from "../data/ratingTemplates";
import { ratingService } from "../services/ratingService";
import type { RatingGenre } from "../types";

export function RatingPage() {
  const { bookId = "demo-1" } = useParams();
  const [genre, setGenre] = useState<RatingGenre>("Romantasy");
  const [saved, setSaved] = useState(false);
  const initial = useMemo(() => ratingService.buildEmptyRating(bookId, genre), [bookId, genre]);
  const [values, setValues] = useState(initial.ratingData);

  const changeGenre = (next: RatingGenre) => {
    setGenre(next);
    setValues(ratingService.buildEmptyRating(bookId, next).ratingData);
  };

  return (
    <div>
      <PageHeader eyebrow="Rating parlor" title="Make the rating match the book." description="Choose a genre template, then tap icons for spice, tears, tension, comfort, magic, fear, humor, and everything that made the book feel alive." />
      <div className="cozy-card mb-5">
        <select value={genre} onChange={(event) => changeGenre(event.target.value as RatingGenre)} className="w-full rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10 md:max-w-md">
          {ratingGenres.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <GenreRatingTemplate genre={genre} values={values} onChange={(field, value) => setValues((current) => ({ ...current, [field]: value, Overall: field === "Overall" ? value : current.Overall }))} />
      <div className="cozy-card mt-5 grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 font-bold"><input type="checkbox" defaultChecked className="h-5 w-5 accent-mocha" /> Would read again</label>
        <label className="flex items-center gap-3 font-bold"><input type="checkbox" className="h-5 w-5 accent-mocha" /> Mark as DNF</label>
        <textarea placeholder="Public review" className="min-h-28 rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10 md:col-span-2" />
        <textarea placeholder="Private notes, annotations, or unhinged feelings" className="min-h-28 rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10 md:col-span-2" />
        <button type="button" onClick={() => setSaved(true)} className="btn-primary md:col-span-2"><Save size={18} />Save rating</button>
        {saved && <p className="rounded-2xl bg-sage/20 p-3 text-sm font-bold md:col-span-2">Saved in demo mode. With Supabase connected, this writes to ratings, reviews, and user_books.</p>}
      </div>
    </div>
  );
}
