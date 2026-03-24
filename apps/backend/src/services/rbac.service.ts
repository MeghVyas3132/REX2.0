import type { RequestContext } from "../middleware/auth.js";

export type AppRolePersona = "super_admin" | "company_admin" | "manager" | "employee";

export function getPersona(ctx: Pick<RequestContext, "globalRole" | "tenantRole">): AppRolePersona {
  if (ctx.globalRole === "super_admin") return "super_admin";
  if (ctx.tenantRole === "org_admin") return "company_admin";
  if (ctx.tenantRole === "org_editor") return "manager";
  return "employee";
}

export function canManageTenantUsers(ctx: Pick<RequestContext, "globalRole" | "tenantRole">): boolean {
  return ctx.globalRole === "super_admin" || ctx.tenantRole === "org_admin";
}

export function canEditWorkflows(ctx: Pick<RequestContext, "globalRole" | "tenantRole">): boolean {
  return ctx.globalRole === "super_admin" || ctx.tenantRole === "org_admin" || ctx.tenantRole === "org_editor";
}

export function canViewWorkflowStatus(ctx: Pick<RequestContext, "globalRole" | "tenantRole">, workflowStatus: string): boolean {
  if (canEditWorkflows(ctx)) return true;
  return workflowStatus === "active";
}