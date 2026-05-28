type EnrichBookRequest = {
  book_id?: string;
  title?: string;
  author?: string;
  authors?: string[];
  description?: string;
  categories?: string[];
  subjects?: string[];
};

type EnrichBookResponse = {
  tropes: string[];
  moods: string[];
  season_vibes: string[];
  rating_genre_suggestion: string;
  content_warnings: string[];
  pov_type: string;
  pov_count: string;
  short_summary: string;
  similar_books: string[];
  confidence: Record<string, number | Record<string, number>>;
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await request.json() as EnrichBookRequest;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) return json(cautiousFallback(body));

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
          content: [
            "You are enriching a book for The Book Parlor.",
            "Return strict JSON only matching the requested schema.",
            "Infer only subjective/vibe metadata.",
            "Never invent factual metadata such as ISBN, page count, publisher, publication date, external rating, or exact edition.",
            "Content warnings must be suggestions, not confirmed facts.",
            "If the description is missing, infer cautiously with lower confidence.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            schema: {
              tropes: "string[]",
              moods: "string[]",
              season_vibes: "string[]",
              rating_genre_suggestion: "string",
              content_warnings: "string[]",
              pov_type: "string",
              pov_count: "string",
              short_summary: "string",
              similar_books: "string[]",
              confidence: "object mapping each field or item to 0-1 confidence",
            },
            book: {
              book_id: body.book_id,
              title: body.title,
              author: body.author ?? body.authors?.join(", "),
              description: body.description,
              categories: body.categories ?? [],
              subjects: body.subjects ?? [],
            },
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
    return json(normalizePayload(JSON.parse(content)));
  } catch {
    return json(cautiousFallback(body));
  }
}

function normalizePayload(payload: any): EnrichBookResponse {
  const confidence = typeof payload?.confidence === "object" && payload.confidence ? payload.confidence : {};
  return {
    tropes: stringArray(payload?.tropes),
    moods: stringArray(payload?.moods),
    season_vibes: stringArray(payload?.season_vibes),
    rating_genre_suggestion: stringValue(payload?.rating_genre_suggestion),
    content_warnings: stringArray(payload?.content_warnings),
    pov_type: stringValue(payload?.pov_type),
    pov_count: stringValue(payload?.pov_count),
    short_summary: stringValue(payload?.short_summary),
    similar_books: stringArray(payload?.similar_books),
    confidence,
  };
}

function cautiousFallback(body: EnrichBookRequest): EnrichBookResponse {
  const text = `${body.title ?? ""} ${body.author ?? body.authors?.join(" ") ?? ""} ${body.description ?? ""} ${(body.categories ?? []).join(" ")} ${(body.subjects ?? []).join(" ")}`.toLowerCase();
  const hasDescription = Boolean(body.description?.trim());
  const confidence = hasDescription ? 0.55 : 0.3;
  const genre = text.includes("romance") ? "Romance" : text.includes("fantasy") ? "Fantasy" : text.includes("mystery") ? "Mystery" : text.includes("horror") ? "Horror" : "Other";
  const moods = [text.includes("dark") ? "dark" : text.includes("emotional") ? "emotional" : "cozy"];
  return {
    tropes: [],
    moods,
    season_vibes: [text.includes("winter") ? "winter" : text.includes("summer") ? "summer" : text.includes("autumn") || text.includes("fall") ? "autumn" : "spring"],
    rating_genre_suggestion: genre,
    content_warnings: [],
    pov_type: "",
    pov_count: "",
    short_summary: hasDescription ? `A ${genre.toLowerCase()} read with a ${moods[0]} Book Parlor mood.` : "AI can only infer a light reading vibe until a factual description is available.",
    similar_books: [],
    confidence: {
      moods: confidence,
      season_vibes: Math.max(0.2, confidence - 0.1),
      rating_genre_suggestion: confidence,
      short_summary: confidence,
    },
  };
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(stringValue).filter(Boolean) : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
