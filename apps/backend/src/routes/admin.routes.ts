import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { and, desc, eq, count } from "drizzle-orm";
import type { Database } from "@rex/database";
import {
  adminAuditLog,
  executions,
  pluginCatalogue,
  tenantPlans,
  tenantPlugins,
  tenants,
  tenantUsers,
  workflows,
} from "@rex/database";

function assertSuperAdmin(request: FastifyRequest, reply: FastifyReply): boolean {
  const user = request.user as { globalRole?: string };
  if (user.globalRole !== "super_admin") {
    void reply.status(403).send({
      success: false,
      error: { code: "FORBIDDEN", message: "Super admin access required" },
    });
    return false;
  }
  return true;
}

export function registerAdminRoutes(app: FastifyInstance, db: Database): void {
  app.register(async function adminScope(scoped: FastifyInstance) {
    scoped.addHook("onRequest", app.authenticate);
    scoped.addHook("preHandler", async (request, reply) => {
      if (!assertSuperAdmin(request, reply)) return;
    });

    scoped.post("/admin/tenants", async (request, reply) => {
      const body = request.body as {
        name: string;
        slug: string;
        planTier?: "starter" | "pro" | "enterprise" | "custom";
      };

      const [tenant] = await db
        .insert(tenants)
        .values({
          name: body.name,
          slug: body.slug,
          planTier: body.planTier ?? "starter",
          isActive: true,
          settings: {},
          createdBy: (request.user as { sub: string }).sub,
        })
        .returning();

      return reply.status(201).send({ success: true, data: tenant });
    });

    scoped.get("/admin/tenants", async (_request, reply) => {
      const rows = await db.select().from(tenants).orderBy(desc(tenants.createdAt));
      return reply.send({ success: true, data: rows });
    });

    scoped.get("/admin/tenants/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
      if (!tenant) {
        return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Tenant not found" } });
      }
      return reply.send({ success: true, data: tenant });
    });

    scoped.patch("/admin/tenants/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as Partial<{
        name: string;
        isActive: boolean;
        settings: Record<string, unknown>;
        planTier: "starter" | "pro" | "enterprise" | "custom";
      }>;

      const [updated] = await db
        .update(tenants)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(tenants.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Tenant not found" } });
      }

      return reply.send({ success: true, data: updated });
    });

    scoped.delete("/admin/tenants/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      const [updated] = await db
        .update(tenants)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(tenants.id, id))
        .returning({ id: tenants.id });

      if (!updated) {
        return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Tenant not found" } });
      }

      return reply.send({ success: true, data: { deleted: true } });
    });

    scoped.post("/admin/tenants/:id/users", async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        userId: string;
        tenantRole?: "org_admin" | "org_editor" | "org_viewer";
        interfaceAccess?: "business" | "studio" | "both";
      };

      const [membership] = await db
        .insert(tenantUsers)
        .values({
          tenantId: id,
          userId: body.userId,
          tenantRole: body.tenantRole ?? "org_viewer",
          interfaceAccess: body.interfaceAccess ?? "business",
          abacAttributes: {},
          isActive: true,
          invitedBy: (request.user as { sub: string }).sub,
        })
        .onConflictDoUpdate({
          target: [tenantUsers.tenantId, tenantUsers.userId],
          set: {
            tenantRole: body.tenantRole ?? "org_viewer",
            interfaceAccess: body.interfaceAccess ?? "business",
            isActive: true,
          },
        })
        .returning();

      return reply.status(201).send({ success: true, data: membership });
    });

    scoped.patch("/admin/tenants/:id/users/:userId", async (request, reply) => {
      const { id, userId } = request.params as { id: string; userId: string };
      const body = request.body as Partial<{
        tenantRole: "org_admin" | "org_editor" | "org_viewer";
        interfaceAccess: "business" | "studio" | "both";
        isActive: boolean;
      }>;

      const [updated] = await db
        .update(tenantUsers)
        .set({ ...body })
        .where(and(eq(tenantUsers.tenantId, id), eq(tenantUsers.userId, userId)))
        .returning();

      if (!updated) {
        return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Membership not found" } });
      }

      return reply.send({ success: true, data: updated });
    });

    scoped.delete("/admin/tenants/:id/users/:userId", async (request, reply) => {
      const { id, userId } = request.params as { id: string; userId: string };
      await db
        .delete(tenantUsers)
        .where(and(eq(tenantUsers.tenantId, id), eq(tenantUsers.userId, userId)));
      return reply.send({ success: true, data: { removed: true } });
    });

    scoped.post("/admin/tenants/:id/plan", async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        planName: string;
        allowedNodeTypes?: string[];
        allowedPluginSlugs?: string[];
        maxWorkflows?: number;
        maxExecutionsPerMonth?: number;
        maxKnowledgeCorpora?: number;
        maxUsers?: number;
        maxApiKeys?: number;
      };

      const [plan] = await db
        .insert(tenantPlans)
        .values({
          tenantId: id,
          planName: body.planName,
          allowedNodeTypes: body.allowedNodeTypes ?? [],
          allowedPluginSlugs: body.allowedPluginSlugs ?? [],
          maxWorkflows: body.maxWorkflows ?? 10,
          maxExecutionsPerMonth: body.maxExecutionsPerMonth ?? 1000,
          maxKnowledgeCorpora: body.maxKnowledgeCorpora ?? 5,
          maxUsers: body.maxUsers ?? 10,
          maxApiKeys: body.maxApiKeys ?? 5,
        })
        .onConflictDoUpdate({
          target: tenantPlans.tenantId,
          set: {
            planName: body.planName,
            allowedNodeTypes: body.allowedNodeTypes ?? [],
            allowedPluginSlugs: body.allowedPluginSlugs ?? [],
            maxWorkflows: body.maxWorkflows ?? 10,
            maxExecutionsPerMonth: body.maxExecutionsPerMonth ?? 1000,
            maxKnowledgeCorpora: body.maxKnowledgeCorpora ?? 5,
            maxUsers: body.maxUsers ?? 10,
            maxApiKeys: body.maxApiKeys ?? 5,
          },
        })
        .returning();

      return reply.send({ success: true, data: plan });
    });

    scoped.get("/admin/tenants/:id/plan", async (request, reply) => {
      const { id } = request.params as { id: string };
      const [plan] = await db.select().from(tenantPlans).where(eq(tenantPlans.tenantId, id)).limit(1);
      return reply.send({ success: true, data: plan ?? null });
    });

    scoped.post("/admin/tenants/:id/plugins", async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { slug: string; configOverrides?: Record<string, unknown> };

      const [row] = await db
        .insert(tenantPlugins)
        .values({
          tenantId: id,
          pluginSlug: body.slug,
          isEnabled: true,
          byokConfig: {},
          configOverrides: body.configOverrides ?? {},
          enabledBy: (request.user as { sub: string }).sub,
        })
        .onConflictDoUpdate({
          target: [tenantPlugins.tenantId, tenantPlugins.pluginSlug],
          set: { isEnabled: true, configOverrides: body.configOverrides ?? {} },
        })
        .returning();

      return reply.send({ success: true, data: row });
    });

    scoped.delete("/admin/tenants/:id/plugins/:slug", async (request, reply) => {
      const { id, slug } = request.params as { id: string; slug: string };
      const [updated] = await db
        .update(tenantPlugins)
        .set({ isEnabled: false })
        .where(and(eq(tenantPlugins.tenantId, id), eq(tenantPlugins.pluginSlug, slug)))
        .returning();

      return reply.send({ success: true, data: updated ?? null });
    });

    scoped.get("/admin/tenants/:id/metrics", async (request, reply) => {
      const { id } = request.params as { id: string };
      const [usersCount, workflowsCount, executionsCount] = await Promise.all([
        db.select({ total: count() }).from(tenantUsers).where(eq(tenantUsers.tenantId, id)),
        db.select({ total: count() }).from(workflows).where(eq(workflows.tenantId, id)),
        db.select({ total: count() }).from(executions).where(eq(executions.tenantId, id)),
      ]);

      return reply.send({
        success: true,
        data: {
          users: usersCount[0]?.total ?? 0,
          workflows: workflowsCount[0]?.total ?? 0,
          executions: executionsCount[0]?.total ?? 0,
        },
      });
    });

    scoped.post("/admin/plugins", async (request, reply) => {
      const body = request.body as {
        slug: string;
        name: string;
        description?: string;
        category: "ai_llm" | "data_storage" | "communication" | "business_crm" | "logic_control" | "trigger" | "compliance_rex" | "developer";
        version?: string;
        manifest: Record<string, unknown>;
      };

      const [plugin] = await db
        .insert(pluginCatalogue)
        .values({
          slug: body.slug,
          name: body.name,
          description: body.description ?? null,
          category: body.category,
          version: body.version ?? "1.0.0",
          manifest: body.manifest,
          isPublic: true,
          isBuiltin: false,
          isActive: true,
          rexHints: {},
        })
        .returning();

      return reply.status(201).send({ success: true, data: plugin });
    });

    scoped.get("/admin/plugins", async (_request, reply) => {
      const rows = await db.select().from(pluginCatalogue).orderBy(desc(pluginCatalogue.updatedAt));
      return reply.send({ success: true, data: rows });
    });

    scoped.patch("/admin/plugins/:slug", async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const body = request.body as Partial<{
        name: string;
        description: string;
        category: "ai_llm" | "data_storage" | "communication" | "business_crm" | "logic_control" | "trigger" | "compliance_rex" | "developer";
        version: string;
        manifest: Record<string, unknown>;
        isActive: boolean;
        isPublic: boolean;
      }>;

      const [updated] = await db
        .update(pluginCatalogue)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(pluginCatalogue.slug, slug))
        .returning();

      if (!updated) {
        return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Plugin not found" } });
      }

      return reply.send({ success: true, data: updated });
    });

    scoped.delete("/admin/plugins/:slug", async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const [updated] = await db
        .update(pluginCatalogue)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(pluginCatalogue.slug, slug))
        .returning();
      return reply.send({ success: true, data: updated ?? null });
    });

    scoped.get("/admin/audit-log", async (_request, reply) => {
      const rows = await db.select().from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt)).limit(500);
      return reply.send({ success: true, data: rows });
    });
  });
}
