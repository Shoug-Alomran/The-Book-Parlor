import { ArrowDown, ArrowUp, BookOpen, Check, Film, Headphones, Monitor, Music, Save, Search, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GenreRatingTemplate } from "../components/GenreRatingTemplate";
import { PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { ReadingStatusControls } from "../components/ReadingStatusControls";
import { TropeChips } from "../components/TropeChips";
import { tropes as knownTropes } from "../data/constants";
import { ratingGenres } from "../data/ratingTemplates";
import { bookService } from "../services/bookService";
import { ratingService } from "../services/ratingService";
import type { AdaptationType, HypeRating, PlaylistSong, PovCount, PovType, RatingGenre, RatingJournal, ReadingFormat, SeasonVibe, SeriesType, UserBook } from "../types";

const seasons: Array<{ label: SeasonVibe; icon: string }> = [
  { label: "Spring", icon: "🌷" },
  { label: "Summer", icon: "☀️" },
  { label: "Autumn", icon: "🍂" },
  { label: "Winter", icon: "❄️" },
];

const formats: Array<{ label: ReadingFormat; icon: typeof BookOpen }> = [
  { label: "Physical Book", icon: BookOpen },
  { label: "eBook", icon: Monitor },
  { label: "Audiobook", icon: Headphones },
];

const adaptationTypes: AdaptationType[] = ["Movie", "TV Show", "Anime", "Graphic Novel", "None"];
const povTypes: PovType[] = ["1st Person", "2nd Person", "3rd Person"];
const povCounts: PovCount[] = ["Single POV", "Dual POV", "Multiple POV"];

export function RatingPage() {
  const { bookId = "" } = useParams();
  const [userBook, setUserBook] = useState<UserBook>();
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState<RatingGenre>("Romantasy");
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [publicReview, setPublicReview] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [tropeSearch, setTropeSearch] = useState("");
  const [customTrope, setCustomTrope] = useState("");
  const [songDraft, setSongDraft] = useState({ title: "", artist: "", spotifyUrl: "" });

  const initial = useMemo(() => ratingService.buildEmptyRating(bookId, genre), [bookId, genre]);
  const [values, setValues] = useState(initial.ratingData);
  const [journal, setJournal] = useState<RatingJournal>(ratingService.buildEmptyJournal());

  useEffect(() => {
    setLoading(true);
    bookService
      .getUserBookForBook(bookId)
      .then((item) => {
        setUserBook(item);
        if (item) {
          setJournal({
            ...ratingService.buildEmptyJournal(item.book),
            formats: item.format ? [item.format === "Physical book" ? "Physical Book" : item.format] as ReadingFormat[] : [],
            tropeTags: item.book.tropes,
          });
        }
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load this saved book."))
      .finally(() => setLoading(false));
  }, [bookId]);

  const canRate = userBook?.readingStatus === "Read" || userBook?.readingStatus === "DNF";
  const suggestedTropes = useMemo(() => {
    const all = Array.from(new Set([...knownTropes, ...(userBook?.book.tropes ?? []), "Academic Rivals", "Who Did This to You", "Morally Grey", "Chosen One", "Touch Her and Die"]));
    return all.filter((trope) => trope.toLowerCase().includes(tropeSearch.toLowerCase()) && !journal.tropeTags.includes(trope)).slice(0, 8);
  }, [journal.tropeTags, tropeSearch, userBook?.book.tropes]);

  const changeGenre = (next: RatingGenre) => {
    setGenre(next);
    setValues(ratingService.buildEmptyRating(bookId, next).ratingData);
  };

  const toggleArray = <T extends string,>(key: keyof RatingJournal, value: T) => {
    setJournal((current) => {
      const currentValues = current[key] as T[];
      const nextValues = currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value];
      return { ...current, [key]: nextValues };
    });
  };

  const addTrope = (trope: string) => {
    const clean = trope.trim();
    if (!clean) return;
    setJournal((current) => ({ ...current, tropeTags: Array.from(new Set([...current.tropeTags, clean])) }));
    setCustomTrope("");
    setTropeSearch("");
  };

  const addSong = () => {
    if (!songDraft.title.trim()) return;
    setJournal((current) => ({
      ...current,
      playlist: [...current.playlist, ratingService.playlistSong(songDraft.title, songDraft.artist, songDraft.spotifyUrl)],
    }));
    setSongDraft({ title: "", artist: "", spotifyUrl: "" });
  };

  const moveSong = (song: PlaylistSong, direction: -1 | 1) => {
    setJournal((current) => {
      const index = current.playlist.findIndex((item) => item.id === song.id);
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.playlist.length) return current;
      const playlist = [...current.playlist];
      [playlist[index], playlist[nextIndex]] = [playlist[nextIndex], playlist[index]];
      return { ...current, playlist };
    });
  };

  const save = async () => {
    if (!userBook) return;
    try {
      await ratingService.saveJournalRating({ userBook, genre, values, journal, publicReview, privateNotes });
      setSaved("Reading memory saved.");
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this rating.");
    }
    window.setTimeout(() => setSaved(""), 2600);
  };

  if (loading) return <PageHeader eyebrow="Rating parlor" title="Preparing your journal page..." />;

  if (!userBook) {
    return (
      <div>
        <PageHeader eyebrow="Rating locked" title="Add this book before rating it." description="The journal flow opens after the book is in your library, then completed or marked DNF." />
        <Link to="/search" className="btn-primary">Find and add books</Link>
      </div>
    );
  }

  if (!canRate) {
    const progress = ((userBook.currentPage ?? 0) / (userBook.book.pageCount ?? 1)) * 100;
    return (
      <div>
        <PageHeader eyebrow="Progress tools" title="Finish the reading memory first." description="Full ratings unlock when the book is completed or marked DNF. For now, keep tracking your progress." />
        <section className="cozy-card max-w-3xl">
          <div className="flex items-start gap-4">
            {userBook.book.coverUrl && <img src={userBook.book.coverUrl} alt={userBook.book.title} className="w-28 rounded-2xl shadow-lg" />}
            <div className="flex-1">
              <h2 className="font-serif text-3xl font-bold">{userBook.book.title}</h2>
              <p className="mt-2 font-semibold text-mocha/70 dark:text-cream/65">{userBook.readingStatus}</p>
              <div className="mt-5"><ProgressBar value={progress} label={`${userBook.currentPage} of ${userBook.book.pageCount ?? "?"} pages`} /></div>
            </div>
          </div>
        </section>
        <div className="mt-5 max-w-3xl">
          <ReadingStatusControls userBook={userBook} onChange={setUserBook} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Rating journal" title="Build a memory profile of this book." description="Not just stars. Capture the season, format, hype, POV, tropes, adaptations, playlist, and the exact texture of the reading experience." />
      {saved && <Toast>{saved}</Toast>}
      {error && <Toast tone="error">{error}</Toast>}

      <section className="cozy-card mb-5 grid gap-4 lg:grid-cols-[160px_1fr]">
        {userBook.book.coverUrl && <img src={userBook.book.coverUrl} alt={userBook.book.title} className="aspect-[2/3] w-full rounded-2xl object-cover shadow-2xl" />}
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-mocha/70 dark:text-gold">Series status</p>
          <h2 className="mt-2 font-serif text-4xl font-bold">{userBook.book.title}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_1fr]">
            <select value={journal.seriesType} onChange={(event) => {
              const seriesType = event.target.value as SeriesType;
              setJournal((current) => ({ ...current, seriesType, standaloneOrSeries: seriesType === "Standalone" || seriesType === "Novella" || seriesType === "Anthology" ? "standalone" : "series" }));
            }} className="rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10">
              {ratingService.seriesTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
            <input type="number" min="1" value={journal.seriesNumber ?? ""} onChange={(event) => setJournal((current) => ({ ...current, seriesNumber: event.target.value ? Number(event.target.value) : undefined }))} placeholder="Book #" className="rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10" />
            <div className="rounded-2xl bg-gold/20 p-3 text-sm font-bold text-espresso dark:text-cream">
              Auto-detected as {ratingService.detectSeriesType(userBook.book)}. Override anytime.
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5">
        <JournalSection title="Season vibes" note="Atmosphere, not genre. Choose one or several.">
          <div className="grid gap-3 sm:grid-cols-4">
            {seasons.map((season) => <CollectibleButton key={season.label} active={journal.seasonVibes.includes(season.label)} onClick={() => toggleArray("seasonVibes", season.label)} label={season.label} icon={season.icon} />)}
          </div>
        </JournalSection>

        <JournalSection title="Format" note="Save separately from reading status. Select every format you used.">
          <div className="grid gap-3 sm:grid-cols-3">
            {formats.map(({ label, icon: Icon }) => (
              <button key={label} type="button" onClick={() => toggleArray("formats", label)} className={journal.formats.includes(label) ? "btn-primary justify-start" : "btn-soft justify-start"}>
                <Icon size={18} />{label}
              </button>
            ))}
          </div>
        </JournalSection>

        <JournalSection title="Would you read again?" note="Separate from overall rating. A messy 3-star can still be a reread.">
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => setJournal((current) => ({ ...current, rereadOpinion: "yes" }))} className={journal.rereadOpinion === "yes" ? "btn-primary" : "btn-soft"}><ThumbsUp size={18} />Yes</button>
            <button type="button" onClick={() => setJournal((current) => ({ ...current, rereadOpinion: "no" }))} className={journal.rereadOpinion === "no" ? "btn-primary" : "btn-soft"}><ThumbsDown size={18} />No</button>
            <button type="button" onClick={() => setJournal((current) => ({ ...current, rereadOpinion: "unsure" }))} className={journal.rereadOpinion === "unsure" ? "btn-primary" : "btn-soft"}><Sparkles size={18} />Unsure</button>
          </div>
        </JournalSection>

        <JournalSection title="Adaptations" note="Track what exists, what you watched, and which version won.">
          <div className="flex flex-wrap gap-2">
            {adaptationTypes.map((type) => <button key={type} type="button" onClick={() => setJournal((current) => ({ ...current, adaptationTypes: type === "None" ? ["None"] : Array.from(new Set([...current.adaptationTypes.filter((item) => item !== "None"), type])) }))} className={journal.adaptationTypes.includes(type) ? "btn-primary" : "btn-soft"}><Film size={18} />{type}</button>)}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="btn-soft justify-start"><input type="checkbox" checked={journal.watchedAdaptation} onChange={(event) => setJournal((current) => ({ ...current, watchedAdaptation: event.target.checked }))} />Watched adaptation</label>
            <label className="btn-soft justify-start"><input type="checkbox" checked={journal.planToWatch} onChange={(event) => setJournal((current) => ({ ...current, planToWatch: event.target.checked }))} />Plan to watch</label>
            <select value={journal.adaptationPreference} onChange={(event) => setJournal((current) => ({ ...current, adaptationPreference: event.target.value as RatingJournal["adaptationPreference"] }))} className="rounded-full border-0 bg-white/70 px-4 py-3 font-bold outline-none dark:bg-white/10">
              <option value="">No winner yet</option>
              <option value="adaptation was better">Adaptation was better</option>
              <option value="book was better">Book was better</option>
              <option value="both hit differently">Both hit differently</option>
            </select>
          </div>
          <textarea value={journal.adaptationNotes} onChange={(event) => setJournal((current) => ({ ...current, adaptationNotes: event.target.value }))} placeholder="Adaptation notes" className="mt-4 min-h-24 w-full rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" />
        </JournalSection>

        <JournalSection title="Hype rating" note="No numbers. Just the truth about the noise around it.">
          <input type="range" min="0" max="4" value={ratingService.hypeRatings.indexOf(journal.hypeRating)} onChange={(event) => setJournal((current) => ({ ...current, hypeRating: ratingService.hypeRatings[Number(event.target.value)] as HypeRating }))} className="w-full accent-mocha" />
          <div className="mt-3 grid grid-cols-5 gap-2 text-center text-xs font-bold text-mocha/70 dark:text-cream/65">
            {ratingService.hypeRatings.map((rating) => <span key={rating} className={journal.hypeRating === rating ? "rounded-2xl bg-gold/30 p-2 text-espresso dark:text-cream" : "p-2"}>{rating}</span>)}
          </div>
        </JournalSection>

        <JournalSection title="POV tracker" note="Perspective and narrator count are stored separately.">
          <div className="grid gap-3 md:grid-cols-2">
            <Segmented options={povTypes} value={journal.povType} onChange={(value) => setJournal((current) => ({ ...current, povType: value as PovType }))} />
            <Segmented options={povCounts} value={journal.povCount} onChange={(value) => setJournal((current) => ({ ...current, povCount: value as PovCount }))} />
          </div>
        </JournalSection>

        <JournalSection title="Trope tracker" note="Search suggestions, remove chips, or add your own oddly specific trope.">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-mocha/60" size={18} />
            <input value={tropeSearch} onChange={(event) => setTropeSearch(event.target.value)} placeholder="Search trope suggestions" className="w-full rounded-2xl border-0 bg-white/70 py-3 pl-11 pr-4 font-semibold outline-none dark:bg-white/10" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedTropes.map((trope) => <button key={trope} type="button" onClick={() => addTrope(trope)} className="chip hover:bg-gold/30">{trope}</button>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {journal.tropeTags.map((trope) => <button key={trope} type="button" onClick={() => setJournal((current) => ({ ...current, tropeTags: current.tropeTags.filter((item) => item !== trope) }))} className="chip bg-sage/20">{trope} ×</button>)}
          </div>
          <div className="mt-4 flex gap-2">
            <input value={customTrope} onChange={(event) => setCustomTrope(event.target.value)} placeholder="Add custom trope" className="flex-1 rounded-2xl border-0 bg-white/70 p-3 outline-none dark:bg-white/10" />
            <button type="button" onClick={() => addTrope(customTrope)} className="btn-primary">Add</button>
          </div>
        </JournalSection>

        <JournalSection title="Book playlist" note="Optional soundtrack for the reading memory. Reorder songs into the right mood.">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.2fr_auto]">
            <input value={songDraft.title} onChange={(event) => setSongDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Song title" className="rounded-2xl border-0 bg-white/70 p-3 outline-none dark:bg-white/10" />
            <input value={songDraft.artist} onChange={(event) => setSongDraft((current) => ({ ...current, artist: event.target.value }))} placeholder="Artist" className="rounded-2xl border-0 bg-white/70 p-3 outline-none dark:bg-white/10" />
            <input value={songDraft.spotifyUrl} onChange={(event) => setSongDraft((current) => ({ ...current, spotifyUrl: event.target.value }))} placeholder="Spotify link" className="rounded-2xl border-0 bg-white/70 p-3 outline-none dark:bg-white/10" />
            <button type="button" onClick={addSong} className="btn-primary"><Music size={18} />Add</button>
          </div>
          <div className="mt-4 grid gap-3">
            {journal.playlist.map((song) => (
              <article key={song.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/55 p-4 dark:bg-white/10">
                <div>
                  <p className="font-bold">{song.title}</p>
                  <p className="text-sm text-mocha/70 dark:text-cream/60">{song.artist || "Unknown artist"} {song.spotifyUrl ? "· Spotify attached" : ""}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => moveSong(song, -1)} className="btn-soft px-3"><ArrowUp size={16} /></button>
                  <button type="button" onClick={() => moveSong(song, 1)} className="btn-soft px-3"><ArrowDown size={16} /></button>
                  <button type="button" onClick={() => setJournal((current) => ({ ...current, playlist: current.playlist.filter((item) => item.id !== song.id) }))} className="btn-soft px-3">Remove</button>
                </div>
              </article>
            ))}
          </div>
        </JournalSection>

        <JournalSection title="Genre-specific ratings" note="The emotional breakdown still lives here, now surrounded by richer context.">
          <select value={genre} onChange={(event) => changeGenre(event.target.value as RatingGenre)} className="mb-4 w-full rounded-2xl border-0 bg-white/70 p-3 font-bold outline-none dark:bg-white/10 md:max-w-md">
            {ratingGenres.map((item) => <option key={item}>{item}</option>)}
          </select>
          <GenreRatingTemplate genre={genre} values={values} onChange={(field, value) => setValues((current) => ({ ...current, [field]: value, Overall: field === "Overall" ? value : current.Overall }))} />
        </JournalSection>

        <JournalSection title="Review and private memory" note="Review text is optional. Metadata saves separately.">
          <textarea value={publicReview} onChange={(event) => setPublicReview(event.target.value)} placeholder="Public review" className="min-h-28 w-full rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" />
          <textarea value={privateNotes} onChange={(event) => setPrivateNotes(event.target.value)} placeholder="Private notes, annotations, or unhinged feelings" className="mt-3 min-h-28 w-full rounded-2xl border-0 bg-white/70 p-4 outline-none dark:bg-white/10" />
          <button type="button" onClick={save} className="btn-primary mt-4 w-full"><Save size={18} />Save reading memory</button>
        </JournalSection>

        <section className="cozy-card">
          <h2 className="font-serif text-3xl font-bold">Memory snapshot</h2>
          <div className="mt-4 grid gap-3">
            <TropeChips items={[journal.seriesType, journal.hypeRating, journal.povType, journal.povCount, ...journal.seasonVibes, ...journal.formats]} />
            <TropeChips items={journal.tropeTags} tone="mood" />
          </div>
        </section>
      </div>
    </div>
  );
}

function JournalSection({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="cozy-card">
      <div className="mb-4">
        <h2 className="font-serif text-3xl font-bold">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-mocha/70 dark:text-cream/65">{note}</p>
      </div>
      {children}
    </section>
  );
}

function CollectibleButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 ${active ? "border-gold bg-gold/25 shadow-glow" : "border-white/50 bg-white/55 dark:border-white/10 dark:bg-white/10"}`}>
      <span className="text-3xl">{icon}</span>
      <span className="mt-3 flex items-center justify-between font-bold">{label}{active && <Check size={18} />}</span>
    </button>
  );
}

function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-2 rounded-3xl bg-white/40 p-2 dark:bg-white/10 sm:grid-cols-3">
      {options.map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={value === option ? "btn-primary px-3" : "btn-soft px-3"}>{option}</button>)}
    </div>
  );
}

function Toast({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "error" }) {
  return <div className={`fixed right-5 top-5 z-50 rounded-2xl px-5 py-3 font-bold shadow-glow ${tone === "error" ? "bg-rose text-espresso" : "bg-espresso text-cream dark:bg-gold dark:text-espresso"}`}>{children}</div>;
}
