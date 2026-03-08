// ──────────────────────────────────────────────
// REX - LLM Provider Factory
// ──────────────────────────────────────────────

import type { LLMProvider, LLMProviderType } from "@rex/types";
import { GeminiProvider } from "./gemini-provider.js";
import { GroqProvider } from "./groq-provider.js";
import type { EmbeddingProvider, EmbeddingProviderType, RerankerProvider, RerankerProviderType } from "@rex/types";
import { createEmbeddingProvider as createEmbeddingProviderImpl } from "./embedding-provider.js";
import { createRerankerProvider as createRerankerProviderImpl } from "./reranker-provider.js";

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

export function createEmbeddingProvider(
  provider: EmbeddingProviderType,
  options?: { apiKey?: string; model?: string; dimensions?: number; timeoutMs?: number }
): EmbeddingProvider {
  return createEmbeddingProviderImpl(provider, options);
}

export function createRerankerProvider(
  provider: RerankerProviderType,
  options?: { apiKey?: string; model?: string }
): RerankerProvider {
  return createRerankerProviderImpl(provider, options);
}
