type SearchRequest = {
  title?: string;
  author?: string;
  isbn?: string;
};

type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

type SourcedFact<T = string | number> = {
  value: T;
  source: string;
  sourceUrl?: string;
  confidence: number;
};

type ResolvedFacts = {
  page_count?: SourcedFact<number>;
  format?: SourcedFact<string>;
  series_name?: SourcedFact<string>;
  series_position?: SourcedFact<string | number>;
  publisher?: SourcedFact<string>;
  isbn_10?: SourcedFact<string>;
  isbn_13?: SourcedFact<string>;
  published_date?: SourcedFact<string>;
  language?: SourcedFact<string>;
  debug: {
    search_provider: string;
    query_count: number;
    result_count: number;
    openai_called: boolean;
    error?: string;
  };
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await request.json() as SearchRequest;
  const title = body.title?.trim();
  const author = body.author?.trim();
  const isbn = body.isbn?.trim();
  if (!title && !isbn) return json({ error: "title or isbn is required" }, 400);

  const queries = buildQueries(title, author, isbn);
  const search = await searchBookMetadata(queries);
  if (!search.results.length) {
    return json({ debug: { search_provider: search.provider, query_count: queries.length, result_count: 0, openai_called: false, error: search.error ?? "No search results available." } });
  }

  const extracted = await extractFactsWithOpenAI({ title, author, isbn, results: search.results });
  return json({
    ...extracted.facts,
    debug: {
      search_provider: search.provider,
      query_count: queries.length,
      result_count: search.results.length,
      openai_called: extracted.openaiCalled,
      error: extracted.error,
    },
  });
}

function buildQueries(title?: string, author?: string, isbn?: string) {
  const base = [title, author].filter(Boolean).join(" ");
  return [
    isbn ? `${isbn} book metadata` : "",
    `${base} page count`,
    `${base} series`,
    `${base} publisher`,
    `${base} ISBN`,
    `${base} editions`,
  ].filter(Boolean);
}

async function searchBookMetadata(queries: string[]): Promise<{ provider: string; results: SearchResult[]; error?: string }> {
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  const bingKey = process.env.BING_SEARCH_API_KEY;
  try {
    if (braveKey) {
      const batches = await Promise.all(queries.map((query) => braveSearch(query, braveKey)));
      return { provider: "Brave Search", results: dedupeResults(batches.flat()) };
    }
    if (bingKey) {
      const batches = await Promise.all(queries.map((query) => bingSearch(query, bingKey)));
      return { provider: "Bing Search", results: dedupeResults(batches.flat()) };
    }
    return { provider: "not_configured", results: [], error: "No server-side web search API key configured. Add BRAVE_SEARCH_API_KEY or BING_SEARCH_API_KEY." };
  } catch (error) {
    return { provider: braveKey ? "Brave Search" : bingKey ? "Bing Search" : "unknown", results: [], error: error instanceof Error ? error.message : "Search failed." };
  }
}

async function braveSearch(query: string, key: string): Promise<SearchResult[]> {
  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
    headers: { Accept: "application/json", "X-Subscription-Token": key },
  });
  if (!response.ok) throw new Error(`Brave Search failed with ${response.status}`);
  const data = await response.json();
  return (data.web?.results ?? []).map((item: any) => ({
    title: item.title ?? "",
    url: item.url ?? "",
    snippet: item.description ?? "",
    source: sourceName(item.url),
  }));
}

async function bingSearch(query: string, key: string): Promise<SearchResult[]> {
  const response = await fetch(`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=5`, {
    headers: { "Ocp-Apim-Subscription-Key": key },
  });
  if (!response.ok) throw new Error(`Bing Search failed with ${response.status}`);
  const data = await response.json();
  return (data.webPages?.value ?? []).map((item: any) => ({
    title: item.name ?? "",
    url: item.url ?? "",
    snippet: item.snippet ?? "",
    source: sourceName(item.url),
  }));
}

async function extractFactsWithOpenAI(input: { title?: string; author?: string; isbn?: string; results: SearchResult[] }): Promise<{ facts: Partial<ResolvedFacts>; openaiCalled: boolean; error?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  if (!apiKey) return { facts: {}, openaiCalled: false, error: "OPENAI_API_KEY is missing; cannot extract sourced facts." };
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: "Extract factual book metadata only from supplied search snippets. Never invent facts. If a field is unsupported by the snippets, omit it. Return strict JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Extract sourced facts. Each fact must include value, source, sourceUrl, confidence. Prefer publisher, author, library/catalog, ISBN records, Open Library, and Google Books. Do not use Goodreads reviews or user content.",
            fields: ["page_count", "format", "series_name", "series_position", "publisher", "isbn_10", "isbn_13", "published_date", "language"],
            book: { title: input.title, author: input.author, isbn: input.isbn },
            search_results: input.results,
          }),
        },
      ],
      text: { format: { type: "json_object" } },
    }),
  });
  if (!response.ok) return { facts: {}, openaiCalled: true, error: `OpenAI extraction failed with ${response.status}: ${await response.text()}` };
  const result = await response.json();
  const content = result.output_text ?? result.output?.flatMap((item: any) => item.content ?? []).find((part: any) => part.type === "output_text")?.text;
  try {
    return { facts: normalizeFacts(JSON.parse(content)), openaiCalled: true };
  } catch {
    return { facts: {}, openaiCalled: true, error: "OpenAI extraction returned invalid JSON." };
  }
}

function normalizeFacts(payload: any): Partial<ResolvedFacts> {
  const out: Partial<ResolvedFacts> = {};
  const factKeys = ["page_count", "format", "series_name", "series_position", "publisher", "isbn_10", "isbn_13", "published_date", "language"] as const;
  factKeys.forEach((key) => {
    const fact = payload?.[key];
    if (!fact || fact.value === undefined || fact.value === null || !fact.source) return;
    const value = key === "page_count" ? Number(fact.value) : String(fact.value);
    if (key === "page_count" && !Number.isFinite(value as number)) return;
    (out as any)[key] = {
      value,
      source: String(fact.source),
      sourceUrl: typeof fact.sourceUrl === "string" ? fact.sourceUrl : typeof fact.url === "string" ? fact.url : undefined,
      confidence: clamp(Number(fact.confidence ?? 0.6)),
    };
  });
  return out;
}

function dedupeResults(results: SearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (!result.url || seen.has(result.url) || /goodreads\.com/i.test(result.url)) return false;
    seen.add(result.url);
    return true;
  }).slice(0, 18);
}

function sourceName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Web";
  }
}

function clamp(value: number) {
  return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(2));
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}
