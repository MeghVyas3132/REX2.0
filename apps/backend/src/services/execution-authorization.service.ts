// ──────────────────────────────────────────────
// REX - Execution Authorization Gateway Service
// ──────────────────────────────────────────────

import { and, eq, gt } from "drizzle-orm";
import type { Database } from "@rex/database";
import { executionAuthorizations, executions } from "@rex/database";

export interface ExecutionAuthorizationService {
  issue(params: {
    executionId: string;
    workflowId: string;
    userId: string;
    action?: string;
    ttlMinutes?: number;
    attributes?: Record<string, unknown>;
  }): Promise<{ authorizationId: string; expiresAt: Date }>;
  validate(params: {
    authorizationId: string;
    executionId: string;
    workflowId: string;
    userId: string;
  }): Promise<boolean>;
}

export function createExecutionAuthorizationService(
  db: Database
): ExecutionAuthorizationService {
  return {
    async issue(params) {
      const now = Date.now();
      const ttlMinutes = Math.max(1, Math.min(params.ttlMinutes ?? 30, 240));
      const expiresAt = new Date(now + ttlMinutes * 60 * 1000);

      const [auth] = await db
        .insert(executionAuthorizations)
        .values({
          executionId: params.executionId,
          workflowId: params.workflowId,
          userId: params.userId,
          action: params.action ?? "execute",
          attributes: params.attributes ?? {},
          expiresAt,
          revoked: false,
        })
        .returning({
          id: executionAuthorizations.id,
          expiresAt: executionAuthorizations.expiresAt,
        });

      if (!auth) {
        throw new Error("Failed to issue execution authorization");
      }

      return { authorizationId: auth.id, expiresAt: auth.expiresAt };
    },

    async validate(params) {
      const [auth] = await db
        .select({
          id: executionAuthorizations.id,
          validatedAt: executionAuthorizations.validatedAt,
        })
        .from(executionAuthorizations)
        .where(
          and(
            eq(executionAuthorizations.id, params.authorizationId),
            eq(executionAuthorizations.executionId, params.executionId),
            eq(executionAuthorizations.workflowId, params.workflowId),
            eq(executionAuthorizations.userId, params.userId),
            eq(executionAuthorizations.revoked, false),
            gt(executionAuthorizations.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!auth) {
        return false;
      }

      if (!auth.validatedAt) {
        await db
          .update(executionAuthorizations)
          .set({ validatedAt: new Date() })
          .where(eq(executionAuthorizations.id, auth.id));
      }

      await db
        .update(executions)
        .set({ startedAt: new Date() })
        .where(eq(executions.id, params.executionId));
      return true;
    },
  };
}
