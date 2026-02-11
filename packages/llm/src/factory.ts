// ──────────────────────────────────────────────
// REX - LLM Provider Factory
// ──────────────────────────────────────────────

import type { LLMProvider, LLMProviderType } from "@rex/types";
import { GeminiProvider } from "./gemini-provider.js";
import { GroqProvider } from "./groq-provider.js";

export function createLLMProvider(
  provider: LLMProviderType,
  apiKey: string,
  model?: string
): LLMProvider {
  switch (provider) {
    case "gemini":
      return new GeminiProvider(apiKey, model);
    case "groq":
      return new GroqProvider(apiKey, model);
    default:
      throw new Error(`Unsupported LLM provider: ${provider as string}`);
  }
}
