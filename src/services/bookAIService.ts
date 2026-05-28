import type { Book, BookAIEnrichment, BookAIDebugInfo, InferredMetadataValue } from "../types";
import { normalizeTropeName } from "../data/tropeVocabulary";

const empty: BookAIEnrichment = {
  genres: [],
  tropes: [],
  moods: [],
  content_warnings: [],
  season_vibes: [],
  similar_books: [],
};

export const bookAIService = {
  async inferMetadata(book: Book): Promise<BookAIEnrichment> {
    try {
      const response = await fetch("/api/ai/enrich-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_id: book.id,
          title: book.title,
          subtitle: book.subtitle,
          author: book.authors.join(", "),
          authors: book.authors,
          description: hasUsefulDescription(book.description) ? book.description : "",
          categories: book.categories,
          subjects: book.externalSubjects ?? [],
          series_name: book.seriesName,
          community_tropes: book.tropes ?? [],
        }),
      });
      if (!response.ok) return unavailable(book, `AI endpoint returned ${response.status}.`);
      return normalizeAIResponse(await response.json(), book);
    } catch (error) {
      return unavailable(book, error instanceof Error ? error.message : "AI detection unavailable.");
    }
  },
};

function normalizeAIResponse(payload: unknown, book: Book): BookAIEnrichment {
  const source = typeof payload === "object" && payload ? payload as Record<string, any> : {};
  const debug = normalizeDebug(source.debug, book);
  if (debug.error || source.detection_unavailable) return { ...empty, detectionUnavailable: true, debug };
  return {
    ...empty,
    genres: normalizeList(source.genres),
    tropes: normalizeList(source.tropes).map(normalizeTrope).filter(Boolean) as InferredMetadataValue[],
    moods: normalizeList(source.moods),
    content_warnings: normalizeList(source.content_warnings),
    season_vibes: normalizeList(source.season_vibes),
    standalone_or_series: normalizeOne(source.possible_series_status),
    hype_rating_suggestion: normalizeOne(source.hype_rating_suggestion),
    likely_pov_type: normalizeOne(source.pov_type),
    likely_pov_count: normalizeOne(source.pov_count),
    rating_genre_suggestion: normalizeOne(source.rating_genre_suggestion),
    book_parlor_summary: normalizeOne(source.short_summary),
    similar_books: normalizeList(source.similar_books),
    suggested_rating_template: normalizeOne(source.rating_genre_suggestion),
    debug,
  };
}

function normalizeList(value: unknown): InferredMetadataValue[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeOne).filter(Boolean) as InferredMetadataValue[];
}

function normalizeOne(value: unknown): InferredMetadataValue | undefined {
  if (!value || typeof value !== "object") return undefined;
  const object = value as Record<string, unknown>;
  const text = String(object.name ?? object.value ?? "").trim();
  if (!text) return undefined;
  return {
    value: text,
    normalizedSlug: typeof object.normalized_slug === "string" ? object.normalized_slug : undefined,
    confidence: clamp(Number(object.confidence ?? 0)),
    source: "ai_inferred",
    evidence: typeof object.evidence === "string" ? object.evidence : "",
    sourceBasis: normalizeBasis(object.source_basis),
    custom: Boolean(object.custom),
  };
}

function normalizeTrope(value: InferredMetadataValue | undefined) {
  if (!value) return undefined;
  const normalized = normalizeTropeName(value.value);
  if (!normalized) return undefined;
  return {
    ...value,
    value: normalized.name,
    normalizedSlug: normalized.slug,
    custom: value.custom || normalized.custom,
  };
}

function unavailable(book: Book, error: string): BookAIEnrichment {
  return {
    ...empty,
    detectionUnavailable: true,
    debug: {
      openaiCalled: false,
      descriptionLength: hasUsefulDescription(book.description) ? book.description.length : 0,
      model: "not-called",
      returnedJson: undefined,
      fallbackUsed: false,
      savedTropeCount: 0,
      error: error || "AI detection unavailable",
    },
  };
}

function normalizeDebug(debug: unknown, book: Book): BookAIDebugInfo {
  const object = typeof debug === "object" && debug ? debug as Record<string, unknown> : {};
  return {
    openaiCalled: Boolean(object.openai_called),
    descriptionLength: typeof object.description_length === "number" ? object.description_length : hasUsefulDescription(book.description) ? book.description.length : 0,
    model: typeof object.model === "string" ? object.model : "unknown",
    returnedJson: object.returned_json,
    fallbackUsed: Boolean(object.fallback_used),
    error: typeof object.error === "string" ? object.error : undefined,
  };
}

function normalizeBasis(value: unknown): InferredMetadataValue["sourceBasis"] {
  return value === "description" || value === "metadata" || value === "known_book_knowledge" || value === "community_signal" ? value : "metadata";
}

function hasUsefulDescription(description?: string) {
  return Boolean(description && description.trim() && description !== "No description is available yet.");
}

function clamp(value: number) {
  return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(2));
}
