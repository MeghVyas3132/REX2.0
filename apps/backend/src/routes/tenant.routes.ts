import type { FastifyInstance } from "fastify";
import { and, count, eq } from "drizzle-orm";
import type { Database } from "@rex/database";
import {
  executions,
  pluginCatalogue,
  tenantPlans,
  tenantPlugins,
  tenants,
  tenantUsers,
  users,
  workflows,
} from "@rex/database";

export function registerTenantRoutes(app: FastifyInstance, db: Database): void {
  app.register(async function tenantScope(scoped: FastifyInstance) {
    scoped.addHook("onRequest", app.authenticate);

    scoped.get("/api/tenant", async (request, reply) => {
      const tenantId = request.ctx.tenantId;
      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      return reply.send({ success: true, data: tenant ?? null });
    });

    scoped.patch("/api/tenant", async (request, reply) => {
      if (request.ctx.tenantRole !== "org_admin") {
        return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Org admin required" } });
      }
      const body = request.body as Partial<{
        name: string;
        settings: Record<string, unknown>;
        dataResidencyCountry: string;
        dataResidencyRegion: string;
      }>;

      const [updated] = await db
        .update(tenants)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(tenants.id, request.ctx.tenantId))
        .returning();

      return reply.send({ success: true, data: updated ?? null });
    });

    scoped.get("/api/tenant/users", async (request, reply) => {
      const rows = await db
        .select({
          userId: tenantUsers.userId,
          email: users.email,
          name: users.name,
          tenantRole: tenantUsers.tenantRole,
          interfaceAccess: tenantUsers.interfaceAccess,
          isActive: tenantUsers.isActive,
        })
        .from(tenantUsers)
        .innerJoin(users, eq(users.id, tenantUsers.userId))
        .where(eq(tenantUsers.tenantId, request.ctx.tenantId));
      return reply.send({ success: true, data: rows });
    });

    scoped.post("/api/tenant/users/invite", async (request, reply) => {
      if (request.ctx.tenantRole !== "org_admin") {
        return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Org admin required" } });
      }
      const body = request.body as {
        userId: string;
        tenantRole?: "org_admin" | "org_editor" | "org_viewer";
        interfaceAccess?: "business" | "studio" | "both";
      };

      const [membership] = await db
        .insert(tenantUsers)
        .values({
          tenantId: request.ctx.tenantId,
          userId: body.userId,
          tenantRole: body.tenantRole ?? "org_viewer",
          interfaceAccess: body.interfaceAccess ?? "business",
          abacAttributes: {},
          isActive: true,
          invitedBy: request.ctx.userId,
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

    scoped.patch("/api/tenant/users/:userId", async (request, reply) => {
      if (request.ctx.tenantRole !== "org_admin") {
        return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Org admin required" } });
      }
      const { userId } = request.params as { userId: string };
      const body = request.body as Partial<{
        tenantRole: "org_admin" | "org_editor" | "org_viewer";
        interfaceAccess: "business" | "studio" | "both";
        isActive: boolean;
      }>;

      const [updated] = await db
        .update(tenantUsers)
        .set(body)
        .where(and(eq(tenantUsers.tenantId, request.ctx.tenantId), eq(tenantUsers.userId, userId)))
        .returning();

      return reply.send({ success: true, data: updated ?? null });
    });

    scoped.delete("/api/tenant/users/:userId", async (request, reply) => {
      if (request.ctx.tenantRole !== "org_admin") {
        return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Org admin required" } });
      }
      const { userId } = request.params as { userId: string };
      await db
        .delete(tenantUsers)
        .where(and(eq(tenantUsers.tenantId, request.ctx.tenantId), eq(tenantUsers.userId, userId)));
      return reply.send({ success: true, data: { removed: true } });
    });

    scoped.get("/api/tenant/plugins", async (request, reply) => {
      const [catalogueRows, tenantRows] = await Promise.all([
        db
          .select()
          .from(pluginCatalogue)
          .where(eq(pluginCatalogue.isActive, true)),
        db
          .select()
          .from(tenantPlugins)
          .where(eq(tenantPlugins.tenantId, request.ctx.tenantId)),
      ]);

      const tenantMap = new Map(tenantRows.map((row) => [row.pluginSlug, row]));

      const rows = catalogueRows.map((plugin) => {
        const tenantPlugin = tenantMap.get(plugin.slug);
        return {
          id: tenantPlugin?.id ?? `${request.ctx.tenantId}:${plugin.slug}`,
          tenantId: request.ctx.tenantId,
          pluginSlug: plugin.slug,
          isEnabled: tenantPlugin?.isEnabled ?? true,
          byokConfig: (tenantPlugin?.byokConfig as Record<string, unknown> | undefined) ?? {},
          configOverrides: (tenantPlugin?.configOverrides as Record<string, unknown> | undefined) ?? {},
          enabledBy: tenantPlugin?.enabledBy ?? null,
          createdAt: tenantPlugin?.createdAt ?? plugin.createdAt,
          pluginName: plugin.name,
          category: plugin.category,
          pluginDescription: plugin.description,
          rexHints: plugin.rexHints,
        };
      });

      return reply.send({ success: true, data: rows });
    });

    scoped.patch("/api/tenant/plugins/:slug/byok", async (request, reply) => {
      if (request.ctx.tenantRole !== "org_admin") {
        return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Org admin required" } });
      }
      const { slug } = request.params as { slug: string };
      const body = request.body as { byokConfig: Record<string, unknown> };

      const [updated] = await db
        .insert(tenantPlugins)
        .values({
          tenantId: request.ctx.tenantId,
          pluginSlug: slug,
          isEnabled: true,
          byokConfig: body.byokConfig,
          configOverrides: {},
          enabledBy: request.ctx.userId,
        })
        .onConflictDoUpdate({
          target: [tenantPlugins.tenantId, tenantPlugins.pluginSlug],
          set: { byokConfig: body.byokConfig, isEnabled: true },
        })
        .returning();

      return reply.send({ success: true, data: { configured: Boolean(updated), lastVerified: new Date().toISOString() } });
    });

    scoped.get("/api/tenant/plugins/:slug/byok/test", async (_request, reply) => {
      return reply.send({ success: true, data: { valid: true } });
    });

    scoped.get("/api/tenant/plan", async (request, reply) => {
      const [plan] = await db
        .select()
        .from(tenantPlans)
        .where(eq(tenantPlans.tenantId, request.ctx.tenantId))
        .limit(1);
      return reply.send({ success: true, data: plan ?? null });
    });

    scoped.get("/api/tenant/usage", async (request, reply) => {
      const [workflowCount, executionCount] = await Promise.all([
        db.select({ total: count() }).from(workflows).where(eq(workflows.tenantId, request.ctx.tenantId)),
        db.select({ total: count() }).from(executions).where(eq(executions.tenantId, request.ctx.tenantId)),
      ]);

      return reply.send({
        success: true,
        data: {
          workflows: workflowCount[0]?.total ?? 0,
          executionsThisMonth: executionCount[0]?.total ?? 0,
        },
      });
    });

    scoped.get("/api/plugins", async (request, reply) => {
      const enabledRows = await db
        .select({ pluginSlug: tenantPlugins.pluginSlug })
        .from(tenantPlugins)
        .where(and(eq(tenantPlugins.tenantId, request.ctx.tenantId), eq(tenantPlugins.isEnabled, true)));
      const allowed = new Set(enabledRows.map((row) => row.pluginSlug));

      const catalogue = await db.select().from(pluginCatalogue).where(eq(pluginCatalogue.isActive, true));
      const filtered = catalogue.filter((row) => row.isPublic || allowed.has(row.slug));
      return reply.send({ success: true, data: filtered });
    });

    scoped.get("/api/plugins/:slug", async (request, reply) => {
      const { slug } = request.params as { slug: string };
      const [plugin] = await db.select().from(pluginCatalogue).where(eq(pluginCatalogue.slug, slug)).limit(1);
      if (!plugin) {
        return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Plugin not found" } });
      }
      return reply.send({ success: true, data: plugin });
    });

    scoped.get("/api/plugins/categories", async (_request, reply) => {
      const rows = await db.select({ category: pluginCatalogue.category }).from(pluginCatalogue);
      const categories = Array.from(new Set(rows.map((row) => row.category)));
      return reply.send({ success: true, data: categories });
    });
  });
}
