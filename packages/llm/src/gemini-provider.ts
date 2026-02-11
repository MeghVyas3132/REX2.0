// ──────────────────────────────────────────────
// REX - Gemini Provider Implementation
// ──────────────────────────────────────────────

import type {
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  LLMProviderType,
} from "@rex/types";
import { DEFAULT_LLM_OPTIONS, PROVIDER_MODELS } from "@rex/types";
import { sanitizeErrorMessage, startTimer, measureDuration } from "@rex/utils";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Map deprecated model names to their current replacements
const DEPRECATED_MODEL_MAP: Record<string, string> = {
  "gemini-pro": "gemini-2.0-flash",
  "gemini-pro-vision": "gemini-2.0-flash",
  "gemini-ultra": "gemini-2.0-flash",
};

export class GeminiProvider implements LLMProvider {
  readonly provider: LLMProviderType = "gemini";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    const requested = (model && model.trim()) || PROVIDER_MODELS.gemini;
    this.model = DEPRECATED_MODEL_MAP[requested] ?? requested;
  }

  async generate(prompt: string, options: LLMRequestOptions = {}): Promise<LLMResponse> {
    const mergedOptions = { ...DEFAULT_LLM_OPTIONS, ...options };
    const timer = startTimer();

    const url = `${GEMINI_API_BASE}/${this.model}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), mergedOptions.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          systemInstruction: mergedOptions.systemPrompt
            ? { parts: [{ text: mergedOptions.systemPrompt }] }
            : undefined,
          generationConfig: {
            maxOutputTokens: mergedOptions.maxTokens,
            temperature: mergedOptions.temperature,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new Error(`Gemini API request failed with status ${response.status}: ${errorBody}`);
      }

      const data = await response.json() as GeminiAPIResponse;

      const content =
        data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      const usage = data.usageMetadata ?? {
        promptTokenCount: 0,
        candidatesTokenCount: 0,
        totalTokenCount: 0,
      };

      return {
        content,
        provider: "gemini",
        model: this.model,
        usage: {
          promptTokens: usage.promptTokenCount ?? 0,
          completionTokens: usage.candidatesTokenCount ?? 0,
          totalTokens: usage.totalTokenCount ?? 0,
        },
        durationMs: measureDuration(timer),
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(`Gemini API request timed out after ${mergedOptions.timeoutMs}ms`);
      }
      throw new Error(`LLM provider error: ${sanitizeErrorMessage(error)}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}

// Gemini API response shape (minimal)
interface GeminiAPIResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}
