// ──────────────────────────────────────────────
// REX - Groq Provider Implementation
// ──────────────────────────────────────────────

import type {
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  LLMProviderType,
} from "@rex/types";
import { DEFAULT_LLM_OPTIONS, PROVIDER_MODELS } from "@rex/types";
import { sanitizeErrorMessage, startTimer, measureDuration } from "@rex/utils";

const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";

export class GroqProvider implements LLMProvider {
  readonly provider: LLMProviderType = "groq";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? PROVIDER_MODELS.groq;
  }

  async generate(prompt: string, options: LLMRequestOptions = {}): Promise<LLMResponse> {
    const mergedOptions = { ...DEFAULT_LLM_OPTIONS, ...options };
    const timer = startTimer();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), mergedOptions.timeoutMs);

    try {
      const messages: Array<{ role: string; content: string }> = [];

      if (mergedOptions.systemPrompt) {
        messages.push({ role: "system", content: mergedOptions.systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      const response = await fetch(GROQ_API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: mergedOptions.maxTokens,
          temperature: mergedOptions.temperature,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new Error(`Groq API request failed with status ${response.status}: ${errorBody}`);
      }

      const data = await response.json() as GroqAPIResponse;

      const content = data.choices?.[0]?.message?.content ?? "";
      const usage = data.usage ?? {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      return {
        content,
        provider: "groq",
        model: this.model,
        usage: {
          promptTokens: usage.prompt_tokens ?? 0,
          completionTokens: usage.completion_tokens ?? 0,
          totalTokens: usage.total_tokens ?? 0,
        },
        durationMs: measureDuration(timer),
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(`Groq API request timed out after ${mergedOptions.timeoutMs}ms`);
      }
      throw new Error(`LLM provider error: ${sanitizeErrorMessage(error)}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}

// Groq (OpenAI-compatible) response shape
interface GroqAPIResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}
