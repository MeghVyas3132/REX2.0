// ──────────────────────────────────────────────
// REX - LLMNode
// Sends prompt to LLM provider and returns response
// Provider-agnostic — uses LLM factory abstraction
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
  LLMProviderType,
  LLMRequestOptions,
} from "@rex/types";
import { LLM_PROVIDERS } from "@rex/types";
import { createLLMProvider } from "@rex/llm";

export const LLMNode: BaseNodeDefinition = {
  type: "llm",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (!config["provider"]) {
      errors.push("LLMNode requires a 'provider' in config (gemini or groq)");
    } else if (!LLM_PROVIDERS.includes(config["provider"] as LLMProviderType)) {
      errors.push(`Invalid LLM provider: "${config["provider"] as string}". Valid: ${LLM_PROVIDERS.join(", ")}`);
    }

    if (!config["prompt"] && !config["promptTemplate"]) {
      errors.push("LLMNode requires either 'prompt' or 'promptTemplate' in config");
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("LLMNode: missing nodeConfig in metadata");
    }

    const requestedProvider = nodeConfig["provider"] as LLMProviderType;
    const requestedModel = nodeConfig["model"] as string | undefined;

    // Resolve prompt — support template interpolation
    let prompt: string;
    if (nodeConfig["promptTemplate"]) {
      prompt = interpolateTemplate(
        nodeConfig["promptTemplate"] as string,
        input.data
      );
    } else {
      prompt = nodeConfig["prompt"] as string;
    }

    // Auto-detect upstream file data and append to prompt
    const fileData = detectFileData(input.data);
    if (fileData) {
      context.logger.info("File data detected from upstream node", {
        nodeId: context.nodeId,
        fileName: fileData.fileName,
        format: fileData.fileFormat,
        preview: fileData.preview,
      });
      prompt = prompt + "\n\n--- Attached File Data ---\n"
        + `File: ${fileData.fileName} (${fileData.fileFormat?.toUpperCase() ?? "unknown"})\n`
        + (fileData.rowCount ? `Rows: ${fileData.rowCount}\n` : "")
        + "\n" + fileData.content;
    }

    const knowledgeData = detectKnowledgeData(input.data);
    if (knowledgeData) {
      context.logger.info("Knowledge context detected from retrieval", {
        nodeId: context.nodeId,
        query: knowledgeData.query,
        matches: knowledgeData.matches.length,
      });
      prompt = prompt + "\n\n--- Retrieved Knowledge Context ---\n"
        + `Query: ${knowledgeData.query}\n`
        + formatKnowledgeMatches(knowledgeData.matches);
    }

    context.logger.info("Executing LLM request", {
      nodeId: context.nodeId,
      provider: requestedProvider,
      model: requestedModel ?? "default",
      promptLength: prompt.length,
    });

    const resolvedProvider = await resolveProviderAndApiKey(
      context,
      requestedProvider,
      requestedModel
    );
    if (resolvedProvider.fallbackFrom) {
      context.logger.warn("Configured LLM provider key missing, using fallback provider", {
        nodeId: context.nodeId,
        requestedProvider: resolvedProvider.fallbackFrom,
        fallbackProvider: resolvedProvider.providerType,
      });
    }
    const provider = createLLMProvider(
      resolvedProvider.providerType,
      resolvedProvider.apiKey,
      resolvedProvider.model
    );

    const options: LLMRequestOptions = {
      maxTokens: (nodeConfig["maxTokens"] as number) ?? 2048,
      temperature: (nodeConfig["temperature"] as number) ?? 0.7,
      timeoutMs: (nodeConfig["timeoutMs"] as number) ?? 30000,
      systemPrompt: nodeConfig["systemPrompt"] as string | undefined,
    };

    const response = await provider.generate(prompt, options);

    context.logger.info("LLM request completed", {
      nodeId: context.nodeId,
      provider: resolvedProvider.providerType,
      model: response.model,
      totalTokens: response.usage.totalTokens,
      durationMs: response.durationMs,
    });

    const retryDirective = evaluateRetryDirective(nodeConfig, response.content);

    return {
      data: {
        content: response.content,
        usage: response.usage,
        model: response.model,
        provider: response.provider,
      },
      metadata: {
        durationMs: response.durationMs,
        providerFallback:
          resolvedProvider.fallbackFrom
            ? {
                from: resolvedProvider.fallbackFrom,
                to: resolvedProvider.providerType,
              }
            : undefined,
        retry: retryDirective ?? undefined,
      },
    };
  },
};

interface ResolvedProvider {
  providerType: LLMProviderType;
  apiKey: string;
  model: string | undefined;
  fallbackFrom?: LLMProviderType;
}

async function resolveProviderAndApiKey(
  context: NodeExecutionContext,
  requestedProvider: LLMProviderType,
  requestedModel: string | undefined
): Promise<ResolvedProvider> {
  try {
    const apiKey = await context.getApiKey(requestedProvider);
    return {
      providerType: requestedProvider,
      apiKey,
      model: requestedModel,
    };
  } catch (error) {
    if (!isMissingApiKeyError(error)) {
      throw error;
    }
  }

  const fallbackProviders = LLM_PROVIDERS.filter(
    (provider) => provider !== requestedProvider
  ) as LLMProviderType[];

  for (const fallbackProvider of fallbackProviders) {
    try {
      const apiKey = await context.getApiKey(fallbackProvider);
      // Use fallback provider's default model to avoid model/provider mismatch.
      return {
        providerType: fallbackProvider,
        apiKey,
        model: undefined,
        fallbackFrom: requestedProvider,
      };
    } catch (error) {
      if (!isMissingApiKeyError(error)) {
        throw error;
      }
    }
  }

  throw new Error(
    `No API key found for configured provider "${requestedProvider}" or fallback providers. ` +
      "Please add an API key in settings."
  );
}

