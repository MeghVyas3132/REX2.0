import { apiRequest } from "@/lib/api/client";
import type { AuthResponse } from "./types";

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export async function register(email: string, name: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: { email, name, password },
    auth: false,
  });
}
