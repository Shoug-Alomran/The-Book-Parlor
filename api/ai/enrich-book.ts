type Basis = "description" | "metadata" | "known_book_knowledge" | "community_signal";

type ClassifiedItem = {
  name: string;
  normalized_slug?: string;
  confidence: number;
  evidence: string;
  source_basis: Basis;
  custom?: boolean;
  status?: "ai_populated";
};

type EnrichBookRequest = {
  book_id?: string;
  title?: string;
  subtitle?: string;
  author?: string;
  authors?: string[];
  description?: string;
  categories?: string[];
  subjects?: string[];
  series_name?: string;
  community_tropes?: string[];
};

type EnrichBookResponse = {
  genres: Array<Omit<ClassifiedItem, "normalized_slug" | "custom">>;
  rating_genre_suggestion: Omit<ClassifiedItem, "normalized_slug" | "custom"> | null;
  tropes: ClassifiedItem[];
  moods: ClassifiedItem[];
  season_vibes: ClassifiedItem[];
  content_warnings: Array<ClassifiedItem & { status: "ai_populated" }>;
  possible_series_status: ClassifiedItem | null;
  hype_rating_suggestion: ClassifiedItem | null;
  pov_type: ClassifiedItem | null;
  pov_count: ClassifiedItem | null;
  short_summary: ClassifiedItem | null;
  similar_books: ClassifiedItem[];
  debug: {
    openai_called: boolean;
    description_length: number;
    model: string;
    fallback_used: boolean;
    returned_json?: unknown;
    error?: string;
  };
};

const allowedTropes = [
  "Enemies to lovers",
  "Friends to lovers",
  "Forced proximity",
  "Fake dating",
  "Marriage of convenience",
  "Morally gray characters",
  "Touch her and die",
  "Found family",
  "Slow burn",
  "Love triangle",
  "Second chance romance",
  "Grumpy sunshine",
  "Only one bed",
  "Forbidden romance",
  "Academy setting",
  "Vampires",
  "Werewolves",
  "Fae",
  "Dystopian world",
  "Chosen one",
  "Revenge",
  "Betrayal",
  "Dark academia",
  "Sports romance",
  "Small town",
  "Mafia romance",
  "Workplace romance",
  "Rivals to lovers",
  "Who did this to you",
];

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await request.json() as EnrichBookRequest;
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const descriptionLength = body.description?.length ?? 0;
  const apiKey = process.env.OPENAI_API_KEY;

  console.info("[Book Parlor AI] OPENAI_API_KEY exists:", Boolean(apiKey));
  if (!apiKey) {
    console.error("[Book Parlor AI] fallback trigger reason: OPENAI_API_KEY is not configured.");
    return json(unavailable(body, model, "OPENAI_API_KEY is not configured."), 500);
  }

  const prompt = {
    schema: {
      genres: [{ name: "string", confidence: "0-1", evidence: "string", source_basis: "description|metadata|known_book_knowledge|community_signal" }],
      rating_genre_suggestion: { name: "string", confidence: "0-1", evidence: "string", source_basis: "description|metadata|known_book_knowledge|community_signal" },
      tropes: [{ name: "string", normalized_slug: "string", confidence: "0-1", evidence: "string", source_basis: "description|metadata|known_book_knowledge|community_signal", custom: "boolean" }],
      moods: [{ name: "string", confidence: "0-1", evidence: "string", source_basis: "description|metadata|known_book_knowledge|community_signal" }],
      season_vibes: [{ name: "string", confidence: "0-1", evidence: "string", source_basis: "description|metadata|known_book_knowledge|community_signal" }],
      content_warnings: [{ name: "string", confidence: "0-1", evidence: "string", source_basis: "description|metadata|known_book_knowledge|community_signal", status: "ai_populated" }],
      possible_series_status: { name: "string", confidence: "0-1", evidence: "string", source_basis: "description|metadata|known_book_knowledge|community_signal" },
      hype_rating_suggestion: { name: "string", confidence: "0-1", evidence: "string", source_basis: "description|metadata|known_book_knowledge|community_signal" },
      pov_type: { name: "string", confidence: "0-1", evidence: "string", source_basis: "description|metadata|known_book_knowledge|community_signal" },
      pov_count: { name: "string", confidence: "0-1", evidence: "string", source_basis: "description|metadata|known_book_knowledge|community_signal" },
      short_summary: { name: "string", confidence: "0-1", evidence: "string", source_basis: "description|metadata|known_book_knowledge|community_signal" },
      similar_books: [{ name: "string", confidence: "0-1", evidence: "string", source_basis: "known_book_knowledge" }],
    },
    allowed_trope_vocabulary: allowedTropes,
    normalization_rules: [
      "enemies-to-lovers = enemies to lovers = hate-to-love",
      "morally grey = morally gray characters",
      "arranged marriage may normalize to Marriage of convenience only if the relationship setup supports it",
      "Romance, Fantasy, Horror, Mystery, Thriller, Dark Romance, and Romantasy are genres/subgenres, not tropes",
      "Do not return creatures such as Fae, Vampires, or Werewolves unless directly supported by description, subjects, title, or high-confidence known-book knowledge",
    ],
    quality_rules: [
      "Return fewer tropes when uncertain.",
      "Only return a trope if directly supported by supplied context or high-confidence known-book knowledge.",
      "For well-known books, use high-confidence known-book knowledge to avoid empty trope and mood results when the supplied API description is incomplete or wrong-language.",
      "If the description is in a non-English language, still classify it and provide the short_summary in English.",
      "Every trope must include concrete evidence.",
      "Do not invent factual metadata.",
      "Content warnings are AI-populated reading-profile fields; do not include them unless supported by supplied context or high-confidence known-book knowledge.",
    ],
    book: {
      book_id: body.book_id,
      title: body.title,
      subtitle: body.subtitle,
      author: body.author ?? body.authors?.join(", "),
      description: body.description,
      categories: body.categories ?? [],
      subjects: body.subjects ?? [],
      series_name: body.series_name,
      existing_community_tropes: body.community_tropes ?? [],
    },
  };

  console.info("[Book Parlor AI] OpenAI request started", { model, book_id: body.book_id, title: body.title, description_length: descriptionLength });
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: "You are a precise book classification engine. Return strict JSON only. Populate a reader-facing book profile in layers: genres, tropes, moods/vibes, rating template, and content warnings. Quality over quantity.",
        },
        { role: "user", content: JSON.stringify(prompt) },
      ],
      text: { format: { type: "json_object" } },
    }),
  });
  } catch (error) {
    console.error("[Book Parlor AI] OpenAI request threw", error);
    console.error("[Book Parlor AI] fallback trigger reason: request exception");
    return json(unavailable(body, model, error instanceof Error ? error.message : "OpenAI request failed."), 502);
  }

  console.info("[Book Parlor AI] OpenAI response status:", response.status);
  if (!response.ok) {
    const failureBody = await response.text();
    console.error("[Book Parlor AI] OpenAI failed body:", failureBody);
    console.error("[Book Parlor AI] fallback trigger reason: non-OK OpenAI response");
    return json(unavailable(body, model, `OpenAI returned ${response.status}: ${failureBody}`), 502);
  }
  console.info("OPENAI CONNECTED SUCCESSFULLY");
  const result = await response.json();
  const content = result.output_text ?? result.output?.flatMap((item: any) => item.content ?? []).find((part: any) => part.type === "output_text")?.text;
  try {
    const parsed = JSON.parse(content);
    return json({ ...normalizePayload(parsed), debug: { openai_called: true, description_length: descriptionLength, model, fallback_used: false, returned_json: parsed } });
  } catch {
    console.error("[Book Parlor AI] OpenAI returned invalid JSON:", content);
    console.error("[Book Parlor AI] fallback trigger reason: invalid JSON");
    return json(unavailable(body, model, "OpenAI returned invalid JSON."), 502);
  }
}

