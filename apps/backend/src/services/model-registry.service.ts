// ──────────────────────────────────────────────
// REX - Model Registry Service
// ──────────────────────────────────────────────

import { and, eq } from "drizzle-orm";
import type { Database } from "@rex/database";
import { modelRegistry } from "@rex/database";

export interface ModelRegistryRecord {
  id: string;
  provider: string;
  model: string;
  displayName: string;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  supportsStreaming: boolean;
  supportsTools: boolean;
  qualityTier: string;
  costInputPer1k: string | null;
  costOutputPer1k: string | null;
  capabilities: Record<string, unknown>;
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertModelInput {
  provider: string;
  model: string;
  displayName: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsStreaming?: boolean;
  supportsTools?: boolean;
  qualityTier?: string;
  costInputPer1k?: string | null;
  costOutputPer1k?: string | null;
  capabilities?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

export interface ModelRegistryService {
  list(provider?: string, includeInactive?: boolean): Promise<ModelRegistryRecord[]>;
  upsert(input: UpsertModelInput): Promise<ModelRegistryRecord>;
}

const DEFAULT_MODELS: UpsertModelInput[] = [
  {
    provider: "gemini",
    model: "gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash",
    contextWindow: 1_000_000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsTools: true,
    qualityTier: "standard",
    capabilities: { multimodal: true, reasoning: "good" },
  },
  {
    provider: "gemini",
    model: "gemini-1.5-pro",
    displayName: "Gemini 1.5 Pro",
    contextWindow: 2_000_000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsTools: true,
    qualityTier: "premium",
    capabilities: { multimodal: true, reasoning: "high" },
  },
  {
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    displayName: "Llama 3.3 70B Versatile",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsTools: false,
    qualityTier: "standard",
    capabilities: { multimodal: false, reasoning: "good" },
  },
  {
    provider: "groq",
    model: "llama-3.1-8b-instant",
    displayName: "Llama 3.1 8B Instant",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsTools: false,
    qualityTier: "fast",
    capabilities: { multimodal: false, reasoning: "medium" },
  },
];

export function createModelRegistryService(db: Database): ModelRegistryService {
  let seeded = false;

  const ensureSeeded = async (): Promise<void> => {
    if (seeded) return;
    const [existing] = await db
      .select({ id: modelRegistry.id })
      .from(modelRegistry)
      .limit(1);

    if (!existing) {
      for (const model of DEFAULT_MODELS) {
        await upsertInternal(db, model);
      }
    }
    seeded = true;
  };

  return {
    async list(provider, includeInactive = false) {
      await ensureSeeded();
      const conditions = [];
      if (!includeInactive) {
        conditions.push(eq(modelRegistry.isActive, true));
      }
      if (provider && provider.trim().length > 0) {
        conditions.push(eq(modelRegistry.provider, provider.trim()));
      }

      const rows = conditions.length
        ? await db.select().from(modelRegistry).where(and(...conditions))
        : await db.select().from(modelRegistry);

      return rows
        .map(normalizeRecord)
        .sort((a, b) => {
          if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
          return a.model.localeCompare(b.model);
        });
    },

    async upsert(input) {
      await ensureSeeded();
      return upsertInternal(db, input);
    },
  };
}

async function upsertInternal(
  db: Database,
  input: UpsertModelInput
): Promise<ModelRegistryRecord> {
  const provider = input.provider.trim();
  const model = input.model.trim();
  const [existing] = await db
    .select({ id: modelRegistry.id })
    .from(modelRegistry)
    .where(and(eq(modelRegistry.provider, provider), eq(modelRegistry.model, model)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(modelRegistry)
      .set({
        displayName: input.displayName,
        contextWindow: input.contextWindow ?? null,
        maxOutputTokens: input.maxOutputTokens ?? null,
        supportsStreaming: input.supportsStreaming ?? false,
        supportsTools: input.supportsTools ?? false,
        qualityTier: input.qualityTier ?? "standard",
        costInputPer1k: input.costInputPer1k ?? null,
        costOutputPer1k: input.costOutputPer1k ?? null,
        capabilities: input.capabilities ?? {},
        metadata: input.metadata ?? {},
        isActive: input.isActive ?? true,
        updatedAt: new Date(),
      })
      .where(eq(modelRegistry.id, existing.id))
      .returning();
    if (!updated) throw new Error("Failed to update model");
    return normalizeRecord(updated);
  }

  const [created] = await db
    .insert(modelRegistry)
    .values({
      provider,
      model,
      displayName: input.displayName,
      contextWindow: input.contextWindow ?? null,
      maxOutputTokens: input.maxOutputTokens ?? null,
      supportsStreaming: input.supportsStreaming ?? false,
      supportsTools: input.supportsTools ?? false,
      qualityTier: input.qualityTier ?? "standard",
      costInputPer1k: input.costInputPer1k ?? null,
      costOutputPer1k: input.costOutputPer1k ?? null,
      capabilities: input.capabilities ?? {},
      metadata: input.metadata ?? {},
      isActive: input.isActive ?? true,
    })
    .returning();
  if (!created) throw new Error("Failed to create model");
  return normalizeRecord(created);
}

function normalizeRecord(row: typeof modelRegistry.$inferSelect): ModelRegistryRecord {
  return {
    id: row.id,
    provider: row.provider,
    model: row.model,
    displayName: row.displayName,
    contextWindow: row.contextWindow,
    maxOutputTokens: row.maxOutputTokens,
    supportsStreaming: row.supportsStreaming,
    supportsTools: row.supportsTools,
    qualityTier: row.qualityTier,
    costInputPer1k: row.costInputPer1k,
    costOutputPer1k: row.costOutputPer1k,
    capabilities: toRecord(row.capabilities),
    metadata: toRecord(row.metadata),
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}
