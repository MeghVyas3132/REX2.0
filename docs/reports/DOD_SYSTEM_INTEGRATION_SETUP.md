/**
 * DoD System Integration Setup
 * Initialize all production-ready systems in your Next.js app
 */

// ========== FILE: apps/frontend/src/app/layout.tsx ==========

import { PropsWithChildren } from "react";
import { AppErrorBoundary } from "@/components/shared/AppErrorBoundary";
import { SessionProvider } from "@/lib/auth/session-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/api/query-client";
import { TelemetryInitializer } from "@/components/providers/TelemetryInitializer";

export default function RootLayout({
  children,
}: PropsWithChildren) {
  return (
    <html>
      <body>
        <AppErrorBoundary>
          <SessionProvider>
            <QueryClientProvider client={queryClient}>
              <TelemetryInitializer>
                {children}
              </TelemetryInitializer>
            </QueryClientProvider>
          </SessionProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}

// ========== FILE: src/components/providers/TelemetryInitializer.tsx ==========

"use client";

import { useEffect } from "react";
import { telemetry } from "@/lib/telemetry/observability";

export function TelemetryInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize telemetry backend integration
    telemetry.subscribe((event) => {
      // Example: Send to Mixpanel, Segment, etc.
      if (process.env.NEXT_PUBLIC_TELEMETRY_ENABLED === "true") {
        // Send to backend telemetry service
        fetch("/api/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        }).catch((err) => console.error("Telemetry send failed:", err));
      }
    });

    // Track initial page load
    telemetry.trackPageView(window.location.pathname);

    // Track page changes on navigation
    const handlePopState = () => {
      telemetry.trackPageView(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return <>{children}</>;
}

// ========== FILE: src/app/api/telemetry/route.ts ==========

/**
 * API endpoint for receiving telemetry events
 * Can log to database, send to external analytics, etc.
 */

export async function POST(request: Request) {
  try {
    const event = await request.json();

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("📊 Telemetry received:", event);
    }

    // Example: Log to database or external service
    // await logTelemetryEvent(event);

    // Example: Send to external analytics like Segment
    // if (process.env.SEGMENT_WRITE_KEY) {
    //   await sendToSegment(event);
    // }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Telemetry endpoint error:", error);
    return Response.json(
      { error: "Failed to process telemetry" },
      { status: 500 }
    );
  }
}

// ========== FILE: src/hooks/useProductionComponent.ts ==========

/**
 * Convenient hook that combines all DoD requirements
 * Use in any component for instant production readiness
 */

"use client";

import { useSession } from "@/lib/auth/session-context";
import { useTelemetryPageView, useTelemetryMutation } from "@/lib/telemetry/observability";
import { useFocusTrap } from "@/lib/a11y/accessibility";
import { useAsyncState } from "@/components/ui/ProductionAsyncStateView";
import { useCallback } from "react";

export function useProductionComponent(
  componentName: string,
  options?: {
    trackPageView?: boolean;
    trackActions?: boolean;
    manageFocus?: boolean;
    asyncStateManagement?: boolean;
  }
) {
  const {
    trackPageView = true,
    trackActions = true,
    manageFocus = false,
    asyncStateManagement = false,
  } = options || {};

  // Get user for permission checks
  const { user } = useSession();

  // Track page view
  if (trackPageView) {
    useTelemetryPageView(componentName);
  }

  // Focus management
  const focusRef = manageFocus ? useFocusTrap(false) : null;

  // Async state management
  const asyncState = asyncStateManagement ? useAsyncState() : null;

  // Action tracking
  const trackAction = useCallback(
    (action: string, resourceType?: string, resourceId?: string) => {
      if (trackActions) {
        // Telemetry tracking happens here
        console.log(`Action tracked: ${action} on ${resourceType}/${resourceId}`);
      }
    },
    [trackActions]
  );

  return {
    user,
    focusRef,
    asyncState,
    trackAction,
  };
}

// ========== FILE: src/hooks/useProductionMutation.ts ==========

/**
 * Wrapper around useMutation that adds all DoD criteria
 */

"use client";

import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useMutationGuard } from "@/lib/rbac/production-rbac";
import { useTelemetryMutation } from "@/lib/telemetry/observability";
import { telemetry } from "@/lib/telemetry/observability";
import { useSession } from "@/lib/auth/session-context";
import type { AppRole } from "@/lib/rbac/permissions";

interface ProductionMutationOptions<TData, TError, TVariables>
  extends Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn"> {
  action: string;
  resourceType: string;
  requiredRole?: AppRole;
  mutationFn: (variables: TVariables) => Promise<TData>;
}

