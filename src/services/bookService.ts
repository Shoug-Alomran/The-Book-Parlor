import { isUuid } from "../lib/ids";
import { supabase } from "../lib/supabase";
import type { Book, BookEdition, OwnershipStatus, ReadingStatus, UserBook } from "../types";
import { externalBookMetadataService, getCachedExternalBook } from "./externalBookMetadataService";
import { bookEnrichmentService } from "./bookEnrichmentService";

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
    if (userBookError) {
      console.error("Book Parlor save failed at user_books upsert", userBookError);
      throw new Error("library_save_failed");
    }
    bookEnrichmentService.enrichBook(enriched).catch((error) => console.warn("Book Parlor background enrichment skipped", error));
    return enriched;
  },

  async updateUserBook(userBookId: string, updates: { readingStatus?: ReadingStatus; ownershipStatus?: OwnershipStatus; currentPage?: number; finishDate?: string | null; startDate?: string | null; selectedEdition?: BookEdition }) {
    if (!supabase) throw new Error("auth_required");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("auth_required");

    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.readingStatus) row.reading_status = updates.readingStatus;
    if (updates.ownershipStatus) row.ownership_status = updates.ownershipStatus;
    if (updates.currentPage !== undefined) row.current_page = updates.currentPage;
    if (updates.startDate !== undefined) row.start_date = updates.startDate;
    if (updates.finishDate !== undefined) row.finish_date = updates.finishDate;
    if (updates.selectedEdition !== undefined) row.selected_edition = updates.selectedEdition;

    const { data, error } = await supabase
      .from("user_books")
      .update(row)
      .eq("id", userBookId)
      .eq("user_id", userData.user.id)
      .select("*, books(*)")
      .single();
    if (error) {
      console.error("Book Parlor user book update failed", error);
      throw new Error("library_update_failed");
    }
    return mapUserBookRow(data);
  },
};

async function ensureProfileForUser(user: { id: string; email?: string | null; user_metadata?: Record<string, any> }) {
  if (!supabase) return;
  const { data: profile, error: profileLookupError } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (profileLookupError) {
    console.error("Book Parlor profile lookup failed", profileLookupError);
    throw new Error("profile_unavailable");
  }
  if (profile) return;

  const emailPrefix = sanitizeUsername(user.email?.split("@")[0] ?? "reader");
  const metadata = user.user_metadata ?? {};
  const preferredUsername = sanitizeUsername(metadata.username ?? emailPrefix);
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    username: preferredUsername,
    display_name: metadata.display_name ?? preferredUsername,
  });
  if (!error) return;

  const retryUsername = `${preferredUsername}-${user.id.slice(0, 8)}`;
  const retry = await supabase.from("profiles").upsert({
    id: user.id,
    username: retryUsername,
    display_name: metadata.display_name ?? preferredUsername,
  });
  if (retry.error) {
    console.error("Book Parlor profile creation failed", error, retry.error);
    throw new Error("profile_unavailable");
  }
}

function sanitizeUsername(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "reader";
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
  const importedMetadata = row.imported_metadata ?? {};
  const acceptedAI = importedMetadata.accepted_ai_suggestions ?? importedMetadata.ai_enrichment ?? {};
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
    publishedDate: row.published_date,
    editionTitle: row.edition_title,
    format: row.format,
    seriesName: row.series_name,
    seriesPosition: row.series_position,
    categories: mergeMetadataValues(row.categories ?? row.external_categories ?? [], acceptedAI.genres),
    language: row.language,
    source: row.source ?? "manual",
    externalAverageRating: row.external_average_rating === null || row.external_average_rating === undefined ? undefined : Number(row.external_average_rating),
    externalRatingsCount: row.external_ratings_count ?? undefined,
    externalRatingSource: row.external_rating_source ?? undefined,
    externalSubjects: row.external_subjects ?? [],
    importedMetadata,
    aiSummary: row.ai_summary,
    tropes: mergeMetadataValues(row.tropes ?? [], acceptedAI.tropes),
    moods: mergeMetadataValues(row.moods ?? [], acceptedAI.moods),
    contentWarnings: mergeMetadataValues(row.content_warnings ?? [], acceptedAI.content_warnings),
  };
}

function mergeMetadataValues(existing: string[], inferred?: Array<{ value?: string }>) {
  return Array.from(new Set([...(existing ?? []), ...((inferred ?? []).map((item) => item.value).filter(Boolean) as string[])]));
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
    selectedEdition: row.selected_edition,
    shelves: [],
  };
}
