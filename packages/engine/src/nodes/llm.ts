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
