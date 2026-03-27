import { apiRequest } from "@/lib/api/client";

export interface Template {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListTemplatesResponse {
  templates: Template[];
  total: number;
  page: number;
  limit: number;
}

export const listTemplates = async (page: number = 1, limit: number = 20): Promise<ListTemplatesResponse> => {
  return apiRequest<ListTemplatesResponse>(`/api/templates?page=${page}&limit=${limit}`);
};

export const getTemplate = async (id: string): Promise<Template> => {
  return apiRequest<Template>(`/api/templates/${id}`);
};

export const createTemplate = async (data: { name: string; description: string; workflowId: string }): Promise<Template> => {
  return apiRequest<Template>(`/api/templates`, {
    method: "POST",
    body: data,
  });
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await apiRequest(`/api/templates/${id}`, {
    method: "DELETE",
  });
};
