// ──────────────────────────────────────────────
// REX - KnowledgeIngestNode
// Ingests runtime documents into scoped knowledge corpora
// ──────────────────────────────────────────────

import type {
  BaseNodeDefinition,
  NodeInput,
  NodeOutput,
  NodeExecutionContext,
  ValidationResult,
  KnowledgeScopeType,
  KnowledgeSourceType,
  RuntimeKnowledgeNodeIngestionInput,
} from "@rex/types";

interface NormalizedIngestionDocument {
  title: string;
  contentText: string;
  sourceType: KnowledgeSourceType;
  metadata: Record<string, unknown>;
}

export const KnowledgeIngestNode: BaseNodeDefinition = {
  type: "knowledge-ingest",

  validate(config: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    const scopeType = asScopeType(config["scopeType"]);
    if (scopeType === "workflow" && !asNonEmptyString(config["workflowIdScope"])) {
      errors.push("workflowIdScope is required when scopeType is workflow");
    }
    if (scopeType === "execution" && !asNonEmptyString(config["executionIdScope"])) {
      errors.push("executionIdScope is required when scopeType is execution");
    }

    const sourceType = asSourceType(config["sourceType"]);
    if (config["sourceType"] !== undefined && !sourceType) {
      errors.push("sourceType must be one of: upload, inline, api");
    }

    const required = parseBooleanLike(config["required"], false);
    if (required && !hasAnyDocumentExtractor(config)) {
      errors.push("required=true but no document extractor is configured (documentsPath/contentPath/contentTemplate)");
    }

    return { valid: errors.length === 0, errors };
  },

  async execute(input: NodeInput, context: NodeExecutionContext): Promise<NodeOutput> {
    if (!context.ingestKnowledge) {
      throw new Error("KnowledgeIngestNode requires ingestKnowledge runtime support");
    }

    const nodeConfig = input.metadata?.["nodeConfig"] as Record<string, unknown> | undefined;
    if (!nodeConfig) {
      throw new Error("KnowledgeIngestNode: missing nodeConfig in metadata");
    }

    const required = parseBooleanLike(nodeConfig["required"], false);
    const outputKey = asNonEmptyString(nodeConfig["outputKey"]) ?? "_knowledgeIngestion";
    const sourceType = asSourceType(nodeConfig["sourceType"]) ?? "inline";
    const docs = extractDocuments(input.data, nodeConfig, sourceType);

    if (docs.length === 0) {
      if (required) {
        throw new Error("KnowledgeIngestNode: no ingestable documents found in input");
      }

      return {
        data: {
          ...input.data,
          [outputKey]: {
            skipped: true,
            reason: "No documents found in configured paths/templates",
            ingestedCount: 0,
            ingestedAt: new Date().toISOString(),
          },
        },
      };
    }

    const scopeType = asScopeType(nodeConfig["scopeType"]) ?? undefined;
    const workflowIdScope =
      asNonEmptyString(nodeConfig["workflowIdScope"]) ?? context.workflowId;
    const executionIdScope =
      asNonEmptyString(nodeConfig["executionIdScope"]) ?? context.executionId;
    const configuredCorpusId = asNonEmptyString(nodeConfig["corpusId"]) ?? undefined;
    const results: Array<{
      corpusId: string;
      documentId: string;
      chunkCount: number;
      status: "ready" | "failed";
      title: string;
    }> = [];

    for (const doc of docs) {
      const ingestInput: RuntimeKnowledgeNodeIngestionInput = {
        title: doc.title,
        contentText: doc.contentText,
        sourceType: doc.sourceType,
        metadata: doc.metadata,
        corpusId: configuredCorpusId,
        scopeType,
        workflowIdScope: scopeType === "workflow" ? workflowIdScope : undefined,
        executionIdScope: scopeType === "execution" ? executionIdScope : undefined,
      };

      const result = await context.ingestKnowledge(ingestInput);
      results.push({
        corpusId: result.corpusId,
        documentId: result.documentId,
        chunkCount: result.chunkCount,
        status: result.status,
        title: doc.title,
      });
    }

    const primaryCorpusId = results[0]?.corpusId;
    if (primaryCorpusId) {
      context.setMemory("knowledge.activeCorpusId", primaryCorpusId);
    }

    context.logger.info("Knowledge ingestion node completed", {
      nodeId: context.nodeId,
      ingestedCount: results.length,
      corpusId: primaryCorpusId,
    });

    return {
      data: {
        ...input.data,
        [outputKey]: {
          ingestedCount: results.length,
          corpusId: primaryCorpusId ?? null,
          documents: results,
          ingestedAt: new Date().toISOString(),
        },
      },
      metadata: {
        contextPatch: primaryCorpusId
          ? {
              memory: {
                "knowledge.activeCorpusId": primaryCorpusId,
              },
            }
          : undefined,
      },
    };
  },
};

