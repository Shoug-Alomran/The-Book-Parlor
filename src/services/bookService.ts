import { demoBooks, demoUserBooks } from "../data/demoData";
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
    id: item.id,
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
  return tropeDetectionService.enrichBook({
    id: doc.key?.replace("/works/", "ol-") ?? crypto.randomUUID(),
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
    return demoBooks.find((book) => book.id === bookId) ?? demoUserBooks.find((item) => item.book.id === bookId)?.book;
  },

  async getUserBooks(): Promise<UserBook[]> {
    if (!supabase) return demoUserBooks;
    const { data, error } = await supabase.from("user_books").select("*, books(*)").order("updated_at", { ascending: false });
    if (error || !data?.length) return demoUserBooks;
    return data.map((row: any) => ({
      id: row.id,
      book: {
        id: row.books.id,
        title: row.books.title,
        subtitle: row.books.subtitle,
        authors: row.books.authors ?? [],
        description: row.books.description ?? "",
        coverUrl: row.books.cover_url,
        isbn10: row.books.isbn_10,
        isbn13: row.books.isbn_13,
        pageCount: row.books.page_count,
        publisher: row.books.publisher,
        publishedYear: row.books.published_year,
        categories: row.books.categories ?? [],
        language: row.books.language,
        source: row.books.source,
        tropes: [],
        moods: [],
      },
      readingStatus: row.reading_status,
      ownershipStatus: row.ownership_status,
      format: row.format,
      currentPage: row.current_page ?? 0,
      isFavorite: row.is_favorite,
      isReread: row.is_reread,
      wouldReadAgain: row.would_read_again,
      dnfReason: row.dnf_reason,
      privateNotes: row.private_notes,
      shelves: [],
    }));
  },

  async saveBook(book: Book, options?: { readingStatus?: ReadingStatus; ownershipStatus?: OwnershipStatus }) {
    const enriched = tropeDetectionService.enrichBook(book);
    if (!supabase) return enriched;
    await supabase.from("books").upsert({
      id: enriched.id,
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
      language: enriched.language,
      source: enriched.source,
    });
    return { ...enriched, options };
  },
};
