import {
  GROQ_API_URL,
  GROQ_MODEL,
  type LlmLubResult,
} from "../types";

/** 初回 + リトライ回数（空 JSON などパース失敗時） */
const MAX_ATTEMPTS = 3;

function buildSystemPrompt(): string {
  return `You are a conceptual abstraction engine.
Given two concepts, return the single best higher-level concept that serves as their
Least Upper Bound / Least Common Subsumer / Lowest Common Ancestor.

Rules:
- The answer does not need to be a dictionary taxonomic category. Contextual or emergent abstractions are allowed.
- Output must be in Japanese if inputs are mainly Japanese, otherwise match the dominant language.
- \`concept\` must be a single concise non-empty term or short phrase. NEVER use an empty string.
- \`reason\` must be one non-empty sentence explaining why this concept subsumes both inputs. NEVER use an empty string.
- \`confidence\` must be a number between 0.0 and 1.0 representing how strongly the concept fits.
- If the pair is hard or abstract, still return your best-effort non-empty concept and reason, and lower confidence instead of leaving fields empty.
- Do not refuse. Always fill all three fields with meaningful values.

Examples:
Input: 犬 / 猫
{"concept":"動物","reason":"犬と猫はどちらも動物という上位カテゴリに属する。","confidence":0.95}

Input: おにぎり / ディズニーランド
{"concept":"娯楽","reason":"おにぎりは日常の楽しみとしての食、ディズニーランドは娯楽施設であり、どちらも娯楽に関わる。","confidence":0.7}

Input: 看護師 / 飛行機
{"concept":"産業革命","reason":"近代的な専門職と機械工業の産物として、どちらも産業革命以降の社会・技術の産物である。","confidence":0.55}

Respond with valid JSON only, using this schema:
{"concept": string, "reason": string, "confidence": number}`;
}

function buildUserPrompt(conceptA: string, conceptB: string): string {
  return `Concept A: ${conceptA}\nConcept B: ${conceptB}\n\nReturn a non-empty concept and reason. Never leave fields empty.`;
}

function isLlmLubResult(value: unknown): value is LlmLubResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.concept === "string" &&
    obj.concept.trim().length > 0 &&
    typeof obj.reason === "string" &&
    obj.reason.trim().length > 0 &&
    typeof obj.confidence === "number" &&
    Number.isFinite(obj.confidence) &&
    obj.confidence >= 0 &&
    obj.confidence <= 1
  );
}

export class LlmRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmRateLimitError";
  }
}

export class LlmParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmParseError";
  }
}

/**
 * Groq API を 1 回呼び出し、LUB 結果を返す。
 */
async function generateLubOnce(
  apiKey: string,
  conceptA: string,
  conceptB: string,
  attempt: number,
): Promise<LlmLubResult> {
  // リトライ時は温度を少し上げて別解を引き出す
  const temperature = attempt === 0 ? 0.3 : Math.min(0.3 + attempt * 0.2, 0.7);

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature,
      max_tokens: 512,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: buildUserPrompt(conceptA, conceptB),
        },
      ],
    }),
  });

  if (response.status === 429) {
    throw new LlmRateLimitError("しばらく経ってからお試しください。");
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq API エラー (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new LlmParseError("レスポンスの JSON パースに失敗しました。");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    console.error("LLM JSON parse failed:", content, error);
    throw new LlmParseError("レスポンスの JSON パースに失敗しました。");
  }

  if (!isLlmLubResult(parsed)) {
    console.error("LLM JSON type guard failed:", parsed);
    throw new LlmParseError("レスポンスの JSON パースに失敗しました。");
  }

  return {
    concept: parsed.concept.trim(),
    reason: parsed.reason.trim(),
    confidence: parsed.confidence,
  };
}

/**
 * Groq API (JSON mode) で 2 概念の LUB を生成する。
 * 空 concept/reason などパース失敗時は最大 MAX_ATTEMPTS 回まで再試行する。
 */
export async function generateLub(
  apiKey: string,
  conceptA: string,
  conceptB: string,
): Promise<LlmLubResult> {
  let lastParseError: LlmParseError | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await generateLubOnce(apiKey, conceptA, conceptB, attempt);
    } catch (error) {
      if (error instanceof LlmRateLimitError) {
        throw error;
      }
      if (error instanceof LlmParseError) {
        lastParseError = error;
        console.error(
          `LLM parse failed (attempt ${attempt + 1}/${MAX_ATTEMPTS}):`,
          error.message,
        );
        continue;
      }
      throw error;
    }
  }

  throw (
    lastParseError ??
    new LlmParseError("レスポンスの JSON パースに失敗しました。")
  );
}
