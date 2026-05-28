import { isUuid, stableUuid } from "../lib/ids";
import { supabase } from "../lib/supabase";
import type { Book, BookEdition } from "../types";
import { tropeDetectionService } from "./tropeDetectionService";

const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes";
const OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json";
const OPEN_LIBRARY_ISBN_URL = "https://openlibrary.org/isbn";
const OPEN_LIBRARY_BASE_URL = "https://openlibrary.org";

type GoogleVolume = {
  id: string;
  volumeInfo?: Record<string, any>;
};

export const externalBookMetadataService = {
  async searchGoogleBooks(query: string): Promise<Book[]> {
    if (!query.trim()) return [];
    const key = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
    const url = `${GOOGLE_BOOKS_URL}?q=${encodeURIComponent(query)}&maxResults=12${key ? `&key=${key}` : ""}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Google Books search is unavailable right now.");
    const data = await response.json();
    const books = (data.items ?? []).map((volume: GoogleVolume) => this.normalizeGoogleBook(volume)).filter((book: Book) => book.title);
    cacheBooks(books);
    return books;
  },

  async fetchGoogleBookById(id: string): Promise<Book | undefined> {
    const key = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
    const response = await fetch(`${GOOGLE_BOOKS_URL}/${encodeURIComponent(id)}${key ? `?key=${key}` : ""}`);
    if (!response.ok) return undefined;
    const book = this.normalizeGoogleBook(await response.json());
    cacheBooks([book]);
    return book;
  },

  async findBestGoogleBook(book: Book): Promise<Book | undefined> {
    if (book.googleBooksId) return this.fetchGoogleBookById(book.googleBooksId);
    const isbn = book.isbn13 ?? book.isbn10;
    const query = isbn ? `isbn:${isbn}` : `${book.title} ${book.authors[0] ?? ""}`;
    return (await this.searchGoogleBooks(query))[0];
  },

  async searchOpenLibrary(query: string): Promise<Book[]> {
    if (!query.trim()) return [];
    const response = await fetch(`${OPEN_LIBRARY_SEARCH_URL}?q=${encodeURIComponent(query)}&limit=12`);
    if (!response.ok) throw new Error("Open Library fallback is unavailable right now.");
    const data = await response.json();
    const books = (data.docs ?? []).map((result: any) => this.normalizeOpenLibraryBook(result)).filter((book: Book) => book.title);
    cacheBooks(books);
    return books;
  },

  async fetchOpenLibraryByIsbn(isbn: string): Promise<Book | undefined> {
    const response = await fetch(`${OPEN_LIBRARY_ISBN_URL}/${encodeURIComponent(isbn)}.json`);
    if (!response.ok) return undefined;
    const data = await response.json();
    return this.normalizeOpenLibraryEdition(data);
  },

  async findBestOpenLibraryBook(book: Book): Promise<Book | undefined> {
    const isbn = book.isbn13 ?? book.isbn10;
    if (isbn) {
      const edition = await this.fetchOpenLibraryByIsbn(isbn);
      if (edition) return edition;
    }
    return (await this.searchOpenLibrary(`${book.title} ${book.authors[0] ?? ""}`))[0];
  },

  async fetchOpenLibraryEditions(book: Book): Promise<BookEdition[]> {
    const workKey = book.openlibraryWorkKey;
    if (!workKey) return [];
    const response = await fetch(`${OPEN_LIBRARY_BASE_URL}${workKey}/editions.json?limit=24`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.entries ?? []).map((entry: any) => normalizeOpenLibraryEditionToEdition(entry)).filter(Boolean);
  },

  async fetchOpenLibraryWork(book: Book): Promise<Partial<Book> | undefined> {
    if (!book.openlibraryWorkKey) return undefined;
    const response = await fetch(`${OPEN_LIBRARY_BASE_URL}${book.openlibraryWorkKey}.json`);
    if (!response.ok) return undefined;
    const data = await response.json();
    return {
      description: data.description?.value ?? data.description,
      externalSubjects: data.subjects?.slice(0, 40),
      importedMetadata: {
        open_library_work: {
          key: data.key,
          title: data.title,
          subjects: data.subjects?.slice(0, 40),
          description: data.description?.value ?? data.description,
        },
      },
    };
  },

  normalizeGoogleBook(volume: GoogleVolume): Book {
    const info = volume.volumeInfo ?? {};
    const industryIds = info.industryIdentifiers ?? [];
    const isbn10 = industryIds.find((id: any) => id.type === "ISBN_10")?.identifier;
    const isbn13 = industryIds.find((id: any) => id.type === "ISBN_13")?.identifier;
    const publishedDate = info.publishedDate as string | undefined;
    const book = tropeDetectionService.enrichBook({
      id: stableUuid(`google_books:${volume.id}`),
      externalId: volume.id,
      googleBooksId: volume.id,
      title: info.title ?? "Untitled book",
      subtitle: info.subtitle,
      authors: info.authors ?? ["Unknown author"],
      description: info.description ?? "No description is available yet.",
      coverUrl: normalizeCover(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
      isbn10,
      isbn13,
      pageCount: info.pageCount,
      publisher: info.publisher,
      publishedDate,
      publishedYear: publishedDate ? Number(String(publishedDate).slice(0, 4)) : undefined,
      editionTitle: info.subtitle ? `${info.title}: ${info.subtitle}` : info.title,
      format: info.printType,
      categories: info.categories ?? [],
      language: info.language,
      source: "google_books",
      externalAverageRating: typeof info.averageRating === "number" ? info.averageRating : undefined,
      externalRatingsCount: typeof info.ratingsCount === "number" ? info.ratingsCount : undefined,
      externalRatingSource: typeof info.averageRating === "number" ? "google_books" : undefined,
      externalSubjects: info.categories ?? [],
      importedMetadata: {
        googleBooksId: volume.id,
        averageRating: info.averageRating,
        ratingsCount: info.ratingsCount,
        categories: info.categories,
        publishedDate,
        maturityRating: info.maturityRating,
        printType: info.printType,
        canonicalVolumeLink: info.canonicalVolumeLink,
        infoLink: info.infoLink,
      },
      tropes: [],
      moods: [],
    });
    return book;
  },

  normalizeOpenLibraryBook(result: any): Book {
    const isbn = result.isbn?.[0];
    const externalId = result.key ?? result.edition_key?.[0] ?? isbn ?? result.title;
    return tropeDetectionService.enrichBook({
      id: stableUuid(`open_library:${externalId}`),
      externalId,
      openlibraryWorkKey: result.key,
      openlibraryEditionKey: result.edition_key?.[0],
      title: result.title ?? "Untitled book",
      authors: result.author_name ?? ["Unknown author"],
      description: result.first_sentence?.[0] ?? "No description is available yet.",
      coverUrl: result.cover_i ? `https://covers.openlibrary.org/b/id/${result.cover_i}-L.jpg` : undefined,
      isbn10: isbn?.length === 10 ? isbn : undefined,
      isbn13: isbn?.length === 13 ? isbn : undefined,
      pageCount: result.number_of_pages_median,
      publisher: result.publisher?.[0],
      publishedYear: result.first_publish_year,
      publishedDate: result.first_publish_year ? String(result.first_publish_year) : undefined,
      editionTitle: result.edition_key?.[0] ?? result.title,
      categories: result.subject?.slice(0, 8) ?? [],
      language: result.language?.[0],
      source: "open_library",
      externalSubjects: result.subject?.slice(0, 24) ?? [],
      importedMetadata: {
        openlibraryWorkKey: result.key,
        openlibraryEditionKey: result.edition_key?.[0],
        coverId: result.cover_i,
        subjects: result.subject?.slice(0, 24),
        firstPublishYear: result.first_publish_year,
        editionCount: result.edition_count,
      },
      tropes: [],
      moods: [],
    });
  },

  normalizeOpenLibraryEdition(result: any): Book {
    const isbn13 = result.isbn_13?.[0];
    const isbn10 = result.isbn_10?.[0];
    const workKey = result.works?.[0]?.key;
    const publishedYear = result.publish_date ? Number(String(result.publish_date).match(/\d{4}/)?.[0]) : undefined;
    return tropeDetectionService.enrichBook({
      id: stableUuid(`open_library:${result.key ?? isbn13 ?? isbn10 ?? result.title}`),
      externalId: result.key ?? isbn13 ?? isbn10 ?? result.title,
      openlibraryWorkKey: workKey,
      openlibraryEditionKey: result.key,
      title: result.title ?? "Untitled book",
      authors: ["Unknown author"],
      description: result.description?.value ?? result.description ?? "No description is available yet.",
      coverUrl: result.covers?.[0] ? `https://covers.openlibrary.org/b/id/${result.covers[0]}-L.jpg` : undefined,
      isbn10,
      isbn13,
      pageCount: result.number_of_pages,
      publisher: result.publishers?.[0],
      publishedDate: result.publish_date,
      publishedYear,
      editionTitle: result.edition_name ?? result.title,
      categories: result.subjects?.slice(0, 8) ?? [],
      language: result.languages?.[0]?.key?.replace("/languages/", ""),
      source: "open_library",
      externalSubjects: result.subjects?.slice(0, 24) ?? [],
      importedMetadata: {
        openlibraryWorkKey: workKey,
        openlibraryEditionKey: result.key,
        editionName: result.edition_name,
        publishDate: result.publish_date,
        numberOfPages: result.number_of_pages,
        subjects: result.subjects?.slice(0, 24),
        source: "open_library",
      },
      tropes: [],
      moods: [],
    });
  },

  mergeBestMetadata(current: Book, google?: Book, openLibrary?: Book): { book: Book; sources: Array<"google_books" | "open_library">; pageCountVariesByEdition: boolean } {
    const sources: Array<"google_books" | "open_library"> = [];
    if (google) sources.push("google_books");
    if (openLibrary) sources.push("open_library");
    const openLibraryPageCount = openLibrary?.pageCount;
    const googlePageCount = google?.pageCount;
    const series = detectSeriesMetadata(current, google, openLibrary);
    return {
      sources,
      pageCountVariesByEdition: Boolean(googlePageCount && openLibraryPageCount && googlePageCount !== openLibraryPageCount),
      book: {
        ...current,
        title: firstText(google?.title, openLibrary?.title, current.title) ?? current.title,
        subtitle: firstText(google?.subtitle, current.subtitle, openLibrary?.subtitle),
        authors: firstArray(google?.authors, current.authors, openLibrary?.authors),
        description: firstUsefulDescription(google?.description, openLibrary?.description, current.description) ?? "No description is available yet.",
        coverUrl: firstText(google?.coverUrl, openLibrary?.coverUrl, current.coverUrl),
        isbn10: firstText(google?.isbn10, openLibrary?.isbn10, current.isbn10),
        isbn13: firstText(google?.isbn13, openLibrary?.isbn13, current.isbn13),
        pageCount: google?.pageCount ?? openLibrary?.pageCount ?? current.pageCount,
        publisher: firstText(google?.publisher, openLibrary?.publisher, current.publisher),
        publishedDate: firstText(google?.publishedDate, openLibrary?.publishedDate, current.publishedDate),
        publishedYear: google?.publishedYear ?? openLibrary?.publishedYear ?? current.publishedYear,
        editionTitle: firstText(google?.editionTitle, openLibrary?.editionTitle, current.editionTitle),
        format: firstText(google?.format, openLibrary?.format, current.format),
        seriesName: series.seriesName ?? current.seriesName,
        seriesPosition: series.seriesPosition ?? current.seriesPosition,
        categories: firstArray(google?.categories, current.categories, openLibrary?.categories),
        language: firstText(google?.language, openLibrary?.language, current.language),
        source: google ? "google_books" : openLibrary ? "open_library" : current.source,
        googleBooksId: google?.googleBooksId ?? current.googleBooksId,
        openlibraryWorkKey: openLibrary?.openlibraryWorkKey ?? current.openlibraryWorkKey,
        openlibraryEditionKey: openLibrary?.openlibraryEditionKey ?? current.openlibraryEditionKey,
        externalAverageRating: google?.externalAverageRating ?? current.externalAverageRating,
        externalRatingsCount: google?.externalRatingsCount ?? current.externalRatingsCount,
        externalRatingSource: google?.externalRatingSource ?? current.externalRatingSource,
        externalSubjects: Array.from(new Set([...(current.externalSubjects ?? []), ...(google?.externalSubjects ?? []), ...(openLibrary?.externalSubjects ?? [])])),
        importedMetadata: {
          ...(current.importedMetadata ?? {}),
          google_books: google?.importedMetadata,
          open_library: openLibrary?.importedMetadata,
          enrichment_sources: sources,
          page_count_varies_by_edition: Boolean(googlePageCount && openLibraryPageCount && googlePageCount !== openLibraryPageCount),
        },
        tropes: current.tropes,
        moods: current.moods,
        contentWarnings: current.contentWarnings,
      },
    };
  },

  async upsertBookFromExternalMetadata(book: Book): Promise<Book> {
    const enriched = tropeDetectionService.enrichBook({
      ...book,
      id: isUuid(book.id) ? book.id : stableUuid(`${book.source}:${book.externalId ?? book.isbn13 ?? book.title}`),
    });
    if (!supabase) return enriched;
    const { error } = await supabase.from("books").upsert(bookToLiveBookRow(enriched));
    if (error) {
      const fallback = await supabase.from("books").upsert(bookToRequiredBookRow(enriched));
      if (fallback.error) {
        console.error("Book Parlor book metadata save failed", error, fallback.error);
        throw new Error("book_save_failed");
      }
    }
    return enriched;
  },
};

