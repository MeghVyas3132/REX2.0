import { describe, expect, it, vi } from "vitest";

import { getMsUntilExpiry, parseJwtExpiryMs } from "@/lib/auth/session-utils";

function createJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.`;
}

describe("session utils", () => {
  it("parses JWT exp to epoch milliseconds", () => {
    const token = createJwt({ exp: 2_000_000_000 });
    expect(parseJwtExpiryMs(token)).toBe(2_000_000_000_000);
  });

  it("returns null for invalid token payload", () => {
    expect(parseJwtExpiryMs("invalid.token")).toBeNull();
    expect(parseJwtExpiryMs(createJwt({ exp: "bad" }))).toBeNull();
  });

  it("computes non-negative milliseconds until expiry", () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000);
    expect(getMsUntilExpiry(2_500)).toBe(1_500);
    expect(getMsUntilExpiry(500)).toBe(0);
    nowSpy.mockRestore();
  });
});
