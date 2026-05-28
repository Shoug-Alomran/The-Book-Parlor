import { contentWarnings, moods, tropes } from "../data/constants";
import { ratingGenres } from "../data/ratingTemplates";
import type { Book, BookAIEnrichment, InferredMetadataValue } from "../types";

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
          author: book.authors.join(", "),
          authors: book.authors,
          description: hasUsefulDescription(book.description) ? book.description : "",
          categories: book.categories,
          subjects: book.externalSubjects ?? [],
          importedMetadata: book.importedMetadata ?? {},
        }),
      });
      if (response.ok) return normalizeAIResponse(await response.json());
    } catch {
      // Local heuristic fallback keeps enrichment useful in development and without server AI keys.
    }
    return inferCautiously(book);
  },
};

function normalizeAIResponse(payload: unknown): BookAIEnrichment {
  const source = typeof payload === "object" && payload ? payload as Record<string, unknown> : {};
  const confidence = typeof source.confidence === "object" && source.confidence ? source.confidence as Record<string, unknown> : {};
  return {
    ...empty,
    tropes: normalizeList(source.tropes, "tropes", confidence),
    moods: normalizeList(source.moods, "moods", confidence),
    content_warnings: normalizeList(source.content_warnings, "content_warnings", confidence),
    season_vibes: normalizeList(source.season_vibes, "season_vibes", confidence),
    likely_pov_type: normalizeOne(source.pov_type ?? source.likely_pov_type, "pov_type", confidence),
    likely_pov_count: normalizeOne(source.pov_count ?? source.likely_pov_count, "pov_count", confidence),
    rating_genre_suggestion: normalizeOne(source.rating_genre_suggestion, "rating_genre_suggestion", confidence),
    reading_vibe: normalizeOne(source.reading_vibe, "reading_vibe", confidence),
    book_parlor_summary: normalizeOne(source.short_summary ?? source.book_parlor_summary, "short_summary", confidence),
    similar_books: normalizeList(source.similar_books, "similar_books", confidence),
    suggested_rating_template: normalizeOne(source.rating_genre_suggestion ?? source.suggested_rating_template, "rating_genre_suggestion", confidence),
  };
}

function normalizeList(value: unknown, fieldName = "", confidence: Record<string, unknown> = {}): InferredMetadataValue[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeOne(item, fieldName, confidence)).filter(Boolean) as InferredMetadataValue[];
}

function normalizeOne(value: unknown, fieldName = "", confidence: Record<string, unknown> = {}): InferredMetadataValue | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return inferred(value, confidenceFor(fieldName, value, confidence));
  if (typeof value !== "object") return undefined;
  const object = value as Record<string, unknown>;
  const text = String(object.value ?? "").trim();
  if (!text) return undefined;
  const itemConfidence = typeof object.confidence === "number" ? object.confidence : confidenceFor(fieldName, text, confidence);
  return inferred(text, itemConfidence);
}

function confidenceFor(fieldName: string, value: string, confidence: Record<string, unknown>) {
  const fieldConfidence = confidence[fieldName];
  if (typeof fieldConfidence === "number") return fieldConfidence;
  if (fieldConfidence && typeof fieldConfidence === "object") {
    const direct = (fieldConfidence as Record<string, unknown>)[value];
    if (typeof direct === "number") return direct;
  }
  return 0.45;
}

function inferCautiously(book: Book): BookAIEnrichment {
  const text = `${book.title} ${book.authors.join(" ")} ${book.description} ${book.categories.join(" ")} ${(book.externalSubjects ?? []).join(" ")}`.toLowerCase();
  const baseConfidence = hasUsefulDescription(book.description) ? 0.62 : 0.38;
  const foundTropes = tropes.filter((trope) => text.includes(trope.replace(/-/g, " "))).slice(0, 6);
  const foundMoods = moods.filter((mood) => text.includes(mood)).slice(0, 5);
  const foundWarnings = contentWarnings.filter((warning) => text.includes(warning)).slice(0, 4);
  const foundGenre = ratingGenres.find((genre) => text.includes(genre.toLowerCase())) ?? book.categories[0] ?? "Other";
  const summary = hasUsefulDescription(book.description)
    ? `A ${foundGenre.toLowerCase()} read with ${[...foundMoods, ...foundTropes].slice(0, 3).join(", ") || "a distinct reading mood"}.`
    : `AI can only infer this cautiously from the title, author, categories, and subjects until a real description is added.`;

  return {
    genres: [inferred(foundGenre, baseConfidence)],
    tropes: foundTropes.map((value) => inferred(value, baseConfidence)),
    moods: (foundMoods.length ? foundMoods : ["cozy"]).map((value) => inferred(value, Math.min(0.7, baseConfidence))),
    content_warnings: foundWarnings.map((value) => inferred(value, Math.max(0.3, baseConfidence - 0.12))),
    season_vibes: [inferred(seasonFromText(text), Math.max(0.34, baseConfidence - 0.1))],
    standalone_or_series: inferred(text.includes("series") || /\bbook [0-9]\b/.test(text) ? "series" : "standalone", Math.max(0.36, baseConfidence - 0.08)),
    series_type: inferred(text.includes("trilogy") ? "Trilogy" : text.includes("novella") ? "Novella" : text.includes("series") ? "Series" : "Standalone", Math.max(0.34, baseConfidence - 0.12)),
    likely_pov_type: inferred(text.includes("memoir") || text.includes("diary") ? "1st Person" : "3rd Person", Math.max(0.32, baseConfidence - 0.18)),
    likely_pov_count: inferred(text.includes("dual") ? "Dual POV" : "Single POV", Math.max(0.32, baseConfidence - 0.18)),
    hype_rating_suggestion: inferred("Appropriately Rated", 0.3),
    rating_genre_suggestion: inferred(foundGenre, baseConfidence),
    reading_vibe: inferred([foundGenre, ...foundMoods].filter(Boolean).join(" / "), baseConfidence),
    book_parlor_summary: inferred(summary, baseConfidence),
    similar_books: [],
    suggested_rating_template: inferred(ratingGenres.includes(foundGenre as any) ? foundGenre : "Other", baseConfidence),
  };
}

function inferred(value: string, confidence: number): InferredMetadataValue {
  return { value, confidence: Number(Math.max(0.1, Math.min(0.95, confidence)).toFixed(2)), source: "ai_inferred" };
}

function hasUsefulDescription(description?: string) {
  return Boolean(description && description.trim() && description !== "No description is available yet.");
}

function seasonFromText(text: string) {
  if (/winter|snow|holiday|christmas|frost/.test(text)) return "winter";
  if (/summer|beach|vacation|sun/.test(text)) return "summer";
  if (/autumn|fall|school|campus|halloween/.test(text)) return "autumn";
  return "spring";
}
