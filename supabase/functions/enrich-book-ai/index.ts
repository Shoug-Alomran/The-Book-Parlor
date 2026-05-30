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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  "Bookish heroine",
  "Sister bond",
  "Small-town vacation",
];

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await request.json() as EnrichBookRequest;
  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const descriptionLength = body.description?.length ?? 0;

  console.info("[Book Parlor Edge AI] OPENAI_API_KEY exists:", Boolean(apiKey));
  if (!apiKey) return json(unavailable(body, model, "OPENAI_API_KEY is not configured in Supabase Edge Function secrets."), 500);

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
    rules: [
      "Populate a reader-facing book profile the way ChatGPT would answer a reader asking for the details of this book.",
      "Use high-confidence known-book knowledge for popular/well-known books when API metadata is missing, sparse, or wrong-language.",
      "Return an English short_summary even if supplied description is missing or non-English.",
      "Do not invent factual edition fields such as ISBN, page count, publisher, or publication date.",
      "Do populate subjective/profile fields: genres, tropes, moods, season vibe, rating genre, POV, series context, similar books, and content warnings.",
      "Return fewer tropes when uncertain, but do not leave core profile arrays empty for a well-known title.",
      "Every item needs concrete evidence, even if the evidence is known_book_knowledge.",
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

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: "You are ChatGPT powering The Book Parlor. Return strict JSON only. Populate a cozy reader-facing book profile from supplied metadata and high-confidence known-book knowledge. Do not invent factual edition data.",
        },
        { role: "user", content: JSON.stringify(prompt) },
      ],
      text: { format: { type: "json_object" } },
    }),
  });

  console.info("[Book Parlor Edge AI] OpenAI response status:", response.status);
  if (!response.ok) return json(unavailable(body, model, `OpenAI returned ${response.status}: ${await response.text()}`), 502);
  console.info("OPENAI CONNECTED SUCCESSFULLY");

  const result = await response.json();
  const content = result.output_text ?? result.output?.flatMap((item: any) => item.content ?? []).find((part: any) => part.type === "output_text")?.text;
  try {
    const parsed = JSON.parse(content);
    return json({ ...normalizePayload(parsed), debug: { openai_called: true, description_length: descriptionLength, model, fallback_used: false, returned_json: parsed, provider: "supabase_edge_function" } });
  } catch {
    return json(unavailable(body, model, "OpenAI returned invalid JSON."), 502);
  }
});

function normalizePayload(payload: any) {
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

function unavailable(body: EnrichBookRequest, model: string, error: string) {
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
    detection_unavailable: true,
    debug: { openai_called: false, description_length: body.description?.length ?? 0, model, fallback_used: false, error, provider: "supabase_edge_function" },
  };
}

function normalizeItem(item: any): ClassifiedItem {
  const name = String(item?.name ?? item?.value ?? "").trim();
  return {
    name,
    normalized_slug: String(item?.normalized_slug ?? slugify(name)).trim(),
    confidence: clamp(Number(item?.confidence ?? 0)),
    evidence: String(item?.evidence ?? "").trim(),
    source_basis: (["description", "metadata", "known_book_knowledge", "community_signal"].includes(item?.source_basis) ? item.source_basis : "known_book_knowledge") as Basis,
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
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
