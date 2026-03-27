export function parseJwtExpiryMs(token: string): number | null {
  const parts = token.split(".");
  const payloadPart = parts[1];
  if (!payloadPart) return null;

  try {
    const payloadBase64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, "=");
    const decoded =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(decoded) as { exp?: unknown };

    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return null;
    }

    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function getMsUntilExpiry(expiryMs: number, nowMs: number = Date.now()): number {
  return Math.max(0, expiryMs - nowMs);
}
