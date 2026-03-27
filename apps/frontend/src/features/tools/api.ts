import { apiRequest } from "@/lib/api/client";

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface ApiKeysResponse {
  data: ApiKey[];
  total?: number;
}

export const listApiKeys = async () => {
  return apiRequest<ApiKeysResponse>(`/api/tools/api-keys`);
};

export const createApiKey = async (name: string) => {
  return apiRequest<ApiKey>(`/api/tools/api-keys`, {
    method: "POST",
    body: { name },
  });
};

export const deleteApiKey = async (id: string) => {
  await apiRequest(`/api/tools/api-keys/${id}`, {
    method: "DELETE",
  });
};
