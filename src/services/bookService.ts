import { isUuid } from "../lib/ids";
import { supabase } from "../lib/supabase";
import type { Book, OwnershipStatus, ReadingStatus, UserBook } from "../types";
import { externalBookMetadataService, getCachedExternalBook } from "./externalBookMetadataService";

export const bookService = {
  async searchBooks(query: string): Promise<Book[]> {
    if (!query.trim()) return [];
    const [googleResult, openLibraryResult] = await Promise.allSettled([
      externalBookMetadataService.searchGoogleBooks(query),
      externalBookMetadataService.searchOpenLibrary(query),
    ]);
    const googleBooks = googleResult.status === "fulfilled" ? googleResult.value : [];
    const openLibraryBooks = openLibraryResult.status === "fulfilled" ? openLibraryResult.value : [];
    return dedupeBooks([...googleBooks, ...openLibraryBooks]).slice(0, 12);
  },

  async discoverBooks(): Promise<Book[]> {
    const queries = ["popular fiction", "new romance fiction", "fantasy bestseller", "mystery thriller"];
    const results = await Promise.allSettled(queries.map((query) => this.searchBooks(query)));
    return dedupeBooks(results.flatMap((result) => (result.status === "fulfilled" ? result.value : []))).slice(0, 18);
  },

  async getBook(bookId: string): Promise<Book | undefined> {
    if (supabase && isUuid(bookId)) {
      const { data } = await supabase.from("books").select("*").eq("id", bookId).maybeSingle();
      if (data) return mapBookRow(data);
    }
    return getCachedExternalBook(bookId);
  },

  async getUserBooks(): Promise<UserBook[]> {
    if (!supabase) return [];
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];
    const { data, error } = await supabase.from("user_books").select("*, books(*)").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapUserBookRow);
  },

  async getUserBookForBook(bookId: string): Promise<UserBook | undefined> {
    if (!supabase) return undefined;
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
    if (!supabase) return externalBookMetadataService.upsertBookFromExternalMetadata(book);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("auth_required");
    await ensureProfileForUser(userData.user);

    const enriched = await externalBookMetadataService.upsertBookFromExternalMetadata(book);

    const { data: existingUserBook } = await supabase
      .from("user_books")
      .select("reading_status, ownership_status")
      .eq("user_id", userData.user.id)
      .eq("book_id", enriched.id)
      .maybeSingle();

    const { error: userBookError } = await supabase.from("user_books").upsert(
      {
        user_id: userData.user.id,
        book_id: enriched.id,
        reading_status: options?.readingStatus ?? existingUserBook?.reading_status ?? "Want to Read",
        ownership_status: options?.ownershipStatus ?? existingUserBook?.ownership_status ?? "Not Owned",
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

async function ensureProfileForUser(user: { id: string; email?: string | null; user_metadata?: Record<string, any> }) {
  if (!supabase) return;
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (profile) return;

  const emailPrefix = user.email?.split("@")[0] ?? "reader";
  const metadata = user.user_metadata ?? {};
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    username: metadata.username ?? emailPrefix,
    display_name: metadata.display_name ?? metadata.username ?? emailPrefix,
  });
  if (error) throw new Error("profile_unavailable");
}

function dedupeBooks(books: Book[]) {
  const seen = new Set<string>();
  return books.filter((book) => {
    const key = book.isbn13 ?? book.googleBooksId ?? book.openlibraryWorkKey ?? book.externalId ?? `${book.title}-${book.authors.join(",")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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
