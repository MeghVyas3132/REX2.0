import { useQuery } from "@tanstack/react-query";
import { listPublications, getPublication } from "./api";

export const publicationQueryKeys = {
  all: ["publications"] as const,
  list: (page = 1, limit = 20) => ["publications", "list", { page, limit }] as const,
  detail: (id: string) => ["publications", "detail", id] as const,
};

export const usePublicationsQuery = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: publicationQueryKeys.list(page, limit),
    queryFn: () => listPublications(page, limit),
    staleTime: 30000,
  });
};

export const usePublicationQuery = (id: string) => {
  return useQuery({
    queryKey: publicationQueryKeys.detail(id),
    queryFn: () => getPublication(id),
    staleTime: 30000,
    enabled: Boolean(id),
  });
};
