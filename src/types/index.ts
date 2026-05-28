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
  source: "demo" | "google-books" | "open-library" | "manual";
  tropes: string[];
  moods: string[];
  contentWarnings?: string[];
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
  type: "read" | "purchased" | "tbr" | "favorites" | "owned-unread";
  theme: BookcaseTheme;
  shelfColor: string;
  background: string;
  decor: string[];
  visibility: "public" | "private";
};
