import { apiRequest } from "@/lib/api/client";

export interface TenantUser {
  id: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  tenantRole: "org_admin" | "org_editor" | "org_viewer";
  interfaceAccess: "business" | "studio" | "both";
  createdAt: string;
}

export interface TenantSettings {
  name: string;
  email: string;
  billing?: Record<string, unknown>;
}

export interface TenantUsersResponse {
  data: TenantUser[];
  total: number;
  page: number;
  limit: number;
}

export const getTenantSettings = async (): Promise<TenantSettings> => {
  return apiRequest<TenantSettings>(`/api/tenant/settings`);
};

export const updateTenantSettings = async (data: Partial<TenantSettings>): Promise<TenantSettings> => {
  return apiRequest<TenantSettings>(`/api/tenant/settings`, {
    method: "PATCH",
    body: data,
  });
};

export const listTenantUsers = async (page: number = 1, limit: number = 20) => {
  return apiRequest<TenantUsersResponse>(`/api/tenant/users?page=${page}&limit=${limit}`);
};

export const inviteTenantUser = async (input: { 
  email: string; 
  tenantRole: "org_admin" | "org_editor" | "org_viewer";
  interfaceAccess: "business" | "studio" | "both";
}) => {
  return apiRequest<TenantUser>("/api/tenant/users", {
    method: "POST",
    body: input,
  });
};

export const updateUserRole = async (input: {
  userId: string;
  tenantRole: "org_admin" | "org_editor" | "org_viewer";
  interfaceAccess: "business" | "studio" | "both";
}) => {
  return apiRequest<TenantUser>(`/api/tenant/users/${input.userId}`, {
    method: "PATCH",
    body: {
      tenantRole: input.tenantRole,
      interfaceAccess: input.interfaceAccess,
    },
  });
};
