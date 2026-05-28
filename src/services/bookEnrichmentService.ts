import { supabase } from "../lib/supabase";
import type { Book, BookAIEnrichment, BookAISuggestion, BookEnrichmentResult, InferredMetadataValue } from "../types";
import { bookAIService } from "./bookAIService";
import { externalBookMetadataService, bookToLiveBookRow } from "./externalBookMetadataService";

export const bookEnrichmentService = {
  async enrichBook(book: Book): Promise<BookEnrichmentResult> {
    const [googleResult, openLibraryResult] = await Promise.allSettled([
      externalBookMetadataService.findBestGoogleBook(book),
      externalBookMetadataService.findBestOpenLibraryBook(book),
    ]);
    const google = googleResult.status === "fulfilled" ? googleResult.value : undefined;
    const openLibrary = openLibraryResult.status === "fulfilled" ? openLibraryResult.value : undefined;
    const merged = externalBookMetadataService.mergeBestMetadata(book, google, openLibrary);
    const work = await externalBookMetadataService.fetchOpenLibraryWork(merged.book).catch(() => undefined);
    const withWork = work ? {
      ...merged.book,
      description: firstUsefulDescription(merged.book.description, work.description) ?? merged.book.description,
      externalSubjects: Array.from(new Set([...(merged.book.externalSubjects ?? []), ...(work.externalSubjects ?? [])])),
      importedMetadata: { ...(merged.book.importedMetadata ?? {}), ...(work.importedMetadata ?? {}) },
    } : merged.book;
    const editions = await externalBookMetadataService.fetchOpenLibraryEditions(withWork).catch(() => []);
    const ai = await bookAIService.inferMetadata(withWork);
    const enriched: Book = {
      ...withWork,
      categories: mergeValues(withWork.categories, ai.genres),
      tropes: mergeValues(withWork.tropes, ai.tropes),
      moods: mergeValues(withWork.moods, ai.moods),
      importedMetadata: {
        ...(withWork.importedMetadata ?? {}),
        enrichment_audit: {
          last_run_at: new Date().toISOString(),
          factual_sources: merged.sources,
          ai_suggestions_table: "book_ai_suggestions",
        },
        metadata_status: metadataStatus(merged.book, ai),
      },
    };
    await saveEnrichment(enriched);
    await saveEditions(enriched, editions);
    await trySaveRelationalSuggestions(enriched, ai, "ai_inferred");
    const suggestions = await saveAISuggestions(enriched.id, ai);
    return { book: enriched, ai, suggestions, factualSources: merged.sources, pageCountVariesByEdition: merged.pageCountVariesByEdition };
  },

  async listEditions(book: Book) {
    if (!supabase) return externalBookMetadataService.fetchOpenLibraryEditions(book).catch(() => []);
    const { data, error } = await supabase.from("book_editions").select("*").eq("book_id", book.id).order("published_year", { ascending: true });
    if (!error && data?.length) return data.map(mapEditionRow);
    return externalBookMetadataService.fetchOpenLibraryEditions(book).catch(() => []);
  },

  async listAISuggestions(bookId: string, status: "pending" | "accepted" | "rejected" = "pending"): Promise<BookAISuggestion[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("book_ai_suggestions")
      .select("*")
      .eq("book_id", bookId)
      .eq("status", status)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map(mapSuggestionRow);
  },

  async acceptAISuggestions(book: Book, suggestions: BookAISuggestion[]): Promise<Book> {
    const pending = suggestions.filter((suggestion) => suggestion.status === "pending");
    const ai = suggestionsToAI(pending);
    const next: Book = {
      ...book,
      categories: mergeValues(book.categories, ai.genres),
      tropes: mergeValues(book.tropes, ai.tropes),
      moods: mergeValues(book.moods, ai.moods),
      contentWarnings: mergeValues(book.contentWarnings ?? [], ai.content_warnings),
      aiSummary: firstSuggestionValue(ai.book_parlor_summary) ?? book.aiSummary,
    };
    await saveEnrichment(next);
    await trySaveRelationalSuggestions(next, ai, "ai_inferred");
    await updateSuggestionStatus(pending.map((suggestion) => suggestion.id), "accepted");
    return next;
  },

  async rejectAISuggestions(suggestions: BookAISuggestion[]): Promise<void> {
    await updateSuggestionStatus(suggestions.filter((suggestion) => suggestion.status === "pending").map((suggestion) => suggestion.id), "rejected");
  },

  metadataStatus,
};

