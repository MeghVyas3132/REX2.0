// ──────────────────────────────────────────────
// REX - Hyperparameter Service
// Profiles and A/B experiments
// ──────────────────────────────────────────────

import { and, eq, desc } from "drizzle-orm";
import type { Database } from "@rex/database";
import {
  hyperparameterExperiments,
  hyperparameterProfiles,
  workflows,
} from "@rex/database";

export interface HyperparameterService {
  listProfiles(userId: string, workflowId?: string): Promise<Array<{
    id: string;
    workflowId: string | null;
    name: string;
    description: string;
    config: Record<string, unknown>;
    isDefault: boolean;
    isActive: boolean;
  }>>;
  upsertProfile(userId: string, input: {
    id?: string;
    workflowId?: string;
    name: string;
    description?: string;
    config: Record<string, unknown>;
    isDefault?: boolean;
    isActive?: boolean;
  }): Promise<{ id: string }>;
  compareProfiles(userId: string, workflowId: string, profileAId: string, profileBId: string): Promise<{
    experimentId: string;
    recommendation: "profile-a" | "profile-b" | "tie";
    summary: Record<string, unknown>;
  }>;
  getProfileById(userId: string, profileId: string): Promise<{ id: string; config: Record<string, unknown> } | null>;
}

export function createHyperparameterService(db: Database): HyperparameterService {
  return {
    async listProfiles(userId, workflowId) {
      const rows = workflowId
        ? await db
            .select()
            .from(hyperparameterProfiles)
            .where(
              and(
                eq(hyperparameterProfiles.userId, userId),
                eq(hyperparameterProfiles.workflowId, workflowId)
              )
            )
            .orderBy(desc(hyperparameterProfiles.updatedAt))
        : await db
            .select()
            .from(hyperparameterProfiles)
            .where(eq(hyperparameterProfiles.userId, userId))
            .orderBy(desc(hyperparameterProfiles.updatedAt));
      return rows.map((row) => ({
        id: row.id,
        workflowId: row.workflowId,
        name: row.name,
        description: row.description,
        config: toRecord(row.config),
        isDefault: row.isDefault,
        isActive: row.isActive,
      }));
    },

    async upsertProfile(userId, input) {
      if (input.workflowId) {
        const [workflow] = await db
          .select({ id: workflows.id })
          .from(workflows)
          .where(and(eq(workflows.id, input.workflowId), eq(workflows.userId, userId)))
          .limit(1);
        if (!workflow) throw new Error("Workflow not found or access denied");
      }

      if (input.id) {
        const [updated] = await db
          .update(hyperparameterProfiles)
          .set({
            name: input.name,
            description: input.description ?? "",
            config: input.config,
            isDefault: input.isDefault ?? false,
            isActive: input.isActive ?? true,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(hyperparameterProfiles.id, input.id),
              eq(hyperparameterProfiles.userId, userId)
            )
          )
          .returning({ id: hyperparameterProfiles.id });
        if (!updated) throw new Error("Profile not found or access denied");
        return updated;
      }

      const [created] = await db
        .insert(hyperparameterProfiles)
        .values({
          userId,
          workflowId: input.workflowId ?? null,
          name: input.name,
          description: input.description ?? "",
          config: input.config,
          isDefault: input.isDefault ?? false,
          isActive: input.isActive ?? true,
        })
        .returning({ id: hyperparameterProfiles.id });
      if (!created) throw new Error("Failed to create profile");
      return created;
    },

    async compareProfiles(userId, workflowId, profileAId, profileBId) {
      const [profileA, profileB] = await Promise.all([
        this.getProfileById(userId, profileAId),
        this.getProfileById(userId, profileBId),
      ]);
      if (!profileA || !profileB) {
        throw new Error("Profile not found or access denied");
      }

      const scoreA = scoreProfile(profileA.config);
      const scoreB = scoreProfile(profileB.config);
      const recommendation =
        scoreA === scoreB ? "tie" : scoreA > scoreB ? "profile-a" : "profile-b";

      const summary = {
        profileA: { id: profileAId, score: scoreA },
        profileB: { id: profileBId, score: scoreB },
        rationale:
          recommendation === "tie"
            ? "Both profiles have equivalent heuristic score."
            : recommendation === "profile-a"
              ? "Profile A has better expected stability/quality balance."
              : "Profile B has better expected stability/quality balance.",
      };

      const [experiment] = await db
        .insert(hyperparameterExperiments)
        .values({
          userId,
          workflowId,
          profileAId,
          profileBId,
          status: "completed",
          summary,
        })
        .returning({ id: hyperparameterExperiments.id });
      if (!experiment) throw new Error("Failed to create experiment");

      return {
        experimentId: experiment.id,
        recommendation,
        summary,
      };
    },

    async getProfileById(userId, profileId) {
      const [profile] = await db
        .select({
          id: hyperparameterProfiles.id,
          config: hyperparameterProfiles.config,
        })
        .from(hyperparameterProfiles)
        .where(
          and(
            eq(hyperparameterProfiles.id, profileId),
            eq(hyperparameterProfiles.userId, userId)
          )
        )
        .limit(1);
      if (!profile) return null;
      return {
        id: profile.id,
        config: toRecord(profile.config),
      };
    },
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function scoreProfile(config: Record<string, unknown>): number {
  const llm = toRecord(config["llm"]);
  const retrieval = toRecord(config["retrieval"]);

  const temperature = toNumber(llm["temperature"], 0.7);
  const maxTokens = toNumber(llm["maxTokens"], 2048);
  const topK = toNumber(retrieval["topK"], 8);

  // Heuristic score: prefer moderate temperature, reasonable token budget, and richer retrieval.
  const tempScore = 1 - Math.abs(temperature - 0.4);
  const tokenScore = Math.min(maxTokens / 4096, 1);
  const retrievalScore = Math.min(topK / 12, 1);
  return round3(tempScore * 0.45 + tokenScore * 0.25 + retrievalScore * 0.3);
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
