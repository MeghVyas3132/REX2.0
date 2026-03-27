import { apiRequest } from "@/lib/api/client";

export interface AdminTenant {
  id: string;
  name: string;
  status: "active" | "suspended" | "archived";
  createdAt: string;
  usersCount: number;
}

export interface AdminPlugin {
  id: string;
  name: string;
  version: string;
  status: "enabled" | "disabled";
}

export interface AdminAuditEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
}

export const listAdminTenants = async (page: number = 1, limit: number = 20) => {
  return apiRequest<AdminTenant[]>(`/api/admin/tenants?page=${page}&limit=${limit}`);
};

export const listPlugins = async (page: number = 1, limit: number = 20) => {
  return apiRequest<AdminPlugin[]>(`/api/admin/plugins?page=${page}&limit=${limit}`);
};

export const listAuditLog = async (page: number = 1, limit: number = 20) => {
  return apiRequest<AdminAuditEvent[]>(`/api/admin/audit-log?page=${page}&limit=${limit}`);
};

export const updateAdminTenant = async (tenantId: string, input: { name?: string; status?: AdminTenant["status"] }) => {
  return apiRequest<AdminTenant>(`/api/admin/tenants/${tenantId}`, {
    method: "PATCH",
    body: input,
  });
};