async function saveAISuggestions(bookId: string, ai: BookAIEnrichment): Promise<BookAISuggestion[]> {
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;
  const rows = aiToSuggestionRows(bookId, userId, ai);
  if (!rows.length) return [];
  const { data, error } = await supabase.from("book_ai_suggestions").insert(rows).select("*");
  if (error) {
    console.error("Book Parlor AI suggestion save failed", error);
    return [];
  }
  return (data ?? []).map(mapSuggestionRow);
}

async function saveEnrichment(book: Book) {
  if (!supabase) return;
  const { error } = await supabase.from("books").upsert(bookToLiveBookRow(book));
  if (error) {
    const fallback = await supabase.from("books").upsert({
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
      published_year: book.publishedYear,
      language: book.language,
      source: book.source,
    });
    if (fallback.error) console.warn("Book Parlor factual enrichment skipped", error, fallback.error);
  }
}

async function saveEditions(book: Book, editions: import("../types").BookEdition[]) {
  if (!supabase || !editions.length) return;
  const rows = editions.map((edition) => ({
    book_id: book.id,
    source: edition.source,
    source_edition_id: edition.openlibraryEditionKey ?? edition.googleBooksId ?? edition.id,
    edition_title: edition.editionTitle,
    format: edition.format,
    isbn_10: edition.isbn10,
    isbn_13: edition.isbn13,
    page_count: edition.pageCount,
    language: edition.language,
    publisher: edition.publisher,
    published_date: edition.publishedDate,
    published_year: edition.publishedYear,
    cover_url: edition.coverUrl,
    imported_metadata: edition,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("book_editions").upsert(rows, { onConflict: "book_id,source,source_edition_id" });
  if (error) console.warn("Book Parlor edition save skipped", error);
}

async function trySaveRelationalSuggestions(book: Book, ai: BookAIEnrichment, source: "ai_inferred") {
  if (!supabase) return;
  try {
    const { data: userData } = await supabase.auth.getUser();
    await Promise.all([
      saveNamedLinks("tropes", "book_tropes", "trope_id", book.id, ai.tropes, source),
      saveNamedLinks("moods", "book_moods", "mood_id", book.id, ai.moods, source),
      saveContentWarnings(book.id, userData.user?.id, ai.content_warnings, source),
    ]);
  } catch {
    // The pending/accepted suggestion rows remain intact even if relation tables need a policy update.
  }
}

async function saveNamedLinks(table: "tropes" | "moods", linkTable: "book_tropes" | "book_moods", foreignKey: "trope_id" | "mood_id", bookId: string, values: InferredMetadataValue[], source: "ai_inferred") {
  const rows = values.map((item) => ({ name: item.value, slug: slugify(item.value), category: source }));
  if (!rows.length || !supabase) return;
  await supabase.from(table).upsert(rows, { onConflict: "slug" });
  const { data } = await supabase.from(table).select("id, slug").in("slug", rows.map((row) => row.slug));
  const links = (data ?? []).map((row: any) => ({ book_id: bookId, [foreignKey]: row.id, source, confidence: values.find((item) => slugify(item.value) === row.slug)?.confidence }));
  if (links.length) await supabase.from(linkTable).upsert(links);
}

async function saveContentWarnings(bookId: string, userId: string | undefined, values: InferredMetadataValue[], source: "ai_inferred") {
  if (!values.length || !supabase || !userId) return;
  const rows = values.map((item) => ({ name: item.value, slug: slugify(item.value) }));
  await supabase.from("content_warnings").upsert(rows, { onConflict: "slug" });
  const { data } = await supabase.from("content_warnings").select("id, slug").in("slug", rows.map((row) => row.slug));
  const links = (data ?? []).map((row: any) => ({
    book_id: bookId,
    warning_id: row.id,
    user_id: userId,
    source,
    confidence: values.find((item) => slugify(item.value) === row.slug)?.confidence,
  }));
  if (links.length) await supabase.from("book_content_warnings").upsert(links);
}

function mergeValues(current: string[], suggestions: InferredMetadataValue[]) {
  return Array.from(new Set([...current, ...suggestions.filter((item) => item.confidence >= 0.34).map((item) => item.value)]));
}

function metadataStatus(book: Book, ai?: BookAIEnrichment) {
  const missing: string[] = [];
  if (!book.description || book.description === "No description is available yet.") missing.push("Missing description");
  if (!book.pageCount) missing.push("Missing page count");
  if (!book.categories.length) missing.push("Missing genres");
  if (ai && Object.values(ai).some((value) => Array.isArray(value) ? value.length : Boolean(value))) missing.push("AI inferred");
  if (!missing.length) return "Complete";
  if (missing.length > 2) return "Needs enrichment";
  return missing.join(" · ");
}

function aiToSuggestionRows(bookId: string, userId: string | null, ai: BookAIEnrichment) {
  const rows: Array<Record<string, unknown>> = [];
  const addList = (fieldName: string, values: InferredMetadataValue[]) => values.forEach((value) => rows.push(suggestionRow(bookId, userId, fieldName, value)));
  const addOne = (fieldName: string, value?: InferredMetadataValue) => {
    if (value) rows.push(suggestionRow(bookId, userId, fieldName, value));
  };
  addList("genres", ai.genres);
  addList("tropes", ai.tropes);
  addList("moods", ai.moods);
  addList("content_warnings", ai.content_warnings);
  addList("season_vibes", ai.season_vibes);
  addList("similar_books", ai.similar_books);
  addOne("standalone_or_series", ai.standalone_or_series);
  addOne("series_type", ai.series_type);
  addOne("likely_pov_type", ai.likely_pov_type);
  addOne("likely_pov_count", ai.likely_pov_count);
  addOne("hype_rating_suggestion", ai.hype_rating_suggestion);
  addOne("rating_genre_suggestion", ai.rating_genre_suggestion);
  addOne("reading_vibe", ai.reading_vibe);
  addOne("book_parlor_summary", ai.book_parlor_summary);
  addOne("suggested_rating_template", ai.suggested_rating_template);
  return rows;
}

function suggestionRow(bookId: string, userId: string | null, fieldName: string, value: InferredMetadataValue) {
  return {
    book_id: bookId,
    user_id: userId,
    field_name: fieldName,
    suggested_value: value,
    confidence: value.confidence,
    source: "ai_inferred",
    status: "pending",
  };
}

function mapSuggestionRow(row: any): BookAISuggestion {
  return {
    id: row.id,
    bookId: row.book_id,
    userId: row.user_id,
    fieldName: row.field_name,
    suggestedValue: row.suggested_value,
    confidence: Number(row.confidence ?? row.suggested_value?.confidence ?? 0),
    source: "ai_inferred",
    status: row.status,
  };
}

async function updateSuggestionStatus(ids: string[], status: "accepted" | "rejected") {
  if (!supabase || !ids.length) return;
  const { error } = await supabase.from("book_ai_suggestions").update({ status, updated_at: new Date().toISOString() }).in("id", ids);
  if (error) {
    console.error("Book Parlor AI suggestion status update failed", error);
    throw new Error("ai_suggestion_status_failed");
  }
}

function suggestionsToAI(suggestions: BookAISuggestion[]): BookAIEnrichment {
  const findList = (fieldName: string) => suggestions.filter((suggestion) => suggestion.fieldName === fieldName).map((suggestion) => normalizeSuggestedValue(suggestion.suggestedValue)).filter(Boolean) as InferredMetadataValue[];
  const findOne = (fieldName: string) => normalizeSuggestedValue(suggestions.find((suggestion) => suggestion.fieldName === fieldName)?.suggestedValue);
  return {
    genres: findList("genres"),
    tropes: findList("tropes"),
    moods: findList("moods"),
    content_warnings: findList("content_warnings"),
    season_vibes: findList("season_vibes"),
    standalone_or_series: findOne("standalone_or_series"),
    series_type: findOne("series_type"),
    likely_pov_type: findOne("likely_pov_type"),
    likely_pov_count: findOne("likely_pov_count"),
    hype_rating_suggestion: findOne("hype_rating_suggestion"),
    rating_genre_suggestion: findOne("rating_genre_suggestion"),
    reading_vibe: findOne("reading_vibe"),
    book_parlor_summary: findOne("book_parlor_summary"),
    similar_books: findList("similar_books"),
    suggested_rating_template: findOne("suggested_rating_template"),
  };
}

function normalizeSuggestedValue(value: BookAISuggestion["suggestedValue"] | undefined): InferredMetadataValue | undefined {
  if (!value || Array.isArray(value)) return undefined;
  return value;
}

function firstSuggestionValue(value?: InferredMetadataValue) {
  return value?.value;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function firstUsefulDescription(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim() && value !== "No description is available yet.");
}

function mapEditionRow(row: any): import("../types").BookEdition {
  return {
    id: `${row.source}:${row.source_edition_id ?? row.id}`,
    databaseId: row.id,
    bookId: row.book_id,
    editionTitle: row.edition_title ?? "Edition",
    format: row.format,
    isbn10: row.isbn_10,
    isbn13: row.isbn_13,
    pageCount: row.page_count,
    language: row.language,
    publisher: row.publisher,
    publishedDate: row.published_date,
    publishedYear: row.published_year,
    coverUrl: row.cover_url,
    source: row.source,
    openlibraryEditionKey: row.source === "open_library" ? row.source_edition_id : undefined,
    googleBooksId: row.source === "google_books" ? row.source_edition_id : undefined,
  };
}