function detectSeriesMetadata(...books: Array<Book | undefined>) {
  const text = books
    .filter(Boolean)
    .map((book) => `${book?.title ?? ""} ${book?.subtitle ?? ""} ${book?.description ?? ""} ${JSON.stringify(book?.importedMetadata ?? {})}`)
    .join(" ");
  const patterns = [
    /(.+?)(?:,|\s+)\s*#\s*(\d+(?:\.\d+)?)/i,
    /(.+?)(?:,|\s+)\s*book\s+(\d+(?:\.\d+)?)/i,
    /book\s+(\d+(?:\.\d+)?)\s+(?:in|of)\s+the\s+(.+?)\s+series/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    if (pattern.source.startsWith("book")) return { seriesName: cleanSeriesName(match[2]), seriesPosition: match[1] };
    return { seriesName: cleanSeriesName(match[1]), seriesPosition: match[2] };
  }
  return {};
}

function cleanSeriesName(value?: string) {
  return value?.replace(/\bseries\b/gi, "").replace(/["()[\]]/g, "").trim();
}

function firstText(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim());
}

function firstArray(...values: Array<string[] | undefined>) {
  return values.find((value) => value?.length) ?? [];
}

function firstUsefulDescription(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim() && value !== "No description is available yet.");
}

function normalizeOpenLibraryEditionToEdition(entry: any): BookEdition {
  const isbn10 = entry.isbn_10?.[0];
  const isbn13 = entry.isbn_13?.[0];
  const publishedYear = entry.publish_date ? Number(String(entry.publish_date).match(/\d{4}/)?.[0]) : undefined;
  return {
    id: `open_library:${entry.key ?? isbn13 ?? isbn10 ?? entry.title}`,
    editionTitle: entry.edition_name ?? entry.title ?? "Open Library edition",
    format: entry.physical_format,
    isbn10,
    isbn13,
    pageCount: entry.number_of_pages,
    language: entry.languages?.[0]?.key?.replace("/languages/", ""),
    publisher: entry.publishers?.[0],
    publishedDate: entry.publish_date,
    publishedYear,
    coverUrl: entry.covers?.[0] ? `https://covers.openlibrary.org/b/id/${entry.covers[0]}-L.jpg` : undefined,
    source: "open_library",
    openlibraryEditionKey: entry.key,
  };
}

