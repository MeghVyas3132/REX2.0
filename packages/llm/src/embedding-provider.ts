// ──────────────────────────────────────────────
// REX - Embedding Provider Implementations
// ──────────────────────────────────────────────

import type { EmbeddingProvider, EmbeddingProviderType, EmbeddingResponse } from "@rex/types";
import { buildDeterministicEmbedding, sanitizeErrorMessage, startTimer, measureDuration } from "@rex/utils";

export function createEmbeddingProvider(
  provider: EmbeddingProviderType,
  options?: {
    apiKey?: string;
    model?: string;
    dimensions?: number;
    timeoutMs?: number;
  }
): EmbeddingProvider {
  switch (provider) {
    case "openai":
      return new OpenAIEmbeddingProvider(options?.apiKey ?? "", options?.model);
    case "cohere":
      return new CohereEmbeddingProvider(options?.apiKey ?? "", options?.model);
    case "deterministic":
    default:
      return new DeterministicEmbeddingProvider(options?.dimensions ?? 1536);
  }
}

class DeterministicEmbeddingProvider implements EmbeddingProvider {
  readonly provider: EmbeddingProviderType = "deterministic";
  private readonly dimensions: number;

  constructor(dimensions: number) {
    this.dimensions = Math.max(8, dimensions);
  }

  async embed(texts: string[]): Promise<EmbeddingResponse> {
    const timer = startTimer();
    const vectors = texts.map((text) => buildDeterministicEmbedding(text, this.dimensions));
    return {
      vectors,
      provider: "deterministic",
      model: `rex-hash-v1-${this.dimensions}`,
      dimensions: this.dimensions,
      durationMs: measureDuration(timer),
    };
  }
}

class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly provider: EmbeddingProviderType = "openai";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model?.trim() || "text-embedding-3-small";
  }

  async embed(texts: string[]): Promise<EmbeddingResponse> {
    if (!this.apiKey) {
      throw new Error("OpenAI embedding provider requires API key");
    }
    const timer = startTimer();
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "Unknown error");
      throw new Error(`OpenAI embeddings failed (${response.status}): ${body}`);
    }

    const json = (await response.json()) as {
      data?: Array<{ embedding?: number[] }>;
      model?: string;
    };
    const vectors = (json.data ?? []).map((item) => item.embedding ?? []);
    const dimensions = vectors[0]?.length ?? 0;
    return {
      vectors,
      provider: "openai",
      model: json.model ?? this.model,
      dimensions,
      durationMs: measureDuration(timer),
    };
  }
}

class CohereEmbeddingProvider implements EmbeddingProvider {
  readonly provider: EmbeddingProviderType = "cohere";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model?.trim() || "embed-english-v3.0";
  }

  async embed(texts: string[]): Promise<EmbeddingResponse> {
    if (!this.apiKey) {
      throw new Error("Cohere embedding provider requires API key");
    }
    const timer = startTimer();

    try {
      const response = await fetch("https://api.cohere.com/v1/embed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          texts,
          input_type: "search_document",
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "Unknown error");
        throw new Error(`Cohere embeddings failed (${response.status}): ${body}`);
      }

      const json = (await response.json()) as {
        embeddings?: number[][];
        response_type?: string;
      };
      const vectors = json.embeddings ?? [];
      const dimensions = vectors[0]?.length ?? 0;
      return {
        vectors,
        provider: "cohere",
        model: this.model,
        dimensions,
        durationMs: measureDuration(timer),
      };
    } catch (error) {
      throw new Error(`Cohere embedding provider error: ${sanitizeErrorMessage(error)}`);
    }
  }
}
