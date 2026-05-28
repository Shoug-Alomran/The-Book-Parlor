import { demoBooks, demoUserBooks } from "../data/demoData";
import { isUuid, stableUuid } from "../lib/ids";
import { supabase } from "../lib/supabase";
import type { Book, OwnershipStatus, ReadingStatus, UserBook } from "../types";
import { tropeDetectionService } from "./tropeDetectionService";

const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes";

const normalizeGoogleBook = (item: any): Book => {
  const info = item.volumeInfo ?? {};
  const industryIds = info.industryIdentifiers ?? [];
  const isbn10 = industryIds.find((id: any) => id.type === "ISBN_10")?.identifier;
  const isbn13 = industryIds.find((id: any) => id.type === "ISBN_13")?.identifier;
  return tropeDetectionService.enrichBook({
    id: stableUuid(`google-books:${item.id}`),
    externalId: item.id,
    title: info.title ?? "Untitled book",
    subtitle: info.subtitle,
    authors: info.authors ?? ["Unknown author"],
    description: info.description ?? "No description is available yet.",
    coverUrl: info.imageLinks?.thumbnail?.replace("http://", "https://"),
    isbn10,
    isbn13,
    pageCount: info.pageCount,
    publisher: info.publisher,
    publishedYear: info.publishedDate ? Number(String(info.publishedDate).slice(0, 4)) : undefined,
    categories: info.categories ?? [],
    language: info.language,
    source: "google-books",
    tropes: [],
    moods: [],
  });
};

const normalizeOpenLibraryBook = (doc: any): Book => {
  const isbn = doc.isbn?.[0];
  const externalId = doc.key ?? isbn ?? doc.title;
  return tropeDetectionService.enrichBook({
    id: stableUuid(`open-library:${externalId}`),
    externalId,
    title: doc.title ?? "Untitled book",
    authors: doc.author_name ?? ["Unknown author"],
    description: doc.first_sentence?.[0] ?? "No description is available yet.",
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
    isbn10: isbn?.length === 10 ? isbn : undefined,
    isbn13: isbn?.length === 13 ? isbn : undefined,
    pageCount: doc.number_of_pages_median,
    publisher: doc.publisher?.[0],
    publishedYear: doc.first_publish_year,
    categories: doc.subject?.slice(0, 4) ?? [],
    language: doc.language?.[0],
    source: "open-library",
    tropes: [],
    moods: [],
  });
};

export const bookService = {
  async searchBooks(query: string): Promise<Book[]> {
    if (!query.trim()) return demoBooks;
    try {
      const key = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
      const googleUrl = `${GOOGLE_BOOKS_URL}?q=${encodeURIComponent(query)}&maxResults=12${key ? `&key=${key}` : ""}`;
      const googleResponse = await fetch(googleUrl);
      const googleData = await googleResponse.json();
      const googleBooks = (googleData.items ?? []).map(normalizeGoogleBook).filter((book: Book) => book.title);
      if (googleBooks.length >= 3) return googleBooks;

      const openResponse = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12`);
      const openData = await openResponse.json();
      return [...googleBooks, ...(openData.docs ?? []).map(normalizeOpenLibraryBook)].slice(0, 12);
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
    const enriched = tropeDetectionService.enrichBook({
      ...book,
      id: isUuid(book.id) ? book.id : stableUuid(`${book.source}:${book.externalId ?? book.isbn13 ?? book.title}`),
    });
    if (!supabase) return enriched;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("Please log in before adding books to your library.");

    const bookPayload = {
      id: enriched.id,
      external_id: enriched.externalId,
      title: enriched.title,
      subtitle: enriched.subtitle,
      authors: enriched.authors,
      description: enriched.description,
      cover_url: enriched.coverUrl,
      isbn_10: enriched.isbn10,
      isbn_13: enriched.isbn13,
      page_count: enriched.pageCount,
      publisher: enriched.publisher,
      published_year: enriched.publishedYear,
      categories: enriched.categories,
      language: enriched.language,
      source: enriched.source,
      tropes: enriched.tropes,
      moods: enriched.moods,
      content_warnings: enriched.contentWarnings ?? [],
    };

    const { error: bookError } = await supabase.from("books").upsert(bookPayload);
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
