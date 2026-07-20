export type Bindings = {
  GROQ_API_KEY: string;
};

export type LubSuccessResponse = {
  concept: string;
  reason: string;
  confidence: number;
};

export type LubErrorResponse = {
  error: string;
};

export type LlmLubResult = {
  concept: string;
  reason: string;
  confidence: number;
};

export const CONFIDENCE_WARNING_THRESHOLD = 0.7;
export const MAX_CONCEPT_LENGTH = 100;
export const MIN_CONCEPT_LENGTH = 1;

export const GROQ_MODEL = "llama-3.1-8b-instant";
export const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
