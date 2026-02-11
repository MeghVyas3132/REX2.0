// ──────────────────────────────────────────────
// REX - HTTPRequestNode
// Makes HTTP requests to external APIs
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
} from "@rex/types";

export const HTTPRequestNode: BaseNodeDefinition = {
  type: "http-request",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    if (!config["url"]) {
      errors.push("HTTPRequestNode requires a 'url' in config");
    } else {
      const url = config["url"] as string;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        errors.push("HTTPRequestNode 'url' must start with http:// or https://");
      }
    }

    const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
    const method = (config["method"] as string | undefined) ?? "GET";
    if (!validMethods.includes(method.toUpperCase())) {
      errors.push(`Invalid HTTP method: "${method}". Valid: ${validMethods.join(", ")}`);
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("HTTPRequestNode: missing nodeConfig in metadata");
    }

    let url = nodeConfig["url"] as string;
    const method = ((nodeConfig["method"] as string) ?? "GET").toUpperCase();
    const headers = (nodeConfig["headers"] as Record<string, string>) ?? {};
    let body = nodeConfig["body"] as string | undefined;

    // Template interpolation for URL and body
    url = interpolate(url, input.data);
    if (body) {
      body = interpolate(body, input.data);
    }

    context.logger.info("Making HTTP request", {
      nodeId: context.nodeId,
      method,
      url,
    });

    const startTime = Date.now();

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      signal: AbortSignal.timeout(
        (nodeConfig["timeoutMs"] as number) ?? 30000
      ),
    };

    if (body && method !== "GET" && method !== "HEAD") {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);
    const durationMs = Date.now() - startTime;

    let responseBody: unknown;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    context.logger.info("HTTP request completed", {
      nodeId: context.nodeId,
      status: response.status,
      durationMs,
    });

    if (!response.ok && nodeConfig["failOnError"] !== false) {
      throw new Error(
        `HTTP request failed with status ${response.status}: ${typeof responseBody === "string" ? responseBody.substring(0, 200) : JSON.stringify(responseBody).substring(0, 200)}`
      );
    }

    return {
      data: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
      },
      metadata: {
        durationMs,
      },
    };
  },
};

function interpolate(template: string, data: Record<string, unknown>): string {
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
