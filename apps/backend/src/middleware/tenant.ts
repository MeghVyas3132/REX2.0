import { and, eq } from "drizzle-orm";
import type { Database } from "@rex/database";
import { tenantPlans, tenantPlugins, tenants } from "@rex/database";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { RequestContext } from "./auth.js";

export function createTenantMiddleware(db: Database) {
  return async function applyTenantContext(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const ctx = (request as FastifyRequest & { ctx?: RequestContext }).ctx;
    if (!ctx) {
      await reply.status(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Missing auth context" },
      });
      return;
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);

    if (!tenant || !tenant.isActive) {
      await reply.status(403).send({
        success: false,
        error: { code: "TENANT_INACTIVE", message: "Tenant is inactive" },
      });
      return;
    }

    const [plan] = await db
      .select()
      .from(tenantPlans)
      .where(eq(tenantPlans.tenantId, ctx.tenantId))
      .limit(1);

    const plugins = await db
      .select({ pluginSlug: tenantPlugins.pluginSlug })
      .from(tenantPlugins)
      .where(and(eq(tenantPlugins.tenantId, ctx.tenantId), eq(tenantPlugins.isEnabled, true)));

    ctx.tenant = {
      id: tenant.id,
      isActive: tenant.isActive,
      planTier: tenant.planTier,
    };

    if (plan) {
      ctx.tenantPlan = {
        planName: plan.planName,
        maxExecutionsPerMonth: plan.maxExecutionsPerMonth,
        allowedNodeTypes: plan.allowedNodeTypes,
        allowedPluginSlugs: plan.allowedPluginSlugs,
      };
    }

    ctx.enabledPluginSlugs = plugins.map((row) => row.pluginSlug);
  };
}
