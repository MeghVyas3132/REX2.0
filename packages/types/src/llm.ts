// ──────────────────────────────────────────────
// REX - LLM Types
// ──────────────────────────────────────────────

import type { LLMProviderType } from "./node.js";

export interface LLMRequestOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  provider: LLMProviderType;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  durationMs: number;
}

export interface LLMProviderConfig {
  provider: LLMProviderType;
  model: string;
  apiKey: string;
}

export interface LLMProvider {
  readonly provider: LLMProviderType;
  generate(prompt: string, options: LLMRequestOptions): Promise<LLMResponse>;
}

export const DEFAULT_LLM_OPTIONS: Required<LLMRequestOptions> = {
  maxTokens: 2048,
  temperature: 0.7,
  timeoutMs: 30000,
  systemPrompt: "You are a helpful assistant.",
};

export const PROVIDER_MODELS: Record<LLMProviderType, string> = {
  gemini: "gemini-2.0-flash",
  groq: "llama-3.3-70b-versatile",
};