function isMissingApiKeyError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return /no .*api key found for user/i.test(error.message);
}

function interpolateTemplate(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path: string) => {
    const keys = path.split(".");
    let value: unknown = data;
    for (const key of keys) {
      if (value !== null && typeof value === "object") {
        value = (value as Record<string, unknown>)[key];
      } else {
        return `{{${path}}}`;
      }
    }
    return String(value ?? `{{${path}}}`);
  });
}

// ── File data auto-detection ────────────────────

interface DetectedFileData {
  fileName: string;
  fileFormat: string | null;
  rowCount: number | null;
  preview: string | null;
  content: string;
}

interface DetectedKnowledgeMatch {
  rank: number;
  title: string;
  score: number;
  content: string;
}

interface DetectedKnowledgeData {
  query: string;
  matches: DetectedKnowledgeMatch[];
}

function evaluateRetryDirective(
  nodeConfig: Record<string, unknown>,
  content: string
): { requested: boolean; reason: string } | null {
  const requiredText = asNonEmptyString(nodeConfig["qualityCheckRequiredText"]);
  if (requiredText && !content.toLowerCase().includes(requiredText.toLowerCase())) {
    return {
      requested: true,
      reason: `Missing required text: "${requiredText}"`,
    };
  }

  const minLength = toPositiveInteger(nodeConfig["qualityCheckMinLength"]);
  if (minLength !== null && content.length < minLength) {
    return {
      requested: true,
      reason: `Response length ${content.length} below minimum ${minLength}`,
    };
  }

  return null;
}

function toPositiveInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.floor(value);
    return normalized > 0 ? normalized : null;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    const normalized = Math.floor(parsed);
    return normalized > 0 ? normalized : null;
  }
  return null;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Checks if the upstream input contains data from a file-upload node.
 * Returns formatted content string if found, null otherwise.
 */
function detectFileData(data: Record<string, unknown>): DetectedFileData | null {
  // File-upload node outputs: { fileName, fileFormat, data, rowCount, preview }
  if (!data["fileName"] || data["data"] === undefined) {
    return null;
  }

  const fileName = String(data["fileName"]);
  const fileFormat = data["fileFormat"] ? String(data["fileFormat"]) : null;
  const rowCount = typeof data["rowCount"] === "number" ? data["rowCount"] : null;
  const preview = data["preview"] ? String(data["preview"]) : null;
  const rawData = data["data"];

  // Convert file data to a string the LLM can understand
  let content: string;

  if (typeof rawData === "string") {
    // TXT or PDF — already text
    content = rawData;
  } else if (Array.isArray(rawData)) {
    // CSV rows (array of objects) — format as readable table
    if (rawData.length === 0) {
      content = "(empty file)";
    } else {
      const firstRow = rawData[0] as Record<string, unknown>;
      const headers = Object.keys(firstRow);
      const headerLine = headers.join(" | ");
      const separator = headers.map(() => "---").join(" | ");
      const rows = rawData.map((row: unknown) => {
        const r = row as Record<string, unknown>;
        return headers.map((h) => String(r[h] ?? "")).join(" | ");
      });

      // Limit to 200 rows for LLM context
      const displayRows = rows.slice(0, 200);
      content = [headerLine, separator, ...displayRows].join("\n");
      if (rawData.length > 200) {
        content += `\n... (${rawData.length - 200} more rows truncated)`;
      }
    }
  } else {
    // JSON object — stringify
    content = JSON.stringify(rawData, null, 2);
  }

  return { fileName, fileFormat, rowCount, preview, content };
}

function detectKnowledgeData(data: Record<string, unknown>): DetectedKnowledgeData | null {
  const raw = data["_knowledge"];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const query =
    typeof (raw as Record<string, unknown>)["query"] === "string"
      ? ((raw as Record<string, unknown>)["query"] as string)
      : "";
  const rawMatches = (raw as Record<string, unknown>)["matches"];
  if (!Array.isArray(rawMatches) || rawMatches.length === 0) {
    return null;
  }

  const matches: DetectedKnowledgeMatch[] = [];
  for (let i = 0; i < rawMatches.length; i++) {
    const match = rawMatches[i];
    if (!match || typeof match !== "object" || Array.isArray(match)) continue;
    const asRecord = match as Record<string, unknown>;
    const content = typeof asRecord["content"] === "string" ? asRecord["content"] : "";
    if (!content) continue;
    matches.push({
      rank: i + 1,
      title: typeof asRecord["title"] === "string" ? asRecord["title"] : "Untitled",
      score:
        typeof asRecord["score"] === "number" && Number.isFinite(asRecord["score"])
          ? asRecord["score"]
          : 0,
      content,
    });
  }

  if (matches.length === 0) {
    return null;
  }

  return {
    query: query || "(unspecified query)",
    matches,
  };
}

function formatKnowledgeMatches(matches: DetectedKnowledgeMatch[]): string {
  const lines: string[] = [];
  const capped = matches.slice(0, 12);

  for (const match of capped) {
    lines.push(
      `[${match.rank}] ${match.title} (score=${match.score.toFixed(4)})\n${match.content}`
    );
  }

  if (matches.length > capped.length) {
    lines.push(`... ${matches.length - capped.length} more retrieved chunks omitted`);
  }

  return lines.join("\n\n");
}
