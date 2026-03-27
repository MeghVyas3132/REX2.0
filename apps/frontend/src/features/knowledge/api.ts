import { apiRequest } from "@/lib/api/client";

export interface KnowledgeCorpus {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListCorporaResponse {
  corpora: KnowledgeCorpus[];
  total: number;
  page: number;
  limit: number;
}

export const listCorpora = async (page: number = 1, limit: number = 20): Promise<ListCorporaResponse> => {
  return apiRequest<ListCorporaResponse>(`/api/knowledge/corpora?page=${page}&limit=${limit}`);
};

export const getCorpus = async (id: string): Promise<KnowledgeCorpus> => {
  return apiRequest<KnowledgeCorpus>(`/api/knowledge/corpora/${id}`);
};

export const createCorpus = async (data: { name: string; description?: string }): Promise<KnowledgeCorpus> => {
  return apiRequest<KnowledgeCorpus>(`/api/knowledge/corpora`, {
    method: "POST",
    body: data,
  });
};

export const deleteCorpus = async (id: string): Promise<void> => {
  await apiRequest(`/api/knowledge/corpora/${id}`, {
    method: "DELETE",
  });
};