function normalizePayload(payload: any): Omit<EnrichBookResponse, "debug"> {
  return {
    genres: list(payload?.genres).map(normalizeItem),
    rating_genre_suggestion: one(payload?.rating_genre_suggestion),
    tropes: list(payload?.tropes).map(normalizeItem).filter((item) => !isGenreAsTrope(item.name)),
    moods: list(payload?.moods).map(normalizeItem),
    season_vibes: list(payload?.season_vibes).map(normalizeItem),
    content_warnings: list(payload?.content_warnings).map((item) => ({ ...normalizeItem(item), status: "ai_populated" as const })),
    possible_series_status: one(payload?.possible_series_status),
    hype_rating_suggestion: one(payload?.hype_rating_suggestion),
    pov_type: one(payload?.pov_type),
    pov_count: one(payload?.pov_count),
    short_summary: one(payload?.short_summary),
    similar_books: list(payload?.similar_books).map(normalizeItem),
  };
}

function unavailable(body: EnrichBookRequest, model: string, error: string): EnrichBookResponse {
  return {
    genres: [],
    rating_genre_suggestion: null,
    tropes: [],
    moods: [],
    season_vibes: [],
    content_warnings: [],
    possible_series_status: null,
    hype_rating_suggestion: null,
    pov_type: null,
    pov_count: null,
    short_summary: null,
    similar_books: [],
    debug: {
      openai_called: false,
      description_length: body.description?.length ?? 0,
      model,
      fallback_used: false,
      error,
    },
  };
}

function normalizeItem(item: any): ClassifiedItem {
  const name = String(item?.name ?? item?.value ?? "").trim();
  return {
    name,
    normalized_slug: String(item?.normalized_slug ?? slugify(name)).trim(),
    confidence: clamp(Number(item?.confidence ?? 0)),
    evidence: String(item?.evidence ?? "").trim(),
    source_basis: (["description", "metadata", "known_book_knowledge", "community_signal"].includes(item?.source_basis) ? item.source_basis : "metadata") as Basis,
    custom: Boolean(item?.custom),
    status: item?.status === "ai_populated" ? "ai_populated" : undefined,
  };
}

function one(value: unknown) {
  if (!value) return null;
  return normalizeItem(value);
}

function list(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function isGenreAsTrope(name: string) {
  return ["romance", "fantasy", "dark romance", "romantasy", "horror", "mystery", "thriller", "science fiction", "literary fiction", "young adult", "nonfiction"].includes(name.toLowerCase());
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function clamp(value: number) {
  return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(2));
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
