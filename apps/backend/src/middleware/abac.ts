import { and, desc, eq, or } from "drizzle-orm";
import type { Database } from "@rex/database";
import { abacPolicies } from "@rex/database";
import type { FastifyReply, FastifyRequest } from "fastify";
import jsonLogic from "json-logic-js";
import type { RequestContext } from "./auth.js";

interface AbacOptions {
  resourceType: string;
  action: string;
  getResourceAttributes?: (request: FastifyRequest) => Record<string, unknown>;
}

export function createAbacMiddleware(db: Database, options: AbacOptions) {
  return async function abacGuard(
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

    if (ctx.globalRole === "super_admin") return;

    const policies = await db
      .select()
      .from(abacPolicies)
      .where(
        and(
          eq(abacPolicies.tenantId, ctx.tenantId),
          eq(abacPolicies.isActive, true),
          or(eq(abacPolicies.resourceType, options.resourceType), eq(abacPolicies.resourceType, "*")),
          or(eq(abacPolicies.action, options.action), eq(abacPolicies.action, "*"))
        )
      )
      .orderBy(desc(abacPolicies.priority));

    if (policies.length === 0) {
      await reply.status(403).send({
        success: false,
        error: { code: "ABAC_DENIED", message: "Access denied by policy" },
      });
      return;
    }

    const data = {
      user: {
        ...ctx.abacAttributes,
        role: ctx.tenantRole,
      },
      resource: options.getResourceAttributes?.(request) ?? {},
    };

    let allowed = false;
    for (const policy of policies) {
      const matched = Boolean(jsonLogic.apply(policy.conditions as Record<string, unknown>, data));
      if (!matched) continue;
      if (policy.effect === "deny") {
        await reply.status(403).send({
          success: false,
          error: { code: "ABAC_DENIED", message: "Access denied by policy" },
        });
        return;
      }
      if (policy.effect === "allow") {
        allowed = true;
        break;
      }
    }

    if (!allowed) {
      await reply.status(403).send({
        success: false,
        error: { code: "ABAC_DENIED", message: "Access denied by policy" },
      });
    }
  };
}
