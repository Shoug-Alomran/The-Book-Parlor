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
      const response = await fetch("/api/enrich-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: book.title,
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
  return {
    ...empty,
    genres: normalizeList(source.genres),
    tropes: normalizeList(source.tropes),
    moods: normalizeList(source.moods),
    content_warnings: normalizeList(source.content_warnings),
    season_vibes: normalizeList(source.season_vibes),
    standalone_or_series: normalizeOne(source.standalone_or_series),
    series_type: normalizeOne(source.series_type),
    likely_pov_type: normalizeOne(source.likely_pov_type),
    likely_pov_count: normalizeOne(source.likely_pov_count),
    hype_rating_suggestion: normalizeOne(source.hype_rating_suggestion),
    rating_genre_suggestion: normalizeOne(source.rating_genre_suggestion),
    reading_vibe: normalizeOne(source.reading_vibe),
    book_parlor_summary: normalizeOne(source.book_parlor_summary),
    similar_books: normalizeList(source.similar_books),
    suggested_rating_template: normalizeOne(source.suggested_rating_template),
  };
}

function normalizeList(value: unknown): InferredMetadataValue[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeOne).filter(Boolean) as InferredMetadataValue[];
}

function normalizeOne(value: unknown): InferredMetadataValue | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return inferred(value, 0.45);
  if (typeof value !== "object") return undefined;
  const object = value as Record<string, unknown>;
  const text = String(object.value ?? "").trim();
  if (!text) return undefined;
  const confidence = typeof object.confidence === "number" ? object.confidence : 0.5;
  return inferred(text, confidence);
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
