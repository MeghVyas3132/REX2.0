"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth/session-context";

export function SessionHydrator() {
  const { refreshUser, loading, token, user } = useSession();

  useEffect(() => {
    if (!loading && token && !user) {
      void refreshUser();
    }
  }, [loading, refreshUser, token, user]);

  return null;
}
