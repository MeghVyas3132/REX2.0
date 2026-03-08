// ──────────────────────────────────────────────
// REX - Domain Config Resolver Service
// ──────────────────────────────────────────────

import { and, eq, isNull, or } from "drizzle-orm";
import type { Database } from "@rex/database";
import { domainConfigs } from "@rex/database";

export interface RuntimeDomainConfig {
  llm?: {
    defaultProvider?: "gemini" | "groq";
    defaultModel?: string;
    temperature?: number;
    maxTokens?: number;
  };
  retrieval?: {
    topK?: number;
    strategy?: "single" | "merge" | "first-non-empty" | "best-score" | "adaptive";
    rerankEnabled?: boolean;
  };
  guardrails?: {
    blockPromptInjection?: boolean;
    blockToxicity?: boolean;
  };
  kpi?: {
    latencyThresholdMs?: number;
  };
  [key: string]: unknown;
}

export interface DomainConfigRecord {
  id: string;
  userId: string | null;
  workflowId: string | null;
  domain: string;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertDomainConfigInput {
  workflowId?: string;
  domain?: string;
  config: RuntimeDomainConfig;
  isActive?: boolean;
}

export interface DomainConfigService {
  list(userId: string): Promise<DomainConfigRecord[]>;
  upsert(userId: string, input: UpsertDomainConfigInput): Promise<DomainConfigRecord>;
  resolve(userId: string, workflowId?: string, domain?: string): Promise<RuntimeDomainConfig>;
}

export function createDomainConfigService(db: Database): DomainConfigService {
  return {
    async list(userId) {
      const rows = await db
        .select()
        .from(domainConfigs)
        .where(
          or(
            and(eq(domainConfigs.userId, userId), eq(domainConfigs.isActive, true)),
            and(isNull(domainConfigs.userId), eq(domainConfigs.isActive, true))
          )
        );
      return rows.map(normalizeConfigRecord);
    },

    async upsert(userId, input) {
      const domain = normalizeDomain(input.domain);
      const isActive = input.isActive ?? true;
      const matchWhere = and(
        input.workflowId
          ? eq(domainConfigs.workflowId, input.workflowId)
          : isNull(domainConfigs.workflowId),
        eq(domainConfigs.userId, userId),
        eq(domainConfigs.domain, domain)
      );

      const [existing] = await db
        .select({ id: domainConfigs.id })
        .from(domainConfigs)
        .where(matchWhere)
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(domainConfigs)
          .set({
            config: input.config,
            isActive,
            updatedAt: new Date(),
          })
          .where(eq(domainConfigs.id, existing.id))
          .returning();
        if (!updated) throw new Error("Failed to update domain config");
        return normalizeConfigRecord(updated);
      }

      const [created] = await db
        .insert(domainConfigs)
        .values({
          userId,
          workflowId: input.workflowId ?? null,
          domain,
          config: input.config,
          isActive,
        })
        .returning();

      if (!created) throw new Error("Failed to create domain config");
      return normalizeConfigRecord(created);
    },

    async resolve(userId, workflowId, domainInput) {
      const domain = normalizeDomain(domainInput);
      const conditions = [
        and(
          isNull(domainConfigs.userId),
          isNull(domainConfigs.workflowId),
          eq(domainConfigs.domain, domain),
          eq(domainConfigs.isActive, true)
        ),
        and(
          eq(domainConfigs.userId, userId),
          isNull(domainConfigs.workflowId),
          eq(domainConfigs.domain, domain),
          eq(domainConfigs.isActive, true)
        ),
      ];

      if (workflowId) {
        conditions.push(
          and(
            isNull(domainConfigs.userId),
            eq(domainConfigs.workflowId, workflowId),
            eq(domainConfigs.domain, domain),
            eq(domainConfigs.isActive, true)
          )
        );
        conditions.push(
          and(
            eq(domainConfigs.userId, userId),
            eq(domainConfigs.workflowId, workflowId),
            eq(domainConfigs.domain, domain),
            eq(domainConfigs.isActive, true)
          )
        );
      }

      const rows = await db
        .select()
        .from(domainConfigs)
        .where(or(...conditions));

      const sorted = rows.sort((a, b) => specificityScore(a) - specificityScore(b));
      const merged = sorted.reduce<Record<string, unknown>>(
        (acc, row) => deepMerge(acc, toObject(row.config)),
        {}
      );
      return merged as RuntimeDomainConfig;
    },
  };
}

function normalizeConfigRecord(row: typeof domainConfigs.$inferSelect): DomainConfigRecord {
  return {
    id: row.id,
    userId: row.userId,
    workflowId: row.workflowId,
    domain: row.domain,
    config: toObject(row.config),
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeDomain(domain?: string): string {
  if (!domain || domain.trim().length === 0) return "default";
  return domain.trim().slice(0, 80);
}

function specificityScore(
  row: Pick<typeof domainConfigs.$inferSelect, "userId" | "workflowId">
): number {
  let score = 0;
  if (row.userId) score += 1;
  if (row.workflowId) score += 2;
  return score;
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function deepMerge(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, overlayValue] of Object.entries(overlay)) {
    const baseValue = out[key];
    if (
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue) &&
      overlayValue &&
      typeof overlayValue === "object" &&
      !Array.isArray(overlayValue)
    ) {
      out[key] = deepMerge(
        baseValue as Record<string, unknown>,
        overlayValue as Record<string, unknown>
      );
      continue;
    }
    out[key] = overlayValue;
  }
  return out;
}
