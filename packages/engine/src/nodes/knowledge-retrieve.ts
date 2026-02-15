// ──────────────────────────────────────────────
// REX - KnowledgeRetrieveNode
// Retrieves scoped knowledge context explicitly in DAG
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
  KnowledgeScopeType,
  RuntimeKnowledgeRetrievalStrategy,
  RuntimeKnowledgeNodeQueryInput,
  RuntimeKnowledgeQueryResult,
} from "@rex/types";

interface RetrieverConfig {
  key: string;
  queryTemplate: string;
  topK?: number;
}

const STRATEGIES: RuntimeKnowledgeRetrievalStrategy[] = [
  "single",
  "merge",
  "first-non-empty",
  "best-score",
  "adaptive",
];

export const KnowledgeRetrieveNode: BaseNodeDefinition = {
  type: "knowledge-retrieve",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const queryTemplate = asNonEmptyString(config["queryTemplate"]);
    const queryPath = asNonEmptyString(config["queryPath"]);
    const retrievers = parseRetrievers(config["retrievers"]);

    if (!queryTemplate && !queryPath && retrievers.length === 0) {
      errors.push("KnowledgeRetrieveNode requires queryTemplate, queryPath, or retrievers");
    }

    const strategy = asStrategy(config["strategy"]);
    if (config["strategy"] !== undefined && !strategy) {
      errors.push(`Invalid strategy. Valid: ${STRATEGIES.join(", ")}`);
    }

    const topKRaw = toPositiveInt(config["topK"]);
    if (config["topK"] !== undefined && topKRaw === null) {
      errors.push("topK must be a positive integer");
    }

    const scopeType = asScopeType(config["scopeType"]);
    if (scopeType === "workflow" && !asNonEmptyString(config["workflowIdScope"])) {
      errors.push("workflowIdScope is required when scopeType is workflow");
    }
    if (scopeType === "execution" && !asNonEmptyString(config["executionIdScope"])) {
      errors.push("executionIdScope is required when scopeType is execution");
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    if (!context.retrieveKnowledge) {
      throw new Error("KnowledgeRetrieveNode requires retrieveKnowledge runtime support");
    }

    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("KnowledgeRetrieveNode: missing nodeConfig in metadata");
    }

    const outputKey = asNonEmptyString(nodeConfig["outputKey"]) ?? "_knowledge";
    const strategy = asStrategy(nodeConfig["strategy"]) ?? "single";
    const topK = clampInt(nodeConfig["topK"], 1, 50, 8);
    const minMatches = clampInt(nodeConfig["minMatches"], 0, 50, 0);
    const failOnEmpty = parseBooleanLike(nodeConfig["failOnEmpty"], false);
    const failOnError = parseBooleanLike(nodeConfig["failOnError"], false);
    const setAsPrimary =
      parseBooleanLike(nodeConfig["setAsPrimary"], outputKey === "_knowledge");
    const scopeType = asScopeType(nodeConfig["scopeType"]) ?? undefined;
    const workflowIdScope =
      asNonEmptyString(nodeConfig["workflowIdScope"]) ?? context.workflowId;
    const executionIdScope =
      asNonEmptyString(nodeConfig["executionIdScope"]) ?? context.executionId;
    const corpusId =
      asNonEmptyString(nodeConfig["corpusId"]) ??
      context.getMemory<string>("knowledge.activeCorpusId");

    const retrieverKeyFallback = asNonEmptyString(nodeConfig["retrieverKey"]) ?? "default";
    const retrievers =
      parseRetrievers(nodeConfig["retrievers"]).length > 0
        ? parseRetrievers(nodeConfig["retrievers"])
        : [
            {
              key: retrieverKeyFallback,
              queryTemplate:
                asNonEmptyString(nodeConfig["queryTemplate"]) ??
                `{{${asNonEmptyString(nodeConfig["queryPath"]) ?? "query"}}}`,
              topK,
            },
          ];
    const fallbackQueryTemplate = asNonEmptyString(nodeConfig["fallbackQueryTemplate"]);

    const branchResults: Array<{
      key: string;
      result: RuntimeKnowledgeQueryResult;
      error: string | null;
    }> = [];

    for (let branchIndex = 0; branchIndex < retrievers.length; branchIndex++) {
      const retriever = retrievers[branchIndex]!;
      let query = interpolateTemplate(retriever.queryTemplate, input.data).trim();
      if (!query && fallbackQueryTemplate) {
        query = interpolateTemplate(fallbackQueryTemplate, input.data).trim();
      }

      if (!query) {
        if (failOnError) {
          throw new Error(`Retriever "${retriever.key}" produced an empty query`);
        }
        continue;
      }

      const queryInput: RuntimeKnowledgeNodeQueryInput = {
        query,
        topK: retriever.topK ?? topK,
        corpusId,
        scopeType,
        workflowIdScope: scopeType === "workflow" ? workflowIdScope : undefined,
        executionIdScope: scopeType === "execution" ? executionIdScope : undefined,
        retrieverKey: retriever.key,
        retrievalStrategy: strategy,
        branchIndex,
      };

      try {
        const result = await context.retrieveKnowledge(queryInput);
        branchResults.push({
          key: retriever.key,
          result,
          error: null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown retrieval error";
        if (failOnError) {
          throw new Error(`Retriever "${retriever.key}" failed: ${message}`);
        }
        branchResults.push({
          key: retriever.key,
          result: {
            query,
            topK: queryInput.topK,
            matches: [],
          },
          error: message,
        });
      }
    }

    if (branchResults.length === 0) {
      if (failOnEmpty) {
        throw new Error("Knowledge retrieval produced no queryable branches");
      }
      return {
        data: {
          ...input.data,
          [outputKey]: {
            query: "",
            topK,
            matches: [],
            orchestration: {
              strategy,
              speculative: false,
              retrieversTried: [],
              selectedRetrieverKey: undefined,
              branchCount: 0,
            },
          },
        },
      };
    }

    const selected = selectResult(branchResults, strategy, context, nodeConfig);
    const selectedMatches = selected.result.matches;
    if (selectedMatches.length < minMatches && failOnEmpty) {
      throw new Error(
        `Knowledge retrieval returned ${selectedMatches.length} matches, below minMatches=${minMatches}`
      );
    }

    const payload: RuntimeKnowledgeQueryResult = {
      query: selected.result.query,
      topK: selected.result.topK,
      matches: selected.result.matches,
      orchestration: {
        strategy,
        speculative: parseBooleanLike(nodeConfig["speculative"], false),
        retrieversTried: branchResults.map((branch) => branch.key),
        selectedRetrieverKey: selected.key,
        branchCount: branchResults.length,
      },
    };

    context.logger.info("Knowledge retrieval node completed", {
      nodeId: context.nodeId,
      strategy,
      branches: branchResults.length,
      selectedRetriever: selected.key,
      matches: payload.matches.length,
      corpusId: corpusId ?? null,
    });

    return {
      data: {
        ...input.data,
        [outputKey]: payload,
        ...(setAsPrimary && outputKey !== "_knowledge" ? { _knowledge: payload } : {}),
        _knowledgeBranches: branchResults.map((branch) => ({
          key: branch.key,
          query: branch.result.query,
          topK: branch.result.topK,
          matchesCount: branch.result.matches.length,
          error: branch.error,
        })),
      },
      metadata: {
        contextPatch: {
          knowledge: {
            [`retrieval.${context.nodeId}`]: {
              strategy,
              selectedRetrieverKey: selected.key,
              branchCount: branchResults.length,
              matchesCount: payload.matches.length,
              timestamp: new Date().toISOString(),
            },
          },
        },
      },
    };
  },
};

function selectResult(
  branches: Array<{ key: string; result: RuntimeKnowledgeQueryResult; error: string | null }>,
  strategy: RuntimeKnowledgeRetrievalStrategy,
  context: NodeExecutionContext,
  config: Record<string, unknown>
): { key: string; result: RuntimeKnowledgeQueryResult; error: string | null } {
  if (strategy === "merge") {
    const mergedMatches = mergeMatches(branches.flatMap((branch) => branch.result.matches));
    const first = branches[0]!;
    return {
      key: "merged",
      error: null,
      result: {
        query: branches.map((branch) => branch.result.query).join(" || "),
        topK: first.result.topK,
        matches: mergedMatches.slice(0, first.result.topK),
      },
    };
  }

  if (strategy === "first-non-empty") {
    return branches.find((branch) => branch.result.matches.length > 0) ?? branches[0]!;
  }

  if (strategy === "best-score") {
    return branches.reduce((best, current) => {
      const bestScore = best.result.matches[0]?.score ?? Number.NEGATIVE_INFINITY;
      const currentScore = current.result.matches[0]?.score ?? Number.NEGATIVE_INFINITY;
      return currentScore > bestScore ? current : best;
    });
  }

  if (strategy === "adaptive") {
    const preferredRetrieverMemoryKey =
      asNonEmptyString(config["preferredRetrieverMemoryKey"]) ??
      "routing.preferredRetriever";
    const preferred = context.getMemory<string>(preferredRetrieverMemoryKey);
    if (preferred) {
      const preferredBranch = branches.find((branch) => branch.key === preferred);
      if (preferredBranch) return preferredBranch;
    }
    return branches.find((branch) => branch.result.matches.length > 0) ?? branches[0]!;
  }

  return branches[0]!;
}

function mergeMatches(matches: RuntimeKnowledgeQueryResult["matches"]): RuntimeKnowledgeQueryResult["matches"] {
  const merged = new Map<string, RuntimeKnowledgeQueryResult["matches"][number]>();
  for (const match of matches) {
    const existing = merged.get(match.chunkId);
    if (!existing || match.score > existing.score) {
      merged.set(match.chunkId, match);
    }
  }
  return Array.from(merged.values()).sort((a, b) => b.score - a.score);
}

function parseRetrievers(value: unknown): RetrieverConfig[] {
  if (!Array.isArray(value)) return [];
  const retrievers: RetrieverConfig[] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const asRecord = raw as Record<string, unknown>;
    const queryTemplate =
      asNonEmptyString(asRecord["queryTemplate"]) ??
      (asNonEmptyString(asRecord["queryPath"])
        ? `{{${asNonEmptyString(asRecord["queryPath"])}}}`
        : null);
    if (!queryTemplate) continue;
    retrievers.push({
      key: asNonEmptyString(asRecord["key"]) ?? `retriever-${retrievers.length + 1}`,
      queryTemplate,
      topK: toPositiveInt(asRecord["topK"]) ?? undefined,
    });
  }

  return retrievers;
}

function interpolateTemplate(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path: string) => {
    const resolved = resolvePath(data, path);
    return stringifyValue(resolved) ?? `{{${path}}}`;
  });
}

function resolvePath(data: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = data;
  for (const key of keys) {
    if (current !== null && typeof current === "object") {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseBooleanLike(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asScopeType(value: unknown): KnowledgeScopeType | null {
  if (value === "user" || value === "workflow" || value === "execution") {
    return value;
  }
  return null;
}

function asStrategy(value: unknown): RuntimeKnowledgeRetrievalStrategy | null {
  if (typeof value !== "string") return null;
  return STRATEGIES.includes(value as RuntimeKnowledgeRetrievalStrategy)
    ? (value as RuntimeKnowledgeRetrievalStrategy)
    : null;
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.floor(value);
    return normalized > 0 ? normalized : null;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    const normalized = Math.floor(parsed);
    return normalized > 0 ? normalized : null;
  }
  return null;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = toPositiveInt(value);
  if (parsed === null) return fallback;
  return Math.max(min, Math.min(max, parsed));
}
