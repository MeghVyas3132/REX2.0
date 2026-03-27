import type { AuthUser } from "@/lib/api/types";

export type AuthResponse = {
  user: AuthUser;
  token: string;
};
