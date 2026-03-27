import { apiRequest } from "@/lib/api/client";

export interface Publication {
  id: string;
  name: string;
  workflowId: string;
  status: "draft" | "published" | "archived";
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListPublicationsResponse {
  publications: Publication[];
  total: number;
  page: number;
  limit: number;
}

export const listPublications = async (page: number = 1, limit: number = 20): Promise<ListPublicationsResponse> => {
  return apiRequest<ListPublicationsResponse>(`/api/publications?page=${page}&limit=${limit}`);
};

export const getPublication = async (id: string): Promise<Publication> => {
  return apiRequest<Publication>(`/api/publications/${id}`);
};

export const createPublication = async (data: { name: string; workflowId: string }): Promise<Publication> => {
  return apiRequest<Publication>(`/api/publications`, {
    method: "POST",
    body: data,
  });
};

export const updatePublication = async (id: string, data: Partial<Publication>): Promise<Publication> => {
  return apiRequest<Publication>(`/api/publications/${id}`, {
    method: "PATCH",
    body: data,
  });
};

export const deletePublication = async (id: string): Promise<void> => {
  await apiRequest(`/api/publications/${id}`, {
    method: "DELETE",
  });
};
