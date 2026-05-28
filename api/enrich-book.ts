type InferredValue = {
  value: string;
  confidence: number;
  source: "ai_inferred";
};

type ResponsePayload = {
  genres: InferredValue[];
  tropes: InferredValue[];
  moods: InferredValue[];
  content_warnings: InferredValue[];
  season_vibes: InferredValue[];
  similar_books: InferredValue[];
  standalone_or_series?: InferredValue;
  series_type?: InferredValue;
  likely_pov_type?: InferredValue;
  likely_pov_count?: InferredValue;
  hype_rating_suggestion?: InferredValue;
  rating_genre_suggestion?: InferredValue;
  reading_vibe?: InferredValue;
  book_parlor_summary?: InferredValue;
  suggested_rating_template?: InferredValue;
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await request.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return json(cautiousFallback(body));
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "Return strict JSON only. Infer only subjective reading metadata. Never invent page counts, ISBNs, publishers, external ratings, or factual edition data. Mark uncertainty with lower confidence.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Infer Book Parlor metadata for a book. Every field must use { value, confidence, source: 'ai_inferred' }.",
            allowed_fields: [
              "genres",
              "tropes",
              "moods",
              "content_warnings",
              "season_vibes",
              "standalone_or_series",
              "series_type",
              "likely_pov_type",
              "likely_pov_count",
              "hype_rating_suggestion",
              "rating_genre_suggestion",
              "reading_vibe",
              "book_parlor_summary",
              "similar_books",
              "suggested_rating_template",
            ],
            book: body,
          }),
        },
      ],
      text: { format: { type: "json_object" } },
    }),
  });

  if (!response.ok) return json(cautiousFallback(body));
  const result = await response.json();
  const content = result.output_text ?? result.output?.flatMap((item: any) => item.content ?? []).find((part: any) => part.type === "output_text")?.text;
  try {
    return json(JSON.parse(content));
  } catch {
    return json(cautiousFallback(body));
  }
}

function cautiousFallback(body: any): ResponsePayload {
  const text = `${body?.title ?? ""} ${(body?.authors ?? []).join(" ")} ${body?.description ?? ""} ${(body?.categories ?? []).join(" ")} ${(body?.subjects ?? []).join(" ")}`.toLowerCase();
  const confidence = body?.description ? 0.55 : 0.32;
  const genre = text.includes("romance") ? "Romance" : text.includes("fantasy") ? "Fantasy" : text.includes("mystery") ? "Mystery" : "Other";
  return {
    genres: [value(genre, confidence)],
    tropes: [],
    moods: [value(text.includes("dark") ? "dark" : "cozy", confidence)],
    content_warnings: [],
    season_vibes: [value(text.includes("winter") ? "winter" : text.includes("summer") ? "summer" : "spring", confidence - 0.08)],
    similar_books: [],
    standalone_or_series: value(text.includes("series") ? "series" : "standalone", confidence - 0.1),
    series_type: value(text.includes("series") ? "Series" : "Standalone", confidence - 0.1),
    likely_pov_type: value("3rd Person", 0.28),
    likely_pov_count: value("Single POV", 0.28),
    hype_rating_suggestion: value("Appropriately Rated", 0.25),
    rating_genre_suggestion: value(genre, confidence),
    reading_vibe: value(genre, confidence),
    book_parlor_summary: value(body?.description ? `A ${genre.toLowerCase()} read with a distinct Book Parlor mood.` : "AI can only infer this cautiously until a real description is available.", confidence),
    suggested_rating_template: value(genre, confidence),
  };
}

function value(valueText: string, confidence: number): InferredValue {
  return { value: valueText, confidence: Math.max(0.1, Math.min(0.95, Number(confidence.toFixed(2)))), source: "ai_inferred" };
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
