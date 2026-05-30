import { ratingTemplates } from "../data/ratingTemplates";
import { supabase } from "../lib/supabase";
import type { Book, HypeRating, PlaylistSong, Rating, RatingGenre, RatingJournal, SeriesType, UserBook } from "../types";

const seriesTypes: SeriesType[] = ["Unknown", "Standalone", "Duology", "Trilogy", "Series", "Novella", "Anthology"];

export const ratingService = {
  buildEmptyRating(bookId: string, genre: RatingGenre): Rating {
    const ratingData = Object.fromEntries(ratingTemplates[genre].map((field) => [field, 0]));
    return { id: crypto.randomUUID(), bookId, ratingGenre: genre, overall: 0, ratingData, wouldReadAgain: false, isPublic: true };
  },
  communityAverage(ratings: Rating[]) {
    if (!ratings.length) return 0;
    return ratings.reduce((sum, rating) => sum + rating.overall, 0) / ratings.length;
  },
  buildEmptyJournal(book?: Book): RatingJournal {
    const seriesType = this.detectSeriesType(book);
    return {
      seasonVibes: [],
      formats: [],
      rereadOpinion: "unsure",
      adaptationTypes: ["None"],
      watchedAdaptation: false,
      planToWatch: false,
      adaptationPreference: "",
      adaptationNotes: "",
      hypeRating: "Appropriately Rated",
      povType: "3rd Person",
      povCount: "Single POV",
      tropeTags: book?.tropes ?? [],
      playlist: [],
      seriesType,
      seriesNumber: undefined,
      standaloneOrSeries: seriesType === "Unknown" ? "unknown" : seriesType === "Standalone" || seriesType === "Novella" || seriesType === "Anthology" ? "standalone" : "series",
    };
  },
  detectSeriesType(book?: Book): SeriesType {
    const text = `${book?.title ?? ""} ${book?.subtitle ?? ""} ${book?.description ?? ""} ${(book?.categories ?? []).join(" ")}`.toLowerCase();
    if (/\bnovella\b/.test(text)) return "Novella";
    if (/\bantholog(y|ies)\b|short stories/.test(text)) return "Anthology";
    if (/\bduology\b|book 2 of 2|two[- ]book/.test(text)) return "Duology";
    if (/\btrilogy\b|book 3 of 3|three[- ]book/.test(text)) return "Trilogy";
    if (/\bseries\b|book [0-9]+|#[0-9]+|volume [0-9]+|vol\. [0-9]+/.test(text)) return "Series";
    return "Unknown";
  },
  async saveJournalRating(input: {
    userBook: UserBook;
    genre: RatingGenre;
    values: Record<string, number>;
    journal: RatingJournal;
    publicReview?: string;
    privateNotes?: string;
  }) {
    if (!supabase) return;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Please log in before saving a rating.");
    const overall = input.values.Overall ?? 0;
    const coreRating = {
      user_id: userData.user.id,
      book_id: input.userBook.book.id,
      rating_genre: input.genre,
      overall,
      rating_data: input.values,
      would_read_again: input.journal.rereadOpinion === "yes",
      is_public: true,
      updated_at: new Date().toISOString(),
    };
    const { data: savedRating, error } = await supabase
      .from("ratings")
      .upsert(coreRating, { onConflict: "user_id,book_id" })
      .select("id")
      .single();
    if (error) {
      console.error("Book Parlor core rating save failed", error);
      throw new Error("Could not save this rating. Please make sure this book is in your library.");
    }

    const journalColumns = {
      season_vibes: input.journal.seasonVibes,
      formats: input.journal.formats,
      reread_opinion: input.journal.rereadOpinion,
      adaptation_types: input.journal.adaptationTypes,
      watched_adaptation: input.journal.watchedAdaptation,
      plan_to_watch: input.journal.planToWatch,
      adaptation_preference: input.journal.adaptationPreference,
      adaptation_notes: input.journal.adaptationNotes,
      hype_rating: input.journal.hypeRating,
      pov_type: input.journal.povType,
      pov_count: input.journal.povCount,
      trope_tags: input.journal.tropeTags,
      playlist: input.journal.playlist,
      series_type: input.journal.seriesType,
      series_number: input.journal.seriesNumber,
      standalone_or_series: input.journal.standaloneOrSeries,
      updated_at: new Date().toISOString(),
    };
    if (savedRating?.id) {
      const journalUpdate = await supabase.from("ratings").update(journalColumns).eq("id", savedRating.id);
      if (journalUpdate.error) console.warn("Book Parlor journal metadata skipped", journalUpdate.error);
    }

    const userBookUpdate = await supabase
      .from("user_books")
      .update({
        would_read_again: input.journal.rereadOpinion === "yes",
        private_notes: input.privateNotes,
        format: input.journal.formats[0] === "Physical Book" ? "Physical book" : input.journal.formats[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.userBook.id);
    if (userBookUpdate.error) console.warn("Book Parlor user book rating metadata skipped", userBookUpdate.error);
  },
  seriesTypes,
  hypeRatings: ["Overhyped", "Slightly Overhyped", "Appropriately Rated", "Underrated", "Criminally Underrated"] as HypeRating[],
  playlistSong(title = "", artist = "", spotifyUrl = ""): PlaylistSong {
    return { id: crypto.randomUUID(), title, artist, spotifyUrl };
  },
};
