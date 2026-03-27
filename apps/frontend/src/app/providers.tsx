"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";
import { createQueryClient } from "@/lib/query/query-client";
import { AuthProvider } from "@/lib/auth/session-context";
import { SessionHydrator } from "@/lib/auth/session-hydrator";
import { SessionExpiryHandler } from "@/lib/auth/session-expiry-handler";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionHydrator />
        <SessionExpiryHandler />
        {children}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
