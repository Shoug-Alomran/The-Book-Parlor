export type ReadingStatus = "Want to Read" | "Currently Reading" | "Read" | "DNF" | "Paused";
export type OwnershipStatus =
  | "Purchased / Physically Owned"
  | "eBook Owned"
  | "Audiobook Owned"
  | "Borrowed"
  | "Not Owned"
  | "Need to Buy";

export type RatingGenre =
  | "Romance"
  | "Dark Romance"
  | "Romantasy"
  | "Fantasy"
  | "Horror"
  | "Mystery"
  | "Thriller"
  | "Science Fiction"
  | "Literary Fiction"
  | "Classic"
  | "Graphic Novel / Manga"
  | "Young Adult"
  | "Children's Book"
  | "Nonfiction"
  | "Biography"
  | "Self-Help"
  | "Other";

export type Book = {
  id: string;
  externalId?: string;
  googleBooksId?: string;
  openlibraryWorkKey?: string;
  openlibraryEditionKey?: string;
  title: string;
  subtitle?: string;
  authors: string[];
  description: string;
  coverUrl?: string;
  isbn10?: string;
  isbn13?: string;
  pageCount?: number;
  publisher?: string;
  publishedYear?: number;
  categories: string[];
  language?: string;
  source: "google-books" | "open-library" | "google_books" | "open_library" | "manual";
  externalAverageRating?: number;
  externalRatingsCount?: number;
  externalRatingSource?: "google_books";
  externalSubjects?: string[];
  importedMetadata?: Record<string, unknown>;
  aiSummary?: string;
  tropes: string[];
  moods: string[];
  contentWarnings?: string[];
};

export type InferredMetadataValue = {
  value: string;
  confidence: number;
  source: "ai_inferred";
};

export type BookAIEnrichment = {
  genres: InferredMetadataValue[];
  tropes: InferredMetadataValue[];
  moods: InferredMetadataValue[];
  content_warnings: InferredMetadataValue[];
  season_vibes: InferredMetadataValue[];
  standalone_or_series?: InferredMetadataValue;
  series_type?: InferredMetadataValue;
  likely_pov_type?: InferredMetadataValue;
  likely_pov_count?: InferredMetadataValue;
  hype_rating_suggestion?: InferredMetadataValue;
  rating_genre_suggestion?: InferredMetadataValue;
  reading_vibe?: InferredMetadataValue;
  book_parlor_summary?: InferredMetadataValue;
  similar_books: InferredMetadataValue[];
  suggested_rating_template?: InferredMetadataValue;
};

export type BookEnrichmentResult = {
  book: Book;
  ai: BookAIEnrichment;
  suggestions: BookAISuggestion[];
  factualSources: Array<"google_books" | "open_library">;
  pageCountVariesByEdition: boolean;
};

export type BookAISuggestionStatus = "pending" | "accepted" | "rejected";

export type BookAISuggestion = {
  id: string;
  bookId: string;
  userId?: string;
  fieldName: string;
  suggestedValue: InferredMetadataValue | InferredMetadataValue[];
  confidence: number;
  source: "ai_inferred";
  status: BookAISuggestionStatus;
};

export type UserBook = {
  id: string;
  book: Book;
  readingStatus: ReadingStatus;
  ownershipStatus: OwnershipStatus;
  format: "Physical book" | "eBook" | "Audiobook";
  currentPage: number;
  startDate?: string;
  finishDate?: string;
  isFavorite: boolean;
  isReread: boolean;
  wouldReadAgain?: boolean;
  dnfReason?: string;
  privateNotes?: string;
  shelves: string[];
  rating?: Rating;
};

export type Rating = {
  id: string;
  bookId: string;
  ratingGenre: RatingGenre;
  overall: number;
  ratingData: Record<string, number>;
  wouldReadAgain: boolean;
  isPublic: boolean;
};

export type SeasonVibe = "Spring" | "Summer" | "Autumn" | "Winter";
export type ReadingFormat = "Physical Book" | "eBook" | "Audiobook";
export type RereadOpinion = "yes" | "no" | "unsure";
export type AdaptationType = "Movie" | "TV Show" | "Anime" | "Graphic Novel" | "None";
export type HypeRating = "Overhyped" | "Slightly Overhyped" | "Appropriately Rated" | "Underrated" | "Criminally Underrated";
export type PovType = "1st Person" | "2nd Person" | "3rd Person";
export type PovCount = "Single POV" | "Dual POV" | "Multiple POV";
export type SeriesType = "Standalone" | "Duology" | "Trilogy" | "Series" | "Novella" | "Anthology";

export type PlaylistSong = {
  id: string;
  title: string;
  artist: string;
  spotifyUrl?: string;
};

export type RatingJournal = {
  seasonVibes: SeasonVibe[];
  formats: ReadingFormat[];
  rereadOpinion: RereadOpinion;
  adaptationTypes: AdaptationType[];
  watchedAdaptation: boolean;
  planToWatch: boolean;
  adaptationPreference: "adaptation was better" | "book was better" | "both hit differently" | "";
  adaptationNotes: string;
  hypeRating: HypeRating;
  povType: PovType;
  povCount: PovCount;
  tropeTags: string[];
  playlist: PlaylistSong[];
  seriesType: SeriesType;
  seriesNumber?: number;
  standaloneOrSeries: "standalone" | "series";
};

export type Review = {
  id: string;
  bookId: string;
  userName: string;
  title: string;
  body: string;
  hasSpoilers: boolean;
  isPublic: boolean;
  likes: number;
};

export type Comment = {
  id: string;
  bookId: string;
  userName: string;
  body: string;
  hasSpoilers: boolean;
};

export type BookcaseTheme = "cafe" | "dark-academia" | "fantasy-forest" | "cozy-library";

export type Bookcase = {
  id: string;
  name: string;
  type: "read" | "purchased" | "tbr" | "favorites" | "owned-unread" | "custom" | "trope";
  theme: BookcaseTheme;
  shelfColor: string;
  background: string;
  decor: string[];
  visibility: "public" | "private";
  filterTrope?: string;
};