function hasAnyDocumentExtractor(config: Record<string, unknown>): boolean {
  return Boolean(
    asNonEmptyString(config["documentsPath"]) ||
      asNonEmptyString(config["contentPath"]) ||
      asNonEmptyString(config["contentTemplate"])
  );
}

function extractDocuments(
  inputData: Record<string, unknown>,
  config: Record<string, unknown>,
  defaultSourceType: KnowledgeSourceType
): NormalizedIngestionDocument[] {
  const documentsPath = asNonEmptyString(config["documentsPath"]);
  const contentPath = asNonEmptyString(config["contentPath"]);
  const contentTemplate = asNonEmptyString(config["contentTemplate"]);
  const titlePath = asNonEmptyString(config["titlePath"]);
  const titleTemplate = asNonEmptyString(config["titleTemplate"]);
  const fallbackTitle = asNonEmptyString(config["title"]) ?? "Runtime Document";

  if (documentsPath) {
    const value = resolvePath(inputData, documentsPath);
    if (Array.isArray(value)) {
      const fromArray = value
        .map((item, index) =>
          normalizeDocumentFromUnknown(
            item,
            index,
            defaultSourceType,
            fallbackTitle,
            inputData
          )
        )
        .filter((item): item is NormalizedIngestionDocument => item !== null);
      if (fromArray.length > 0) {
        return fromArray;
      }
    }
  }

  const resolvedContent = contentPath
    ? stringifyContent(resolvePath(inputData, contentPath))
    : contentTemplate
      ? interpolateTemplate(contentTemplate, inputData)
      : "";

  if (!resolvedContent) {
    return [];
  }

  const resolvedTitle = titlePath
    ? stringifyContent(resolvePath(inputData, titlePath))
    : titleTemplate
      ? interpolateTemplate(titleTemplate, inputData)
      : fallbackTitle;

  return [
    {
      title: resolvedTitle || fallbackTitle,
      contentText: resolvedContent,
      sourceType: defaultSourceType,
      metadata: {},
    },
  ];
}

function normalizeDocumentFromUnknown(
  raw: unknown,
  index: number,
  defaultSourceType: KnowledgeSourceType,
  fallbackTitle: string,
  inputData: Record<string, unknown>
): NormalizedIngestionDocument | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    const contentText = stringifyContent(raw);
    if (!contentText) return null;
    return {
      title: `${fallbackTitle} #${index + 1}`,
      contentText,
      sourceType: defaultSourceType,
      metadata: {},
    };
  }

  const asRecord = raw as Record<string, unknown>;
  const contentText =
    stringifyContent(asRecord["contentText"]) ??
    stringifyContent(asRecord["content"]) ??
    stringifyContent(asRecord["text"]) ??
    "";
  if (!contentText) {
    return null;
  }

  const title =
    asNonEmptyString(asRecord["title"]) ??
    asNonEmptyString(asRecord["name"]) ??
    `${fallbackTitle} #${index + 1}`;
  const sourceType = asSourceType(asRecord["sourceType"]) ?? defaultSourceType;
  const metadata =
    asRecord["metadata"] && typeof asRecord["metadata"] === "object" && !Array.isArray(asRecord["metadata"])
      ? (asRecord["metadata"] as Record<string, unknown>)
      : {
          sourceIndex: index,
          extractedFrom: inferDocumentSource(inputData),
        };

  return {
    title,
    contentText,
    sourceType,
    metadata,
  };
}

function inferDocumentSource(inputData: Record<string, unknown>): string {
  if (inputData["fileName"]) return "file-upload";
  if (inputData["documents"]) return "documents-path";
  return "runtime-input";
}

function interpolateTemplate(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path: string) => {
    const resolved = resolvePath(data, path);
    return stringifyContent(resolved) ?? `{{${path}}}`;
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

function stringifyContent(value: unknown): string {
  if (typeof value === "string") return value.trim();
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

function asSourceType(value: unknown): KnowledgeSourceType | null {
  if (value === "upload" || value === "inline" || value === "api") {
    return value;
  }
  return null;
}
