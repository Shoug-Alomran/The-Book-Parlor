export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  console.info("[Book Parlor OpenAI Debug] OPENAI_API_KEY exists:", Boolean(apiKey));

  if (!apiKey) {
    console.error("[Book Parlor OpenAI Debug] OPENAI_API_KEY is missing.");
    return json({ success: false, key_exists: false, model, error: "OPENAI_API_KEY is missing on the server." }, 500);
  }

  console.info("[Book Parlor OpenAI Debug] OpenAI request started", { model });
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: "Reply with strict JSON: {\"status\":\"ok\",\"message\":\"Book Parlor OpenAI debug connected\"}",
        text: { format: { type: "json_object" } },
      }),
    });

    console.info("[Book Parlor OpenAI Debug] OpenAI response status:", response.status);
    const body = await response.text();
    if (!response.ok) {
      console.error("[Book Parlor OpenAI Debug] OpenAI failed body:", body);
      return json({ success: false, key_exists: true, model, status: response.status, error_body: body }, 502);
    }

    console.info("OPENAI CONNECTED SUCCESSFULLY");
    let parsed: unknown;
    try {
      const result = JSON.parse(body);
      const outputText = result.output_text ?? result.output?.flatMap((item: any) => item.content ?? []).find((part: any) => part.type === "output_text")?.text;
      parsed = outputText ? JSON.parse(outputText) : result;
    } catch {
      parsed = body;
    }

    return json({ success: true, key_exists: true, model, response: parsed });
  } catch (error) {
    console.error("[Book Parlor OpenAI Debug] OpenAI request threw", error);
    return json({ success: false, key_exists: true, model, error: error instanceof Error ? error.message : "OpenAI request failed." }, 502);
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
