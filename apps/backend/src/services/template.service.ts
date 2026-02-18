// ──────────────────────────────────────────────
// REX - Workflow Template Service
// Template catalog and workflow instantiation
// ──────────────────────────────────────────────

import { randomUUID } from "node:crypto";
import type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowTemplateDescriptor,
  WorkflowTemplateId,
  WorkflowTemplateInstantiateInput,
  WorkflowTemplateRuntimeParams,
  KnowledgeScopeType,
  RuntimeKnowledgeRetrievalStrategy,
} from "@rex/types";
import { createLogger } from "@rex/utils";
import type { WorkflowService, WorkflowRecord } from "./workflow.service.js";

const logger = createLogger("template-service");

interface TemplateService {
  list(): WorkflowTemplateDescriptor[];
  getById(templateId: string): WorkflowTemplateDescriptor | null;
  preview(
    templateId: string,
    input: WorkflowTemplateInstantiateInput
  ): TemplatePreviewResult;
  instantiate(
    userId: string,
    templateId: string,
    input: WorkflowTemplateInstantiateInput
  ): Promise<WorkflowRecord>;
}

interface TemplateRuntimeParams {
  queryPath: string;
  corpusId?: string;
  scopeType?: KnowledgeScopeType;
  workflowId?: string;
  executionId?: string;
  topK: number;
}

interface TemplateBuildResult {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  description: string;
}