export function getCachedExternalBook(bookId: string): Book | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const cache = JSON.parse(window.sessionStorage.getItem("book-parlor.external-books") ?? "{}") as Record<string, Book>;
    return cache[bookId];
  } catch {
    return undefined;
  }
}

function cacheBooks(books: Book[]) {
  if (typeof window === "undefined") return;
  try {
    const cache = JSON.parse(window.sessionStorage.getItem("book-parlor.external-books") ?? "{}") as Record<string, Book>;
    books.forEach((book) => {
      cache[book.id] = book;
    });
    window.sessionStorage.setItem("book-parlor.external-books", JSON.stringify(cache));
  } catch {
    // Session cache is an enhancement only; external searches still work without it.
  }
}

export function bookToBookRow(book: Book) {
  return bookToLiveBookRow(book);
}

export function bookToLiveBookRow(book: Book) {
  return {
    id: book.id,
    google_books_id: book.googleBooksId,
    openlibrary_work_key: book.openlibraryWorkKey,
    openlibrary_edition_key: book.openlibraryEditionKey,
    external_average_rating: book.externalAverageRating,
    external_ratings_count: book.externalRatingsCount,
    external_rating_source: book.externalRatingSource,
    external_categories: book.categories ?? [],
    external_subjects: book.externalSubjects ?? book.categories ?? [],
    imported_metadata: book.importedMetadata ?? {},
    ai_summary: book.aiSummary,
    metadata_last_synced_at: new Date().toISOString(),
    title: book.title,
    subtitle: book.subtitle,
    authors: book.authors,
    description: book.description,
    cover_url: book.coverUrl,
    isbn_10: book.isbn10,
    isbn_13: book.isbn13,
    page_count: book.pageCount,
    publisher: book.publisher,
    published_date: book.publishedDate,
    published_year: book.publishedYear,
    edition_title: book.editionTitle,
    format: book.format,
    series_name: book.seriesName,
    series_position: book.seriesPosition,
    language: book.language,
    source: book.source,
  };
}

export function bookToBaseBookRow(book: Book) {
  return bookToRequiredBookRow(book);
}

export function bookToRequiredBookRow(book: Book) {
  return {
    id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    authors: book.authors,
    description: book.description,
    cover_url: book.coverUrl,
    isbn_10: book.isbn10,
    isbn_13: book.isbn13,
    page_count: book.pageCount,
    publisher: book.publisher,
    published_date: book.publishedDate,
    published_year: book.publishedYear,
    edition_title: book.editionTitle,
    format: book.format,
    language: book.language,
    source: book.source,
  };
}

const normalizeCover = (url?: string) => url?.replace("http://", "https://");
