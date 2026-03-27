import { useQuery } from "@tanstack/react-query";
import { listCorpora, getCorpus } from "./api";

export const knowledgeQueryKeys = {
  all: ["knowledge", "corpora"] as const,
  list: (page = 1, limit = 20) => ["knowledge", "corpora", "list", { page, limit }] as const,
  detail: (id: string) => ["knowledge", "corpora", "detail", id] as const,
};

export const useCorporaQuery = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: knowledgeQueryKeys.list(page, limit),
    queryFn: () => listCorpora(page, limit),
    staleTime: 30000,
  });
};

export const useCorpusQuery = (id: string) => {
  return useQuery({
    queryKey: knowledgeQueryKeys.detail(id),
    queryFn: () => getCorpus(id),
    staleTime: 30000,
    enabled: Boolean(id),
  });
};
