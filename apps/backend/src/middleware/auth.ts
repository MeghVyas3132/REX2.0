import type { FastifyReply, FastifyRequest } from "fastify";

export interface RequestContext {
  userId: string;
  email: string;
  globalRole: "super_admin" | "user";
  tenantId: string;
  tenantRole: "org_admin" | "org_editor" | "org_viewer";
  interfaceAccess: "business" | "studio" | "both";
  abacAttributes: Record<string, unknown>;
  tenant?: {
    id: string;
    isActive: boolean;
    planTier: string;
  };
  tenantPlan?: {
    planName: string;
    maxExecutionsPerMonth: number;
    allowedNodeTypes: string[];
    allowedPluginSlugs: string[];
  };
  enabledPluginSlugs?: string[];
}

export async function applyAuthContext(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    await reply.status(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token" },
    });
    return;
  }

  const payload = request.user as {
    sub: string;
    email?: string;
    globalRole?: "super_admin" | "user";
    tenantId?: string;
    currentTenantId?: string;
    tenantRole?: "org_admin" | "org_editor" | "org_viewer";
    interfaceAccess?: "business" | "studio" | "both";
    abacAttributes?: Record<string, unknown>;
  };

  (request as FastifyRequest & { ctx: RequestContext }).ctx = {
    userId: payload.sub,
    email: payload.email ?? "",
    globalRole: payload.globalRole ?? "user",
    tenantId: payload.currentTenantId ?? payload.tenantId ?? "00000000-0000-0000-0000-000000000001",
    tenantRole: payload.tenantRole ?? "org_editor",
    interfaceAccess: payload.interfaceAccess ?? "both",
    abacAttributes: payload.abacAttributes ?? {},
  };
}
