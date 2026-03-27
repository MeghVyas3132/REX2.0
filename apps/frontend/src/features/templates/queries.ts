import { useQuery } from "@tanstack/react-query";
import { listTemplates, getTemplate } from "./api";

export const templateQueryKeys = {
  all: ["templates"] as const,
  list: (page = 1, limit = 20) => ["templates", "list", { page, limit }] as const,
  detail: (id: string) => ["templates", "detail", id] as const,
};

export const useTemplatesQuery = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: templateQueryKeys.list(page, limit),
    queryFn: () => listTemplates(page, limit),
    staleTime: 30000,
  });
};

export const useTemplateQuery = (id: string) => {
  return useQuery({
    queryKey: templateQueryKeys.detail(id),
    queryFn: () => getTemplate(id),
    staleTime: 30000,
    enabled: Boolean(id),
  });
};
