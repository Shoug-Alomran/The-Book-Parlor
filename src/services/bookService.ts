import { demoBooks, demoUserBooks } from "../data/demoData";
import { isUuid } from "../lib/ids";
import { supabase } from "../lib/supabase";
import type { Book, OwnershipStatus, ReadingStatus, UserBook } from "../types";
import { bookToBookRow, externalBookMetadataService } from "./externalBookMetadataService";

export const bookService = {
  async searchBooks(query: string): Promise<Book[]> {
    if (!query.trim()) return demoBooks;
    try {
      const googleBooks = await externalBookMetadataService.searchGoogleBooks(query);
      if (googleBooks.length >= 3) return googleBooks;
      const openLibraryBooks = await externalBookMetadataService.searchOpenLibrary(query);
      return [...googleBooks, ...openLibraryBooks].slice(0, 12);
    } catch {
      return demoBooks.filter((book) => `${book.title} ${book.authors.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
    }
  },

  async getBook(bookId: string): Promise<Book | undefined> {
    if (supabase && isUuid(bookId)) {
      const { data } = await supabase.from("books").select("*").eq("id", bookId).maybeSingle();
      if (data) return mapBookRow(data);
    }
    return demoBooks.find((book) => book.id === bookId) ?? demoUserBooks.find((item) => item.book.id === bookId)?.book;
  },

  async getUserBooks(): Promise<UserBook[]> {
    if (!supabase) return demoUserBooks;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];
    const { data, error } = await supabase.from("user_books").select("*, books(*)").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapUserBookRow);
  },

  async getUserBookForBook(bookId: string): Promise<UserBook | undefined> {
    if (!supabase) return demoUserBooks.find((item) => item.book.id === bookId);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return undefined;
    const { data, error } = await supabase
      .from("user_books")
      .select("*, books(*)")
      .eq("book_id", bookId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapUserBookRow(data) : undefined;
  },

  async saveBook(book: Book, options?: { readingStatus?: ReadingStatus; ownershipStatus?: OwnershipStatus }) {
    const enriched = await externalBookMetadataService.upsertBookFromExternalMetadata(book);
    if (!supabase) return enriched;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Please log in before adding books to your library.");

    const { error: bookError } = await supabase.from("books").upsert(bookToBookRow(enriched));
    if (bookError) throw bookError;

    const { error: userBookError } = await supabase.from("user_books").upsert(
      {
        user_id: userData.user.id,
        book_id: enriched.id,
        reading_status: options?.readingStatus ?? "Want to Read",
        ownership_status: options?.ownershipStatus ?? "Not Owned",
        format: "Physical book",
        current_page: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,book_id" },
    );
    if (userBookError) throw userBookError;
    return enriched;
  },
};

function mapBookRow(row: any): Book {
  return {
    id: row.id,
    externalId: row.external_id,
    googleBooksId: row.google_books_id,
    openlibraryWorkKey: row.openlibrary_work_key,
    openlibraryEditionKey: row.openlibrary_edition_key,
    title: row.title,
    subtitle: row.subtitle,
    authors: row.authors ?? [],
    description: row.description ?? "",
    coverUrl: row.cover_url,
    isbn10: row.isbn_10,
    isbn13: row.isbn_13,
    pageCount: row.page_count,
    publisher: row.publisher,
    publishedYear: row.published_year,
    categories: row.categories ?? [],
    language: row.language,
    source: row.source ?? "manual",
    externalAverageRating: row.external_average_rating === null || row.external_average_rating === undefined ? undefined : Number(row.external_average_rating),
    externalRatingsCount: row.external_ratings_count ?? undefined,
    externalRatingSource: row.external_rating_source ?? undefined,
    externalSubjects: row.external_subjects ?? [],
    importedMetadata: row.imported_metadata ?? {},
    tropes: row.tropes ?? [],
    moods: row.moods ?? [],
    contentWarnings: row.content_warnings ?? [],
  };
}

function mapUserBookRow(row: any): UserBook {
  return {
    id: row.id,
    book: mapBookRow(row.books),
    readingStatus: row.reading_status,
    ownershipStatus: row.ownership_status,
    format: row.format ?? "Physical book",
    currentPage: row.current_page ?? 0,
    startDate: row.start_date,
    finishDate: row.finish_date,
    isFavorite: row.is_favorite,
    isReread: row.is_reread,
    wouldReadAgain: row.would_read_again,
    dnfReason: row.dnf_reason,
    privateNotes: row.private_notes,
    shelves: [],
  };
}
