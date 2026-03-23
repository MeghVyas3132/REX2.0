export const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

export function resolveTenantId(tenantId?: string | null): string {
  return tenantId && tenantId.length > 0 ? tenantId : DEFAULT_TENANT_ID;
}
