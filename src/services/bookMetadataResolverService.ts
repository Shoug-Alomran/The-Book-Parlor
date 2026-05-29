import type { Book, ResolvedBookFacts, SourcedFact } from "../types";

type ResolverResponse = ResolvedBookFacts & {
  debug?: {
    search_provider?: string;
    query_count?: number;
    result_count?: number;
    openai_called?: boolean;
    error?: string;
  };
};

export type BookMetadataResolverResult = {
  facts: ResolvedBookFacts;
  debug?: ResolverResponse["debug"];
};

export const bookMetadataResolverService = {
  async searchBookMetadata(book: Book): Promise<BookMetadataResolverResult> {
    const response = await fetch("/api/metadata/search-book-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: book.title,
        author: book.authors?.[0],
        isbn: book.isbn13 ?? book.isbn10,
      }),
    });
    if (!response.ok) throw new Error("metadata_resolver_failed");
    const payload = await response.json() as ResolverResponse;
    return {
      facts: pickFacts(payload),
      debug: payload.debug,
    };
  },
};

function pickFacts(payload: ResolverResponse): ResolvedBookFacts {
  return {
    page_count: cleanFact(payload.page_count),
    format: cleanFact(payload.format),
    series_name: cleanFact(payload.series_name),
    series_position: cleanFact(payload.series_position),
    publisher: cleanFact(payload.publisher),
    isbn_10: cleanFact(payload.isbn_10),
    isbn_13: cleanFact(payload.isbn_13),
    published_date: cleanFact(payload.published_date),
    language: cleanFact(payload.language),
  };
}

function cleanFact<T extends string | number>(fact?: SourcedFact<T>) {
  if (!fact || fact.value === undefined || fact.value === null || !fact.source) return undefined;
  return fact;
}
