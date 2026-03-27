export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorPayload = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorPayload;

export function isApiSuccess<T>(payload: unknown): payload is ApiSuccess<T> {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "success" in payload &&
      (payload as { success?: unknown }).success === true &&
      "data" in payload,
  );
}

export function isApiErrorPayload(payload: unknown): payload is ApiErrorPayload {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "success" in payload &&
      (payload as { success?: unknown }).success === false &&
      "error" in payload,
  );
}

export class AppApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;
  public readonly requestId?: string;
  public readonly retryable: boolean;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: unknown,
    options?: {
      requestId?: string;
      retryable?: boolean;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "AppApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = options?.requestId;
    this.retryable = options?.retryable ?? false;

    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export function isAppApiError(error: unknown): error is AppApiError {
  return error instanceof AppApiError;
}

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  globalRole: "super_admin" | "user";
  tenantId: string;
  tenantRole: "org_admin" | "org_editor" | "org_viewer";
  interfaceAccess?: "business" | "studio" | "both";
};
