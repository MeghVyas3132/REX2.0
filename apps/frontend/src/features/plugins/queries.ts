import { useQuery } from "@tanstack/react-query";
import type { Plugin } from "@rex/types";

export function usePluginsQuery() {
  return useQuery({
    queryKey: ["plugins"],
    queryFn: async (): Promise<Plugin[]> => {
      const res = await fetch("/api/plugins", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch plugins");
      }
      return res.json();
    },
  });
}

export function usePluginQuery(slug: string) {
  return useQuery({
    queryKey: ["plugins", slug],
    queryFn: async (): Promise<Plugin> => {
      const res = await fetch(`/api/plugins/${slug}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch plugin");
      }
      return res.json();
    },
    enabled: !!slug,
  });
}
