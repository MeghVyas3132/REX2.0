import type { AuthUserClient } from "@/lib/api";

export type RolePersona = "super_admin" | "company_admin" | "manager" | "employee";

export function getRolePersona(user: AuthUserClient | null | undefined): RolePersona | null {
  if (!user) return null;
  if (user.globalRole === "super_admin") return "super_admin";
  if (user.tenantRole === "org_admin") return "company_admin";
  if (user.tenantRole === "org_editor") return "manager";
  return "employee";
}

export function getRoleLandingPath(user: AuthUserClient | null | undefined): string {
  const persona = getRolePersona(user);
  if (persona === "super_admin") return "/admin";
  if (persona === "company_admin") return "/business/company-admin";
  if (persona === "manager") return "/studio";
  if (persona === "employee") return "/business";
  return "/login";
}

export function canAccessAdmin(user: AuthUserClient | null | undefined): boolean {
  return Boolean(user && user.globalRole === "super_admin");
}

export function canAccessStudio(user: AuthUserClient | null | undefined): boolean {
  if (!user) return false;
  if (user.globalRole === "super_admin") return false;
  return user.tenantRole === "org_editor";
}

export function canAccessBusiness(user: AuthUserClient | null | undefined): boolean {
  if (!user) return false;
  return user.globalRole !== "super_admin";
}

export function canManageCompany(user: AuthUserClient | null | undefined): boolean {
  if (!user) return false;
  return user.globalRole !== "super_admin" && user.tenantRole === "org_admin";
}

export function canEditWorkflows(user: AuthUserClient | null | undefined): boolean {
  if (!user) return false;
  return user.tenantRole === "org_editor" || user.tenantRole === "org_admin";
}
