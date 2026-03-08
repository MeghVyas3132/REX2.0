// ──────────────────────────────────────────────
// REX - Reranker Provider Implementations
// ──────────────────────────────────────────────

import type { RerankResponse, RerankerProvider, RerankerProviderType } from "@rex/types";
import { lexicalRelevanceScore, measureDuration, sanitizeErrorMessage, startTimer } from "@rex/utils";

export function createRerankerProvider(
  provider: RerankerProviderType,
  options?: {
    apiKey?: string;
    model?: string;
  }
): RerankerProvider {
  switch (provider) {
    case "cohere":
      return new CohereRerankerProvider(options?.apiKey ?? "", options?.model);
    case "heuristic":
    default:
      return new HeuristicRerankerProvider(options?.model);
  }
}

class HeuristicRerankerProvider implements RerankerProvider {
  readonly provider: RerankerProviderType = "heuristic";
  private readonly model: string;

  constructor(model?: string) {
    this.model = model ?? "heuristic-lexical-v1";
  }

  async rerank(query: string, documents: string[]): Promise<RerankResponse> {
    const timer = startTimer();
    const scores = documents.map((doc) => lexicalRelevanceScore(query, doc));
    return {
      scores,
      provider: "heuristic",
      model: this.model,
      durationMs: measureDuration(timer),
    };
  }
}

class CohereRerankerProvider implements RerankerProvider {
  readonly provider: RerankerProviderType = "cohere";
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model?.trim() || "rerank-v3.5";
  }

  async rerank(query: string, documents: string[]): Promise<RerankResponse> {
    if (!this.apiKey) {
      throw new Error("Cohere reranker provider requires API key");
    }
    const timer = startTimer();

    try {
      const response = await fetch("https://api.cohere.com/v2/rerank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          query,
          documents,
          top_n: documents.length,
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "Unknown error");
        throw new Error(`Cohere rerank failed (${response.status}): ${body}`);
      }

      const json = (await response.json()) as {
        results?: Array<{ index: number; relevance_score: number }>;
      };
      const scores = new Array(documents.length).fill(0);
      for (const result of json.results ?? []) {
        if (typeof result.index !== "number") continue;
        scores[result.index] = typeof result.relevance_score === "number" ? result.relevance_score : 0;
      }

      return {
        scores,
        provider: "cohere",
        model: this.model,
        durationMs: measureDuration(timer),
      };
    } catch (error) {
      throw new Error(`Cohere reranker provider error: ${sanitizeErrorMessage(error)}`);
    }
  }
}
