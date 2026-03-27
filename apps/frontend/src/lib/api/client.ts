import { getStoredToken } from "@/lib/auth/token-storage";
import {
  AppApiError,
  isApiErrorPayload,
  isApiSuccess,
  type ApiEnvelope,
} from "@/lib/api/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_GET_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 300;

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  auth?: boolean;
  credentials?: RequestCredentials;
  retries?: number;
  retryDelayMs?: number;
};

function normalizePath(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(method: string, status: number): boolean {
  if (method !== "GET") return false;
  if (status === 0) return true;
  if (status === 408 || status === 429) return true;
  return status >= 500;
}

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function toApiError(params: {
  status: number;
  statusText: string;
  payload: unknown;
  requestId?: string;
  fallbackCode: string;
  fallbackMessage: string;
  retryable?: boolean;
  details?: unknown;
}): AppApiError {
  const { status, statusText, payload, requestId, fallbackCode, fallbackMessage, retryable, details } = params;

  if (isApiErrorPayload(payload)) {
    return new AppApiError(payload.error.code, payload.error.message, status, payload.error.details, {
      requestId,
      retryable,
    });
  }

  if (payload && typeof payload === "object") {
    const maybeCode = (payload as { code?: unknown }).code;
    const maybeMessage = (payload as { message?: unknown }).message;
    if (typeof maybeCode === "string" || typeof maybeMessage === "string") {
      return new AppApiError(
        typeof maybeCode === "string" ? maybeCode : fallbackCode,
        typeof maybeMessage === "string" ? maybeMessage : fallbackMessage || statusText,
        status,
        details ?? payload,
        { requestId, retryable },
      );
    }
  }

  return new AppApiError(fallbackCode, fallbackMessage || statusText, status, details, {
    requestId,
    retryable,
  });
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    auth = true,
    credentials = "include",
    retries = method === "GET" ? DEFAULT_GET_RETRIES : 0,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  } = options;

  const requestUrl = normalizePath(path);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const requestHeaders: Record<string, string> = {
        Accept: "application/json",
        ...headers,
      };

      if (body !== undefined) {
        requestHeaders["Content-Type"] = "application/json";
      }

      if (auth) {
        const token = getStoredToken();
        if (token) {
          requestHeaders.Authorization = `Bearer ${token}`;
        }
      }

      const response = await fetch(requestUrl, {
        method,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        cache: "no-store",
        credentials,
      });

      const requestId = response.headers.get("x-request-id") ?? response.headers.get("X-Request-Id") ?? undefined;
      const text = await response.text();
      const payload = parseBody(text) as ApiEnvelope<T> | unknown;

      if (!response.ok) {
        const retryable = shouldRetry(method, response.status);
        const error = toApiError({
          status: response.status,
          statusText: response.statusText,
          payload,
          requestId,
          fallbackCode: "HTTP_ERROR",
          fallbackMessage: `HTTP ${response.status}`,
          retryable,
          details: payload,
        });

        if (retryable && attempt < retries) {
          const delay = retryDelayMs * Math.max(1, attempt + 1);
          await wait(delay);
          continue;
        }

        throw error;
      }

      if (response.status === 204) {
        return undefined as T;
      }

      if (isApiSuccess<T>(payload)) {
        return payload.data;
      }

      throw new AppApiError("INVALID_RESPONSE", "Unexpected API response envelope", response.status, payload, {
        requestId,
      });
    } catch (error) {
      if (error instanceof AppApiError) {
        if (error.retryable && attempt < retries) {
          const delay = retryDelayMs * Math.max(1, attempt + 1);
          await wait(delay);
          continue;
        }
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        const timeoutError = new AppApiError("TIMEOUT", "Request timed out", 408, { path }, {
          retryable: method === "GET",
          cause: error,
        });

        if (timeoutError.retryable && attempt < retries) {
          const delay = retryDelayMs * Math.max(1, attempt + 1);
          await wait(delay);
          continue;
        }

        throw timeoutError;
      }

      const networkError = new AppApiError("NETWORK_ERROR", "Unable to connect to the API", 0, { path }, {
        retryable: method === "GET",
        cause: error,
      });

      if (networkError.retryable && attempt < retries) {
        const delay = retryDelayMs * Math.max(1, attempt + 1);
        await wait(delay);
        continue;
      }

      throw networkError;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new AppApiError("UNREACHABLE", "Unexpected request state", 500, { path });
}
