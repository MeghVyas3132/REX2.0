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

    const providerType = nodeConfig["provider"] as LLMProviderType;
    const model = nodeConfig["model"] as string | undefined;

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

    context.logger.info("Executing LLM request", {
      nodeId: context.nodeId,
      provider: providerType,
      model: model ?? "default",
      promptLength: prompt.length,
    });

    // Get decrypted API key through context
    const apiKey = await context.getApiKey(providerType);
    const provider = createLLMProvider(providerType, apiKey, model);

    const options: LLMRequestOptions = {
      maxTokens: (nodeConfig["maxTokens"] as number) ?? 2048,
      temperature: (nodeConfig["temperature"] as number) ?? 0.7,
      timeoutMs: (nodeConfig["timeoutMs"] as number) ?? 30000,
      systemPrompt: nodeConfig["systemPrompt"] as string | undefined,
    };

    const response = await provider.generate(prompt, options);

    context.logger.info("LLM request completed", {
      nodeId: context.nodeId,
      provider: providerType,
      model: response.model,
      totalTokens: response.usage.totalTokens,
      durationMs: response.durationMs,
    });

    return {
      data: {
        content: response.content,
        usage: response.usage,
        model: response.model,
        provider: response.provider,
      },
      metadata: {
        durationMs: response.durationMs,
      },
    };
  },
};

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