interface TemplatePreviewResult {
  template: WorkflowTemplateDescriptor;
  workflowName: string;
  description: string;
  params: TemplateRuntimeParams;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

type TemplateBuilder = (params: TemplateRuntimeParams) => TemplateBuildResult;

interface TemplateDefinition {
  descriptor: WorkflowTemplateDescriptor;
  build: TemplateBuilder;
}

const TEMPLATE_DEFINITIONS: Record<WorkflowTemplateId, TemplateDefinition> = {
  "simple-rag": {
    descriptor: {
      id: "simple-rag",
      version: 1,
      name: "Simple RAG",
      description: "Single retriever + single reasoner baseline.",
      category: "rag",
      maturity: "in-progress",
      defaultWorkflowName: "Simple RAG Workflow",
      tags: ["rag", "baseline", "retrieval"],
    },
    build: (params) => {
      const trigger = node("manual-trigger", "Manual Run", 40, 180, {});
      const ingest = createKnowledgeIngestNode(params, 270, 120, "Load Knowledge");
      const retrieve = createKnowledgeRetrieveNode(params, 270, 250, "Retrieve Context", {
        strategy: "single",
        minMatches: 1,
      });
      const answer = node("llm", "RAG Answer", 560, 180, {
        ...defaultLLMConfig(
          "Answer the user query using retrieved knowledge. Query: {{query}}"
        ),
      });
      const out = node("output", "Final Output", 860, 180, {});

      return {
        nodes: [trigger, ingest, retrieve, answer, out],
        edges: [
          edge(trigger, ingest),
          edge(ingest, retrieve),
          edge(retrieve, answer),
          edge(answer, out),
        ],
        description:
          "Dual-flow simple RAG baseline with explicit ingestion and retrieval nodes.",
      };
    },
  },
  "memory-augmented-rag": {
    descriptor: {
      id: "memory-augmented-rag",
      version: 1,
      name: "Memory-Augmented RAG",
      description: "Retrieval with execution memory read/write.",
      category: "memory",
      maturity: "in-progress",
      defaultWorkflowName: "Memory Augmented RAG Workflow",
      tags: ["memory", "rag", "context"],
    },
    build: (params) => {
      const trigger = node("manual-trigger", "Manual Run", 40, 160, {});
      const ingest = createKnowledgeIngestNode(params, 240, 70, "Load Knowledge");
      const readMemory = node("memory-read", "Read Memory", 250, 220, {
        memoryKey: "session.summary",
        outputKey: "sessionSummary",
        required: false,
        defaultValue: "",
      });
      const retrieve = createKnowledgeRetrieveNode(
        params,
        480,
        160,
        "Retrieve Context",
        {
          strategy: "single",
          minMatches: 1,
        }
      );
      const answer = node("llm", "RAG + Memory Answer", 720, 160, {
        ...defaultLLMConfig(
          "Use retrieved context and session summary to answer.\nSummary: {{sessionSummary}}\nQuery: {{query}}"
        ),
      });
      const writeMemory = node("memory-write", "Update Memory", 940, 160, {
        memoryKey: "session.summary",
        operation: "set",
        valuePath: "content",
        outputKey: "sessionSummary",
      });
      const out = node("output", "Final Output", 1160, 160, {});

      return {
        nodes: [trigger, ingest, readMemory, retrieve, answer, writeMemory, out],
        edges: [
          edge(trigger, ingest),
          edge(ingest, readMemory),
          edge(readMemory, retrieve),
          edge(retrieve, answer),
          edge(answer, writeMemory),
          edge(writeMemory, out),
        ],
        description:
          "Retrieval flow that reads and updates execution memory to maintain evolving context.",
      };
    },
  },
  "agentic-rag": {
    descriptor: {
      id: "agentic-rag",
      version: 1,
      name: "Agentic RAG",
      description: "Planner + reasoner with evaluation retries.",
      category: "agentic",
      maturity: "in-progress",
      defaultWorkflowName: "Agentic RAG Workflow",
      tags: ["agentic", "planner", "retry"],
    },
    build: (params) => {
      const trigger = node("manual-trigger", "Manual Run", 40, 170, {});
      const ingest = createKnowledgeIngestNode(params, 250, 70, "Load Knowledge");
      const planner = node("llm", "Plan", 280, 250, {
        ...defaultLLMConfig(
          "Create a concise plan for answering this question with retrieval: {{query}}"
        ),
      });
      const retrieve = createKnowledgeRetrieveNode(
        params,
        520,
        250,
        "Retrieve Context",
        {
          strategy: "first-non-empty",
          retrievers: [
            { key: "semantic", queryTemplate: `{{${params.queryPath}}}` },
            { key: "lexical", queryTemplate: `{{${params.queryPath}}}`, topK: Math.max(4, params.topK - 2) },
          ],
        }
      );
      const reasoner = node("llm", "Execute Plan", 760, 250, {
        ...defaultLLMConfig(
          "Use plan and retrieved context to answer.\nPlan: {{content}}\nQuestion: {{query}}"
        ),
        retryEnabled: true,
        retryMaxAttempts: 3,
      });
      const evaluate = node("evaluation", "Evaluate", 980, 250, {
        valuePath: "content",
        minLength: 120,
        requestRetryOnFail: true,
        retryDelayMs: 250,
      });
      const out = node("output", "Final Output", 1180, 250, {});

      return {
        nodes: [trigger, ingest, planner, retrieve, reasoner, evaluate, out],
        edges: [
          edge(trigger, ingest),
          edge(ingest, planner),
          edge(planner, retrieve),
          edge(retrieve, reasoner),
          edge(reasoner, evaluate),
          edge(evaluate, out),
        ],
        description:
          "Planner-reasoner agentic pipeline with evaluation-guided retries.",
      };
    },
  },
  "graph-rag": {
    descriptor: {
      id: "graph-rag",
      version: 1,
      name: "Graph RAG",
      description: "Relationship-aware retrieval merge strategy.",
      category: "rag",
      maturity: "in-progress",
      defaultWorkflowName: "Graph RAG Workflow",
      tags: ["graph", "merge", "retrievers"],
    },
    build: (params) => {
      const trigger = node("manual-trigger", "Manual Run", 40, 180, {});
      const ingest = createKnowledgeIngestNode(params, 240, 110, "Load Knowledge");
      const retrieve = createKnowledgeRetrieveNode(
        params,
        460,
        180,
        "Graph Retrieve",
        {
          strategy: "merge",
          retrievers: [
            { key: "entity", queryTemplate: `{{${params.queryPath}}}` },
            { key: "relation", queryTemplate: `relationships for {{${params.queryPath}}}` },
          ],
        }
      );
      const graphReasoner = node("llm", "Graph Reasoner", 720, 180, {
        ...defaultLLMConfig(
          "Synthesize an answer using entity and relation retrieval context. Query: {{query}}"
        ),
      });
      const out = node("output", "Final Output", 980, 180, {});

      return {
        nodes: [trigger, ingest, retrieve, graphReasoner, out],
        edges: [
          edge(trigger, ingest),
          edge(ingest, retrieve),
          edge(retrieve, graphReasoner),
          edge(graphReasoner, out),
        ],
        description:
          "Graph-oriented retrieval by merging entity and relation retriever branches.",
      };
    },
  },
  "branched-rag": {
    descriptor: {
      id: "branched-rag",
      version: 1,
      name: "Branched RAG",
      description: "Multi-retriever branch selection strategy.",
      category: "rag",
      maturity: "in-progress",
      defaultWorkflowName: "Branched RAG Workflow",
      tags: ["branch", "best-score", "retrieval"],
    },
    build: (params) => {
      const trigger = node("manual-trigger", "Manual Run", 40, 180, {});
      const ingest = createKnowledgeIngestNode(params, 240, 110, "Load Knowledge");
      const retrieve = createKnowledgeRetrieveNode(
        params,
        460,
        180,
        "Branch Retrieve",
        {
          strategy: "best-score",
          retrievers: [
            { key: "faq", queryTemplate: `faq {{${params.queryPath}}}` },
            { key: "docs", queryTemplate: `docs {{${params.queryPath}}}` },
            { key: "notes", queryTemplate: `notes {{${params.queryPath}}}` },
          ],
        }
      );
      const branched = node("llm", "Branch Selector", 720, 180, {
        ...defaultLLMConfig("Answer using the strongest retrieved branch for: {{query}}"),
      });
      const out = node("output", "Final Output", 980, 180, {});

      return {
        nodes: [trigger, ingest, retrieve, branched, out],
        edges: [
          edge(trigger, ingest),
          edge(ingest, retrieve),
          edge(retrieve, branched),
          edge(branched, out),
        ],
        description:
          "Retrieval branch competition where the best-scoring branch is selected.",
      };
    },
  },
  "self-rag": {
    descriptor: {
      id: "self-rag",
      version: 1,
      name: "Self-RAG",
      description: "Self-evaluation loop with retry directive.",
      category: "agentic",
      maturity: "in-progress",
      defaultWorkflowName: "Self-RAG Workflow",
      tags: ["self-eval", "retry", "quality"],
    },
    build: (params) => {
      const trigger = node("manual-trigger", "Manual Run", 40, 180, {});
      const ingest = createKnowledgeIngestNode(params, 240, 110, "Load Knowledge");
      const retrieve = createKnowledgeRetrieveNode(params, 460, 180, "Retrieve Context", {
        strategy: "single",
      });
      const answer = node("llm", "Answer", 700, 180, {
        ...defaultLLMConfig("Provide a complete and factual answer for: {{query}}"),
        retryEnabled: true,
        retryMaxAttempts: 3,
      });
      const evaluate = node("evaluation", "Self Evaluation", 920, 180, {
        valuePath: "content",
        minLength: 140,
        requestRetryOnFail: true,
      });
      const out = node("output", "Final Output", 1140, 180, {});

      return {
        nodes: [trigger, ingest, retrieve, answer, evaluate, out],
        edges: [
          edge(trigger, ingest),
          edge(ingest, retrieve),
          edge(retrieve, answer),
          edge(answer, evaluate),
          edge(evaluate, out),
        ],
        description:
          "Retrieval answer with explicit self-evaluation and automatic retry signaling.",
      };
    },
  },
  "adaptive-rag": {
    descriptor: {
      id: "adaptive-rag",
      version: 1,
      name: "Adaptive RAG",
      description: "Runtime memory-guided retriever routing.",
      category: "rag",
      maturity: "in-progress",
      defaultWorkflowName: "Adaptive RAG Workflow",
      tags: ["adaptive", "routing", "memory"],
    },
    build: (params) => {
      const trigger = node("manual-trigger", "Manual Run", 40, 180, {});
      const ingest = createKnowledgeIngestNode(params, 240, 80, "Load Knowledge");
      const readRouting = node("memory-read", "Read Retriever Preference", 280, 250, {
        memoryKey: "routing.preferredRetriever",
        outputKey: "preferredRetriever",
        defaultValue: "semantic",
      });
      const retrieve = createKnowledgeRetrieveNode(
        params,
        560,
        180,
        "Adaptive Retrieve",
        {
          strategy: "adaptive",
          preferredRetrieverMemoryKey: "routing.preferredRetriever",
          retrievers: [
            { key: "semantic", queryTemplate: `{{${params.queryPath}}}` },
            { key: "keyword", queryTemplate: `keyword {{${params.queryPath}}}` },
          ],
        }
      );
      const answer = node("llm", "Adaptive Answer", 820, 180, {
        ...defaultLLMConfig("Use adaptive retrieval routing to answer: {{query}}"),
      });
      const out = node("output", "Final Output", 1060, 180, {});

      return {
        nodes: [trigger, ingest, readRouting, retrieve, answer, out],
        edges: [
          edge(trigger, ingest),
          edge(ingest, readRouting),
          edge(readRouting, retrieve),
          edge(retrieve, answer),
          edge(answer, out),
        ],
        description:
          "Retriever strategy selected dynamically from execution memory state.",
      };
    },
  },
  "speculative-rag": {
    descriptor: {
      id: "speculative-rag",
      version: 1,
      name: "Speculative RAG",
      description: "Speculative parallel retrievers merged into one answer.",
      category: "rag",
      maturity: "in-progress",
      defaultWorkflowName: "Speculative RAG Workflow",
      tags: ["speculative", "parallel", "merge"],
    },
    build: (params) => {
      const trigger = node("manual-trigger", "Manual Run", 40, 180, {});
      const ingest = createKnowledgeIngestNode(params, 240, 110, "Load Knowledge");
      const retrieve = createKnowledgeRetrieveNode(
        params,
        460,
        180,
        "Speculative Retrieve",
        {
          strategy: "merge",
          speculative: true,
          retrievers: [
            { key: "semantic", queryTemplate: `{{${params.queryPath}}}` },
            { key: "keyword", queryTemplate: `keyword {{${params.queryPath}}}` },
            { key: "summary", queryTemplate: `summary {{${params.queryPath}}}` },
          ],
        }
      );
      const answer = node("llm", "Speculative Answer", 740, 180, {
        ...defaultLLMConfig("Combine speculative retrieval branches for: {{query}}"),
      });
      const out = node("output", "Final Output", 980, 180, {});

      return {
        nodes: [trigger, ingest, retrieve, answer, out],
        edges: [
          edge(trigger, ingest),
          edge(ingest, retrieve),
          edge(retrieve, answer),
          edge(answer, out),
        ],
        description:
          "Speculative retrieval branches resolved through merge orchestration.",
      };
    },
  },
  "corrective-rag": {
    descriptor: {
      id: "corrective-rag",
      version: 1,
      name: "Corrective RAG",
      description: "Evaluation-gated corrective reasoning path.",
      category: "agentic",
      maturity: "in-progress",
      defaultWorkflowName: "Corrective RAG Workflow",
      tags: ["corrective", "evaluation", "branching"],
    },
    build: (params) => {
      const trigger = node("manual-trigger", "Manual Run", 40, 220, {});
      const ingest = createKnowledgeIngestNode(params, 240, 120, "Load Knowledge");
      const retrieveInitial = createKnowledgeRetrieveNode(
        params,
        500,
        220,
        "Initial Retrieve",
        {
          strategy: "single",
        }
      );
      const answer = node("llm", "Initial Answer", 740, 220, {
        ...defaultLLMConfig("Answer the query using retrieval context: {{query}}"),
      });
      const evaluate = node("evaluation", "Evaluate Answer", 960, 220, {
        valuePath: "content",
        minLength: 150,
      });
      const retrieveCorrective = createKnowledgeRetrieveNode(
        params,
        1180,
        330,
        "Corrective Retrieve",
        {
          strategy: "merge",
          retrievers: [
            { key: "semantic", queryTemplate: `{{${params.queryPath}}}` },
            { key: "fallback", queryTemplate: `explain {{${params.queryPath}}}` },
          ],
        }
      );
      const correct = node("llm", "Corrective Answer", 1380, 330, {
        ...defaultLLMConfig(
          "Previous answer was insufficient. Improve it with additional context.\nPrevious: {{content}}\nQuery: {{query}}"
        ),
      });
      const out = node("output", "Final Output", 1600, 220, {});

      return {
        nodes: [trigger, ingest, retrieveInitial, answer, evaluate, retrieveCorrective, correct, out],
        edges: [
          edge(trigger, ingest),
          edge(ingest, retrieveInitial),
          edge(retrieveInitial, answer),
          edge(answer, evaluate),
          edge(evaluate, out, "pass"),
          edge(evaluate, retrieveCorrective, "fail"),
          edge(retrieveCorrective, correct),
          edge(correct, out),
        ],
        description:
          "Evaluation controls branch routing; failed answers take corrective retrieval path.",
      };
    },
  },
  "modular-rag": {
    descriptor: {
      id: "modular-rag",
      version: 1,
      name: "Modular RAG",
      description: "Composable retrieval and synthesis modules.",
      category: "rag",
      maturity: "in-progress",
      defaultWorkflowName: "Modular RAG Workflow",
      tags: ["modular", "synthesis", "pipeline"],
    },
    build: (params) => {
      const trigger = node("manual-trigger", "Manual Run", 40, 170, {});
      const ingest = createKnowledgeIngestNode(params, 250, 70, "Load Knowledge");
      const retrieve = createKnowledgeRetrieveNode(params, 300, 240, "Retrieve Module", {
        strategy: "single",
      });
      const summarizeFacts = node("llm", "Retrieve Module", 560, 240, {
        ...defaultLLMConfig("Extract key facts for: {{query}}"),
      });
      const synthesize = node("llm", "Synthesis Module", 820, 240, {
        ...defaultLLMConfig("Synthesize final response from facts:\n{{content}}"),
      });
      const out = node("output", "Final Output", 1080, 240, {});

      return {
        nodes: [trigger, ingest, retrieve, summarizeFacts, synthesize, out],
        edges: [
          edge(trigger, ingest),
          edge(ingest, retrieve),
          edge(retrieve, summarizeFacts),
          edge(summarizeFacts, synthesize),
          edge(synthesize, out),
        ],
        description:
          "Explicit module breakdown between retrieval grounding and response synthesis.",
      };
    },
  },
  "multimodal-rag": {
    descriptor: {
      id: "multimodal-rag",
      version: 1,
      name: "Multimodal RAG",
      description: "Multimodal-oriented retrieval and reasoning blueprint.",
      category: "multimodal",
      maturity: "in-progress",
      defaultWorkflowName: "Multimodal RAG Workflow",
      tags: ["multimodal", "context", "retrieval"],
    },
    build: (params) => {
      const trigger = node("manual-trigger", "Manual Run", 40, 180, {});
      const ingest = createKnowledgeIngestNode(params, 240, 110, "Load Knowledge");
      const retrieve = createKnowledgeRetrieveNode(
        params,
        460,
        180,
        "Multimodal Retrieve",
        {
          strategy: "merge",
          topK: Math.min(20, Math.max(8, params.topK)),
          retrievers: [
            { key: "text", queryTemplate: `{{${params.queryPath}}}` },
            { key: "captions", queryTemplate: `captions {{${params.queryPath}}}` },
          ],
        }
      );
      const reason = node("llm", "Multimodal Reasoner", 740, 180, {
        ...defaultLLMConfig(
          "Use available textual and metadata context to answer multimodal-style query: {{query}}"
        ),
      });
      const out = node("output", "Final Output", 980, 180, {});

      return {
        nodes: [trigger, ingest, retrieve, reason, out],
        edges: [
          edge(trigger, ingest),
          edge(ingest, retrieve),
          edge(retrieve, reason),
          edge(reason, out),
        ],
        description:
          "Multimodal-ready scaffold using merged retrievers for textual and descriptive context.",
      };
    },
  },
  "hyde-retrieval": {
    descriptor: {
      id: "hyde-retrieval",
      version: 1,
      name: "HyDE Retrieval",
      description: "Hypothetical document generation before retrieval.",
      category: "rag",
      maturity: "in-progress",
      defaultWorkflowName: "HyDE Retrieval Workflow",
      tags: ["hyde", "query-expansion", "retrieval"],
    },
    build: (params) => {
      const trigger = node("manual-trigger", "Manual Run", 40, 190, {});
      const ingest = createKnowledgeIngestNode(params, 220, 90, "Load Knowledge");
      const hypothetical = node("llm", "Generate Hypothesis", 300, 190, {
        ...defaultLLMConfig(
          "Draft a hypothetical ideal answer to improve retrieval for: {{query}}"
        ),
      });
      const retrieve = createKnowledgeRetrieveNode(
        params,
        600,
        190,
        "HyDE Retrieve",
        {
          queryTemplate: "{{content}}",
          fallbackQueryTemplate: `{{${params.queryPath}}}`,
          strategy: "single",
        }
      );
      const finalAnswer = node("llm", "Retrieve + Answer", 860, 190, {
        ...defaultLLMConfig(
          "Use hypothesis and retrieved context to answer.\nHypothesis: {{content}}\nQuery: {{query}}"
        ),
      });
      const out = node("output", "Final Output", 1120, 190, {});

      return {
        nodes: [trigger, ingest, hypothetical, retrieve, finalAnswer, out],
        edges: [
          edge(trigger, ingest),
          edge(ingest, hypothetical),
          edge(hypothetical, retrieve),
          edge(retrieve, finalAnswer),
          edge(finalAnswer, out),
        ],
        description:
          "HyDE-style query expansion workflow for improved semantic retrieval quality.",
      };
    },
  },
};

export function createTemplateService(workflowService: WorkflowService): TemplateService {
  return {
    list() {
      return Object.values(TEMPLATE_DEFINITIONS).map((definition) => definition.descriptor);
    },

    getById(templateId) {
      if (!isTemplateId(templateId)) return null;
      return TEMPLATE_DEFINITIONS[templateId].descriptor;
    },

    preview(templateId, input) {
      return buildTemplatePreviewOrThrow(templateId, input);
    },

    async instantiate(userId, templateId, input) {
      const preview = buildTemplatePreviewOrThrow(templateId, input);

      logger.info(
        {
          userId,
          templateId,
          templateVersion: preview.template.version,
          workflowName: preview.workflowName,
          nodeCount: preview.nodes.length,
          edgeCount: preview.edges.length,
        },
        "Instantiating workflow template"
      );

      return await workflowService.create(
        userId,
        preview.workflowName,
        preview.description,
        preview.nodes,
        preview.edges,
        {
          templateId: preview.template.id,
          templateVersion: preview.template.version,
          templateParams: toTemplateParamsRecord(preview.params),
        }
      );
    },
  };
}

function buildTemplatePreviewOrThrow(
  templateId: string,
  input: WorkflowTemplateInstantiateInput
): TemplatePreviewResult {
  if (!isTemplateId(templateId)) {
    throw new Error(`Unknown workflow template "${templateId}"`);
  }

  const definition = TEMPLATE_DEFINITIONS[templateId];
  const runtimeParams = normalizeRuntimeParams(input.params);
  const graph = definition.build(runtimeParams);
  const workflowName =
    typeof input.name === "string" && input.name.trim().length > 0
      ? input.name.trim().slice(0, 255)
      : definition.descriptor.defaultWorkflowName;
  const description =
    typeof input.description === "string" && input.description.trim().length > 0
      ? input.description.trim().slice(0, 2048)
      : graph.description;

  return {
    template: definition.descriptor,
    workflowName,
    description,
    params: runtimeParams,
    nodes: graph.nodes,
    edges: graph.edges,
  };
}

function toTemplateParamsRecord(params: TemplateRuntimeParams): Record<string, unknown> {
  return {
    queryPath: params.queryPath,
    topK: params.topK,
    ...(params.corpusId ? { corpusId: params.corpusId } : {}),
    ...(params.scopeType ? { scopeType: params.scopeType } : {}),
    ...(params.workflowId ? { workflowId: params.workflowId } : {}),
    ...(params.executionId ? { executionId: params.executionId } : {}),
  };
}

function isTemplateId(value: string): value is WorkflowTemplateId {
  return Object.prototype.hasOwnProperty.call(TEMPLATE_DEFINITIONS, value);
}

function normalizeRuntimeParams(
  paramsRaw: WorkflowTemplateRuntimeParams | undefined
): TemplateRuntimeParams {
  const params = paramsRaw ?? {};
  const queryPath = asNonEmptyString(params["queryPath"]) ?? "query";
  const topK = clampInt(params["topK"], 1, 50, 8);
  let scopeType = parseScopeType(params["scopeType"]);
  let workflowId = asNonEmptyString(params["workflowId"]) ?? undefined;
  let executionId = asNonEmptyString(params["executionId"]) ?? undefined;

  if (!scopeType && executionId) {
    scopeType = "execution";
  } else if (!scopeType && workflowId) {
    scopeType = "workflow";
  }

  if (scopeType === "workflow" && !workflowId) {
    throw new Error("Invalid template params: workflowId is required when scopeType is workflow");
  }
  if (scopeType === "execution" && !executionId) {
    throw new Error("Invalid template params: executionId is required when scopeType is execution");
  }

  if (scopeType !== "workflow") {
    workflowId = undefined;
  }
  if (scopeType !== "execution") {
    executionId = undefined;
  }

  return {
    queryPath,
    topK,
    corpusId: asNonEmptyString(params["corpusId"]) ?? undefined,
    scopeType,
    workflowId,
    executionId,
  };
}

function defaultLLMConfig(promptTemplate: string): Record<string, unknown> {
  return {
    provider: "gemini",
    model: "gemini-2.0-flash",
    promptTemplate,
    temperature: 0.2,
    maxTokens: 1200,
  };
}

function createKnowledgeIngestNode(
  params: TemplateRuntimeParams,
  x: number,
  y: number,
  label: string
): WorkflowNode {
  return node("knowledge-ingest", label, x, y, defaultIngestionConfig(params));
}

function createKnowledgeRetrieveNode(
  params: TemplateRuntimeParams,
  x: number,
  y: number,
  label: string,
  overrides: Record<string, unknown> = {}
): WorkflowNode {
  const strategy =
    typeof overrides["strategy"] === "string"
      ? (overrides["strategy"] as RuntimeKnowledgeRetrievalStrategy)
      : "single";
  const queryTemplate =
    typeof overrides["queryTemplate"] === "string"
      ? (overrides["queryTemplate"] as string)
      : `{{${params.queryPath}}}`;

  return node("knowledge-retrieve", label, x, y, {
    ...defaultRetrieveConfig(params, strategy),
    queryTemplate,
    ...overrides,
  });
}

function defaultIngestionConfig(params: TemplateRuntimeParams): Record<string, unknown> {
  return {
    required: false,
    documentsPath: "documents",
    contentPath: "documentText",
    titlePath: "documentTitle",
    titleTemplate: "Runtime Document",
    sourceType: "inline",
    outputKey: "_knowledgeIngestion",
    ...(params.corpusId ? { corpusId: params.corpusId } : {}),
    ...(params.scopeType ? { scopeType: params.scopeType } : {}),
    ...(params.workflowId ? { workflowIdScope: params.workflowId } : {}),
    ...(params.executionId ? { executionIdScope: params.executionId } : {}),
  };
}

function defaultRetrieveConfig(
  params: TemplateRuntimeParams,
  strategy: RuntimeKnowledgeRetrievalStrategy
): Record<string, unknown> {
  return {
    strategy,
    queryPath: params.queryPath,
    queryTemplate: `{{${params.queryPath}}}`,
    topK: params.topK,
    failOnError: false,
    failOnEmpty: false,
    minMatches: 1,
    outputKey: "_knowledge",
    setAsPrimary: true,
    ...(params.corpusId ? { corpusId: params.corpusId } : {}),
    ...(params.scopeType ? { scopeType: params.scopeType } : {}),
    ...(params.workflowId ? { workflowIdScope: params.workflowId } : {}),
    ...(params.executionId ? { executionIdScope: params.executionId } : {}),
  };
}

function node(
  type: string,
  label: string,
  x: number,
  y: number,
  config: Record<string, unknown>
): WorkflowNode {
  return {
    id: randomUUID(),
    type,
    label,
    position: { x, y },
    config,
  };
}

function edge(
  source: WorkflowNode,
  target: WorkflowNode,
  condition?: string | boolean
): WorkflowEdge {
  return {
    id: randomUUID(),
    source: source.id,
    target: target.id,
    ...(condition === undefined ? {} : { condition }),
  };
}

function parseScopeType(value: unknown): KnowledgeScopeType | undefined {
  if (value === "user" || value === "workflow" || value === "execution") {
    return value;
  }
  return undefined;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(min, Math.min(max, Math.floor(value)));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(min, Math.min(max, Math.floor(parsed)));
    }
  }
  return fallback;
}
