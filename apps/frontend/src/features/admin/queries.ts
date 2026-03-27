import { useQuery } from "@tanstack/react-query";
import { listAdminTenants, listPlugins, listAuditLog } from "./api";

export const adminQueryKeys = {
  all: ["admin"] as const,
  tenants: (page = 1, limit = 20) => ["admin", "tenants", "list", { page, limit }] as const,
  plugins: (page = 1, limit = 20) => ["admin", "plugins", "list", { page, limit }] as const,
  auditLog: (page = 1, limit = 20) => ["admin", "audit-log", "list", { page, limit }] as const,
};

export const useAdminTenantsQuery = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: adminQueryKeys.tenants(page, limit),
    queryFn: () => listAdminTenants(page, limit),
    staleTime: 30000,
  });
};

export const usePluginsQuery = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: adminQueryKeys.plugins(page, limit),
    queryFn: () => listPlugins(page, limit),
    staleTime: 30000,
  });
};

export const useAuditLogQuery = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: adminQueryKeys.auditLog(page, limit),
    queryFn: () => listAuditLog(page, limit),
    staleTime: 30000,
  });
};
