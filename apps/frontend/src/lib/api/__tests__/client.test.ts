import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/lib/api/client";
import { AppApiError } from "@/lib/api/types";

describe("apiRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns data from success envelope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: "wf_1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const data = await apiRequest<{ id: string }>("/api/workflows/wf_1");
    expect(data).toEqual({ id: "wf_1" });
  });

  it("throws normalized AppApiError for envelope errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Workflow missing" },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(apiRequest("/api/workflows/missing")).rejects.toMatchObject({
      name: "AppApiError",
      code: "NOT_FOUND",
      status: 404,
      message: "Workflow missing",
    });
  });

  it("retries GET requests on retryable HTTP errors", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("", { status: 500, statusText: "Internal Server Error" }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: { ok: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const data = await apiRequest<{ ok: boolean }>("/api/retryable", { retryDelayMs: 1 });

    expect(data).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-GET requests", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 500, statusText: "Internal Server Error" }));

    await expect(
      apiRequest("/api/workflows", {
        method: "POST",
        body: { name: "x" },
        retryDelayMs: 1,
      }),
    ).rejects.toBeInstanceOf(AppApiError);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("returns undefined for 204 responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    const data = await apiRequest<void>("/api/no-content");
    expect(data).toBeUndefined();
  });
});
