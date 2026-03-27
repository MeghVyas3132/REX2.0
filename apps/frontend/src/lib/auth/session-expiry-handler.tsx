"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth/session-context";
import { getMsUntilExpiry, parseJwtExpiryMs } from "@/lib/auth/session-utils";

export function SessionExpiryHandler() {
  const { token, signOut } = useSession();

  useEffect(() => {
    if (!token) return;

    const expiryMs = parseJwtExpiryMs(token);
    if (!expiryMs) return;

    const msUntilExpiry = getMsUntilExpiry(expiryMs);
    if (msUntilExpiry <= 0) {
      signOut();
      return;
    }

    const timer = window.setTimeout(() => {
      signOut();
    }, msUntilExpiry);

    return () => {
      window.clearTimeout(timer);
    };
  }, [signOut, token]);

  return null;
}
