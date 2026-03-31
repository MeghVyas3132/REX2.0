import { useQuery } from "@tanstack/react-query";

export type Plugin = {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  version?: string;
  icon?: string;
  technicalLevel?: "basic" | "advanced" | string;
  manifest?: Record<string, unknown>;
  isPublic?: boolean;
  isBuiltin?: boolean;
  isActive?: boolean;
};

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
