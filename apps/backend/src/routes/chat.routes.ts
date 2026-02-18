// ──────────────────────────────────────────────
// REX - Workflow Chat Assistant Routes
// Uses Gemini LLM to reason about the user's workflow
// ──────────────────────────────────────────────

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { ApiKeyService } from "../services/apikey.service.js";
import { createLLMProvider } from "@rex/llm";
import { createLogger } from "@rex/utils";

const logger = createLogger("chat-routes");

interface ChatRequestBody {
  message: string;
  workflow: {
    name: string;
    description: string;
    nodes: Array<{
      id: string;
      type: string;
      label: string;
      config: Record<string, unknown>;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
    }>;
  };
  executionStatus?: string | null;
  nodeStatuses?: Record<string, { status: string; error: string | null }>;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

const SYSTEM_PROMPT = `You are REX Assistant, an AI workflow automation expert embedded in the REX workflow editor. You help users understand, debug, and improve their visual workflows.

You can SEE the user's current workflow including:
- All nodes (their types, labels, and configurations)
- How nodes are connected (edges/flow)
- Current execution status and any errors

Your role:
1. Answer questions about why a workflow might be failing
2. Explain what each node does and how data flows between them
3. Suggest improvements or missing configurations
4. Help debug execution errors
5. Recommend best practices for workflow design

Rules:
- Be concise and helpful
- When referencing nodes, use their label and type (e.g. "the AI Model node 'Generate Summary'")
- If you see an error, explain the likely cause and how to fix it
- You CANNOT edit the workflow directly — only suggest changes
- Format suggestions as clear actionable steps
- If the workflow is empty, guide the user on how to get started
- Use markdown formatting for clarity`;

export function registerChatRoutes(
  app: FastifyInstance,
  apiKeyService: ApiKeyService
): void {
  app.register(async function scopedRoutes(scoped: FastifyInstance) {
    scoped.addHook("onRequest", app.authenticate);

    scoped.post("/api/chat", async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as ChatRequestBody;

      if (!body.message || typeof body.message !== "string") {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Message is required" },
        });
      }

      const userId = (request.user as { sub: string }).sub;

      // Try to get an API key — prefer Gemini, fall back to Groq
      let providerType: "gemini" | "groq";
      let chatApiKey: string;
      let chatModel: string;

      try {
        chatApiKey = await apiKeyService.getDecryptedKey(userId, "gemini");
        providerType = "gemini";
        chatModel = "gemini-2.0-flash";
      } catch {
        try {
          chatApiKey = await apiKeyService.getDecryptedKey(userId, "groq");
          providerType = "groq";
          chatModel = "llama-3.3-70b-versatile";
        } catch {
          return reply.status(400).send({
            success: false,
            error: {
              code: "MISSING_API_KEY",
              message: "Please add a Gemini or Groq API key in Settings to use the chat assistant.",
            },
          });
        }
      }

      // Build the workflow context prompt
      const workflowContext = buildWorkflowContext(body);

      // Build conversation messages
      const messages: Array<{ role: string; content: string }> = [];

      // Add previous conversation history (last 10 messages)
      if (body.history && body.history.length > 0) {
        const recent = body.history.slice(-10);
        for (const msg of recent) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }

      // Add current user message with context
      const userPrompt = `${workflowContext}\n\nUser question: ${body.message}`;
      messages.push({ role: "user", content: userPrompt });

      try {
        const provider = createLLMProvider(providerType, chatApiKey, chatModel);

        const response = await provider.generate(userPrompt, {
          systemPrompt: SYSTEM_PROMPT,
          maxTokens: 1024,
          temperature: 0.4,
          timeoutMs: 30000,
        });

        logger.info({
          userId,
          tokens: response.usage.totalTokens,
          durationMs: response.durationMs,
        }, "Chat response generated");

        return reply.send({
          success: true,
          data: {
            message: response.content,
            usage: response.usage,
          },
        });
      } catch (err) {
        logger.error({ userId, error: err }, "Chat LLM call failed");
        return reply.status(500).send({
          success: false,
          error: {
            code: "CHAT_ERROR",
            message: err instanceof Error ? err.message : "Failed to generate response",
          },
        });
      }
    });
  });
}

function buildWorkflowContext(body: ChatRequestBody): string {
  const { workflow, executionStatus, nodeStatuses } = body;

  const lines: string[] = [
    `## Current Workflow: "${workflow.name}"`,
    workflow.description ? `Description: ${workflow.description}` : "",
    "",
    `### Nodes (${workflow.nodes.length}):`,
  ];

  for (const node of workflow.nodes) {
    const status = nodeStatuses?.[node.id];
    const statusStr = status ? ` [${status.status}${status.error ? ` — ERROR: ${status.error}` : ""}]` : "";
    lines.push(`- **${node.label}** (type: ${node.type}, id: ${node.id.slice(0, 8)})${statusStr}`);

    // Show relevant config (exclude empty values)
    const configEntries = Object.entries(node.config).filter(
      ([, v]) => v !== "" && v !== null && v !== undefined
    );
    if (configEntries.length > 0) {
      for (const [key, value] of configEntries) {
        const display = typeof value === "string" && value.length > 100
          ? value.slice(0, 100) + "..."
          : String(value);
        lines.push(`  - ${key}: ${display}`);
      }
    }
  }

  lines.push("");
  lines.push(`### Connections (${workflow.edges.length}):`);
  for (const edge of workflow.edges) {
    const srcNode = workflow.nodes.find((n) => n.id === edge.source);
    const tgtNode = workflow.nodes.find((n) => n.id === edge.target);
    lines.push(
      `- ${srcNode?.label ?? edge.source.slice(0, 8)} → ${tgtNode?.label ?? edge.target.slice(0, 8)}`
    );
  }

  if (executionStatus) {
    lines.push("");
    lines.push(`### Last Execution Status: ${executionStatus}`);
  }

  return lines.filter((l) => l !== undefined).join("\n");
}
