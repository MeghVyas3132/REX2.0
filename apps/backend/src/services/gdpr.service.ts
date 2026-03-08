// ──────────────────────────────────────────────
// REX - GDPR Service
// Data export and right-to-erasure
// ──────────────────────────────────────────────

import { and, eq } from "drizzle-orm";
import type { Database } from "@rex/database";
import {
  users,
  apiKeys,
  workflows,
  executions,
  knowledgeCorpora,
  knowledgeDocuments,
  domainConfigs,
} from "@rex/database";

export interface GDPRService {
  exportUserData(userId: string): Promise<Record<string, unknown>>;
  deleteUser(userId: string, confirmEmail: string): Promise<void>;
}

export function createGDPRService(db: Database): GDPRService {
  return {
    async exportUserData(userId) {
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          consentGivenAt: users.consentGivenAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error("User not found");
      }

      const [keys, userWorkflows, userExecutions, corpora, documents, configs] = await Promise.all([
        db
          .select({
            provider: apiKeys.provider,
            label: apiKeys.label,
            createdAt: apiKeys.createdAt,
          })
          .from(apiKeys)
          .where(eq(apiKeys.userId, userId)),
        db
          .select({
            id: workflows.id,
            name: workflows.name,
            description: workflows.description,
            status: workflows.status,
            createdAt: workflows.createdAt,
            updatedAt: workflows.updatedAt,
          })
          .from(workflows)
          .where(eq(workflows.userId, userId)),
        db
          .select({
            id: executions.id,
            workflowId: executions.workflowId,
            status: executions.status,
            startedAt: executions.startedAt,
            finishedAt: executions.finishedAt,
            createdAt: executions.createdAt,
          })
          .from(executions)
          .innerJoin(workflows, eq(workflows.id, executions.workflowId))
          .where(eq(workflows.userId, userId)),
        db
          .select()
          .from(knowledgeCorpora)
          .where(eq(knowledgeCorpora.userId, userId)),
        db
          .select()
          .from(knowledgeDocuments)
          .where(eq(knowledgeDocuments.userId, userId)),
        db
          .select()
          .from(domainConfigs)
          .where(eq(domainConfigs.userId, userId)),
      ]);

      return {
        exportedAt: new Date().toISOString(),
        user,
        apiKeys: keys,
        workflows: userWorkflows,
        executions: userExecutions,
        knowledge: {
          corpora,
          documents,
        },
        domainConfigs: configs,
      };
    },

    async deleteUser(userId, confirmEmail) {
      const [user] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error("User not found");
      }
      if (user.email.toLowerCase() !== confirmEmail.toLowerCase()) {
        throw new Error("Email confirmation does not match account email");
      }

      const deleted = await db
        .delete(users)
        .where(and(eq(users.id, userId), eq(users.email, user.email)))
        .returning({ id: users.id });

      if (deleted.length === 0) {
        throw new Error("Failed to delete user");
      }
    },
  };
}