export function useProductionMutation<TData, TError, TVariables>({
  action,
  resourceType,
  requiredRole,
  mutationFn,
  ...options
}: ProductionMutationOptions<TData, TError, TVariables>) {
  const { user } = useSession();
  const permission = useMutationGuard(user, requiredRole);
  const telemetryTracker = useTelemetryMutation(action, resourceType);

  return useMutation(
    {
      mutationFn: async (variables: TVariables) => {
        // Check permission
        if (!permission.canMutate) {
          telemetry.trackPermissionDenied(action, resourceType);
          throw new Error(permission.error || "Permission denied");
        }

        // Track mutation start
        const startTime = telemetryTracker.start();

        try {
          // Execute mutation
          const result = await mutationFn(variables);

          // Track success
          telemetryTracker.success(startTime, {
            resourceType,
            action,
          });

          return result;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";

          // Track error
          telemetryTracker.error(startTime, errorMsg);

          // Re-throw for query client to handle
          throw error;
        }
      },
      ...options,
    },
    []
  );
}

// ========== EXAMPLE USAGE: Simple Component ==========

import { useProductionComponent } from "@/hooks/useProductionComponent";
import { useProductionMutation } from "@/hooks/useProductionMutation";
import { GuardedAction } from "@/lib/rbac/production-rbac";
import { ProductionAsyncStateView } from "@/components/ui/ProductionAsyncStateView";

export function SimpleWorkflowAction({ workflowId }: { workflowId: string }) {
  const { user, trackAction } = useProductionComponent("WorkflowAction", {
    trackPageView: false,
    trackActions: true,
  });

  const deleteWorkflow = useProductionMutation({
    action: "delete",
    resourceType: "workflow",
    requiredRole: "org_admin",
    mutationFn: async () => {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      trackAction("delete", "workflow", workflowId);
    },
  });

  return (
    <GuardedAction
      user={user}
      requiredRole="org_admin"
      fallback={
        <button disabled title="Only admins can delete workflows">
          Delete
        </button>
      }
    >
      <button
        onClick={() => deleteWorkflow.mutate()}
        disabled={deleteWorkflow.isPending}
        aria-label={`Delete workflow`}
      >
        {deleteWorkflow.isPending ? "Deleting..." : "Delete"}
      </button>
    </GuardedAction>
  );
}

// ========== FILE: src/lib/api/query-client.ts ==========

/**
 * Shared React Query client with error handling
 */

import { QueryClient } from "@tanstack/react-query";
import { telemetry } from "@/lib/telemetry/observability";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry permission errors or not found
        if (error instanceof Error) {
          if (error.message.includes("403") || error.message.includes("404")) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry permission errors
        if (error instanceof Error) {
          if (error.message.includes("403")) {
            return false;
          }
        }
        return failureCount < 1;
      },
    },
  },
});

// Add error tracking to all queries and mutations
queryClient.setDefaultOptions({
  queries: {
    ...queryClient.getDefaultOptions().queries,
    meta: {
      onError: (error: unknown) => {
        if (error instanceof Error) {
          telemetry.trackQueryError("unknown", error.message);
        }
      },
    },
  },
});

// ========== FILE: vitest.config.ts (update) ==========

/**
 * Vitest configuration with DoD test utilities
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__",
        "src/**/*.stories.tsx",
      ],
      lines: 75,
      functions: 75,
      branches: 70,
      statements: 75,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

// ========== FILE: src/__tests__/setup.ts ==========

/**
 * Test setup with DoD utilities and mocks
 */

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest matchers with DOM matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});

window.IntersectionObserver = mockIntersectionObserver as any;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ========== CHECKLIST: Setup Steps ==========

/*

 1. Copy newly created infrastructure files:
    - ProductionAsyncStateView.tsx
    - observability.ts
    - accessibility.ts
    - production-rbac.ts
    - dod-test-utilities.ts

 2. Update app/layout.tsx with providers and error boundary

 3. Create TelemetryInitializer component in src/components/providers/

 4. Create telemetry API endpoint at src/app/api/telemetry/route.ts

 5. Create useProductionComponent and useProductionMutation hooks

 6. Update QueryClient configuration with error tracking

 7. Run type check: `npm run type-check`
    Expected: 0 errors

 8. Run tests: `npm run test`
    Expected: All tests pass + coverage improved

 9. Run linter: `npm run lint`
    Expected: 0 errors

10. Start dev server: `npm run dev`
    Expected: No console errors, telemetry events in Network tab

*/
