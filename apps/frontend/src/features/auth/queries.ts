"use client";

import { useMutation } from "@tanstack/react-query";
import { login, register } from "./api";

export const authQueryKeys = {
  all: ["auth"] as const,
  session: () => ["auth", "session"] as const,
};

export function useLoginMutation() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: ({ email, name, password }: { email: string; name: string; password: string }) =>
      register(email, name, password),
  });
}
