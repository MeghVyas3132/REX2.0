import { useQuery } from "@tanstack/react-query";
import { getTenantSettings, listTenantUsers } from "./api";

export const tenantQueryKeys = {
  all: ["tenant"] as const,
  settings: () => ["tenant", "settings"] as const,
  users: (page = 1, limit = 20) => ["tenant", "users", "list", { page, limit }] as const,
};

export const useTenantSettingsQuery = () => {
  return useQuery({
    queryKey: tenantQueryKeys.settings(),
    queryFn: getTenantSettings,
    staleTime: 60000,
  });
};

export const useTenantUsersQuery = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: tenantQueryKeys.users(page, limit),
    queryFn: () => listTenantUsers(page, limit),
    staleTime: 30000,
  });
};
