import { Hono } from "hono";
import {
  MAX_CONCEPT_LENGTH,
  MIN_CONCEPT_LENGTH,
  type Bindings,
  type LubErrorResponse,
  type LubSuccessResponse,
} from "../types";
import {
  generateLub,
  LlmParseError,
  LlmRateLimitError,
} from "../services/llm";

const lub = new Hono<{ Bindings: Bindings }>();

lub.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json<LubErrorResponse>(
      { error: "リクエストボディが不正です。JSON を送信してください。" },
      400,
    );
  }

  if (typeof body !== "object" || body === null) {
    return c.json<LubErrorResponse>(
      { error: "概念 A と概念 B の両方を入力してください。" },
      400,
    );
  }

  const record = body as Record<string, unknown>;
  const rawA = record.conceptA;
  const rawB = record.conceptB;

  if (typeof rawA !== "string" || typeof rawB !== "string") {
    return c.json<LubErrorResponse>(
      { error: "概念 A と概念 B の両方を入力してください。" },
      400,
    );
  }

  const conceptA = rawA.trim();
  const conceptB = rawB.trim();

  if (
    conceptA.length < MIN_CONCEPT_LENGTH ||
    conceptB.length < MIN_CONCEPT_LENGTH
  ) {
    return c.json<LubErrorResponse>(
      { error: "概念 A と概念 B の両方を入力してください。" },
      400,
    );
  }

  if (conceptA.length > MAX_CONCEPT_LENGTH) {
    return c.json<LubErrorResponse>(
      { error: `概念 A は${MAX_CONCEPT_LENGTH}文字以内で入力してください。` },
      400,
    );
  }

  if (conceptB.length > MAX_CONCEPT_LENGTH) {
    return c.json<LubErrorResponse>(
      { error: `概念 B は${MAX_CONCEPT_LENGTH}文字以内で入力してください。` },
      400,
    );
  }

  if (!c.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY is not configured");
    return c.json<LubErrorResponse>(
      { error: "処理中にエラーが発生しました。" },
      500,
    );
  }

  try {
    const result = await generateLub(
      c.env.GROQ_API_KEY,
      conceptA,
      conceptB,
    );

    const response: LubSuccessResponse = {
      concept: result.concept,
      reason: result.reason,
      confidence: result.confidence,
    };

    return c.json(response);
  } catch (error) {
    if (error instanceof LlmRateLimitError) {
      return c.json<LubErrorResponse>(
        { error: "しばらく経ってからお試しください。" },
        429,
      );
    }

    if (error instanceof LlmParseError) {
      console.error("LLM parse error:", error);
      return c.json<LubErrorResponse>(
        {
          error:
            "共通祖先を生成できませんでした。再試行してください。",
        },
        500,
      );
    }

    console.error("lub unexpected error:", error);
    return c.json<LubErrorResponse>(
      { error: "処理中にエラーが発生しました。" },
      500,
    );
  }
});

export { lub };
