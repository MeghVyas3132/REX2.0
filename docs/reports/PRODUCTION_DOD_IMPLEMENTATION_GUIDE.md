# Component Definition of Done (DoD) - Implementation Guide

## Overview

This guide demonstrates how to implement all Definition of Done criteria for production-ready components. All examples use the infrastructure built in this phase.

---

## 1. ASYNC STATE HANDLING

**DoD Requirement**: Components handle loading, success, empty, error, and forbidden states.

### Pattern: List Page with Async States

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { DataTable } from "@/components/ui/DataTable";
import { WorkflowFilters } from "@/components/filters/WorkflowFilters";
import { useSession } from "@/lib/auth/session-context";
import { useTelemetryPageView } from "@/lib/telemetry/observability";

export default function WorkflowListPage({
  searchParams,
}: {
  searchParams: { page?: string; filter?: string };
}) {
  // Track page view
  useTelemetryPageView("workflows-list");

  // Get current user for permission checks
  const { user } = useSession();

  // Fetch data with async states
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["workflows", searchParams],
    queryFn: async () => {
      const res = await fetch(
        `/api/workflows?${new URLSearchParams(searchParams)}`
      );
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  // Derive async state
  const isEmpty = data?.items?.length === 0 && !isLoading;

  return (
    <ListPageWrapper
      title="Workflows"
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      error={error?.message}
      filters={<WorkflowFilters />}
      current={parseInt(searchParams.page || "1")}
      total={data?.totalPages || 1}
      onPageChange={(page) => {
        // Handle page change with telemetry
        telemetry.trackAction("workflow_list_paginate", "workflow", undefined, {
          page,
        });
      }}
    >
      {/* Component receives children only on success state */}
      <DataTable columns={workflowColumns} data={data?.items || []} />
    </ListPageWrapper>
  );
}
```

### Pattern: Detail Page with Async States

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductionAsyncStateView } from "@/components/ui/ProductionAsyncStateView";
import { DetailPageHeader } from "@/components/ui/DetailPageHeader";
import { useSession } from "@/lib/auth/session-context";
import { canEdit } from "@/lib/rbac/permissions";
import { useTelemetryPageView } from "@/lib/telemetry/observability";

export default function WorkflowDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Track page view
  useTelemetryPageView("workflow-detail", { workflowId: params.id });

  // Get user for permission checks
  const { user } = useSession();

  // Fetch detail data with async states
  const { data: workflow, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["workflow", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/workflows/${params.id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  // Determine async state
  const state = isLoading
    ? "loading"
    : isError
      ? "error"
      : !user || !canEdit(user)
        ? "forbidden"
        : workflow
          ? "success"
          : "empty";

  return (
    <ProductionAsyncStateView
      state={state}
      error={error?.message}
      forbiddenMessage="You do not have permission to edit this workflow."
      onRetry={() => refetch()}
    >
      {workflow && (
        <div>
          <DetailPageHeader
            title={workflow.name}
            status={{ value: workflow.status, color: getStatusColor(workflow.status) }}
            actions={[
              {
                id: "edit",
                label: "Edit",
                onClick: () => goToEdit(workflow.id),
                requiresPermission: "org_editor",
              },
              {
                id: "delete",
                label: "Delete",
                onClick: () => deleteWorkflow(workflow.id),
                requiresPermission: "org_admin",
              },
            ]}
          />
          {/* Detail content */}
          <WorkflowDetailContent workflow={workflow} />
        </div>
      )}
    </ProductionAsyncStateView>
  );
}
```

---

## 2. ROLE-BASED ACCESS CONTROL (RBAC)

**DoD Requirement**: All actions permission-checked; forbidden actions not executable.

### Pattern: Permission-Guarded Action Button

```typescript
import { GuardedAction } from "@/lib/rbac/production-rbac";
import { useSession } from "@/lib/auth/session-context";

export function WorkflowActions({ workflow }) {
  const { user } = useSession();

  return (
    <div>
      {/* Delete button - admin only */}
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
          onClick={() => deleteWorkflow(workflow.id)}
          aria-label={`Delete workflow ${workflow.name}`}
        >
          Delete
        </button>
      </GuardedAction>

      {/* Edit button - editor and above */}
      <GuardedAction
        user={user}
        requiredRole="org_editor"
        fallback={
          <button disabled title="Only editors can modify workflows">
            Edit
          </button>
        }
      >
        <button
          onClick={() => goToEdit(workflow.id)}
          aria-label={`Edit workflow ${workflow.name}`}
        >
          Edit
        </button>
      </GuardedAction>

      {/* View button - all authenticated users */}
      <button
        onClick={() => goToDetail(workflow.id)}
        aria-label={`View workflow ${workflow.name}`}
      >
        View Details
      </button>
    </div>
  );
}
```

### Pattern: Role-Safe Mutation Hook

```typescript
import { useMutation } from "@tanstack/react-query";
import { useMutationGuard } from "@/lib/rbac/production-rbac";
import { useTelemetryMutation } from "@/lib/telemetry/observability";
import { telemetry } from "@/lib/telemetry/observability";

export function useDeleteWorkflow() {
  const { user } = useSession();
  const permission = useMutationGuard(user, "org_admin");
  const telemetryTracker = useTelemetryMutation("delete", "workflow");

  return useMutation({
    mutationFn: async (workflowId: string) => {
      // Check permission again before mutation
      if (!permission.canMutate) {
        telemetry.trackPermissionDenied("delete", "workflow");
        throw new Error(permission.error);
      }

      const startTime = telemetryTracker.start();

      try {
        const res = await fetch(`/api/workflows/${workflowId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);

        telemetryTracker.success(startTime, { workflowId });
        return res.json();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        telemetryTracker.error(startTime, errorMsg);
        throw err;
      }
    },
  });
}
```

---

## 3. END-TO-END TYPE SAFETY

**DoD Requirement**: All request/response types properly defined and used.

### Pattern: Typed API Endpoints

```typescript
// File: features/workflows/types.ts
export interface WorkflowDTO {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface GetWorkflowsRequest {
  page?: number;
  pageSize?: number;
  filter?: string;
}

export interface GetWorkflowsResponse {
  items: WorkflowDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DeleteWorkflowRequest {
  id: string;
}

export interface DeleteWorkflowResponse {
  id: string;
  deleted: true;
}

// File: features/workflows/queries.ts
export const workflowQueries = {
  getWorkflows: (params: GetWorkflowsRequest) =>
    ({
      queryKey: ["workflows", params],
      queryFn: async () => {
        const res = await fetch("/api/workflows?" + new URLSearchParams(params));
        if (!res.ok) throw new Error(await res.text());
        return res.json() as Promise<GetWorkflowsResponse>;
      },
    } as const),

  getWorkflow: (id: string) =>
    ({
      queryKey: ["workflow", id],
      queryFn: async () => {
        const res = await fetch(`/api/workflows/${id}`);
        if (!res.ok) throw new Error(await res.text());
        return res.json() as Promise<WorkflowDTO>;
      },
    } as const),
};

// File: features/workflows/mutations.ts
export const workflowMutations = {
  deleteWorkflow: () =>
    ({
      mutationFn: async (request: DeleteWorkflowRequest) => {
        const res = await fetch(`/api/workflows/${request.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json() as Promise<DeleteWorkflowResponse>;
      },
    } as const),
};

// Usage in component - now fully typed
import { useQuery, useMutation } from "@tanstack/react-query";
import { workflowQueries, workflowMutations } from "@/features/workflows";

export function Workflows() {
  // Fully typed query
  const { data } = useQuery(workflowQueries.getWorkflows({ page: 1 }));

  // Fully typed mutation
  const { mutate } = useMutation(workflowMutations.deleteWorkflow());

  return <div>{data?.items.map((w) => <div key={w.id}>{w.name}</div>)}</div>;
}
```

---

## 4. ACCESSIBILITY

**DoD Requirement**: WCAG 2.1 AA compliance; keyboard navigation; screen reader support.

### Pattern: Accessible Component

```typescript
"use client";

import { useFocusTrap, keyboard, createAriaLabel } from "@/lib/a11y/accessibility";
import { ScreenReaderAnnouncement } from "@/lib/a11y/accessibility";
import React from "react";

export function AccessibleWorkflowModal({
  isOpen,
  workflow,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  workflow: Workflow;
  onClose: () => void;
  onSave: () => void;
}) {
  const containerRef = useFocusTrap(isOpen);
  const [announcement, setAnnouncement] = React.useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (keyboard.isEscape(e)) {
      onClose();
    }
  };

  return (
    <>
      <ScreenReaderAnnouncement message={announcement} />

      {isOpen && (
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
          onKeyDown={handleKeyDown}
        >
          <h2 id="modal-title">Edit Workflow</h2>
          <p id="modal-description">
            Make changes to the workflow and click Save to apply.
          </p>

          <form>
            <label htmlFor="name">
              Workflow Name
              <input
                id="name"
                defaultValue={workflow.name}
                aria-label={createAriaLabel("Workflow", "name")}
                aria-describedby="name-help"
              />
              <small id="name-help">
                Enter a descriptive name for this workflow.
              </small>
            </label>

            <button
              type="button"
              onClick={onClose}
              aria-label={createAriaLabel("Cancel", "editing workflow")}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => {
                onSave();
                setAnnouncement("Workflow saved successfully");
              }}
              aria-label={createAriaLabel("Save", "changes to workflow")}
            >
              Save Changes
            </button>
          </form>
        </div>
      )}
    </>
  );
}
```

---

## 5. OBSERVABILITY / TELEMETRY

**DoD Requirement**: Major user actions tracked with context.

### Pattern: Instrumented Mutation

```typescript
import { useMutation } from "@tanstack/react-query";
import {
  useTelemetryMutation,
  telemetry,
} from "@/lib/telemetry/observability";

export function usePublishWorkflow() {
  const telemetryTracker = useTelemetryMutation("publish", "workflow");

  return useMutation({
    mutationFn: async (workflowId: string) => {
      const startTime = telemetryTracker.start();

      try {
        const res = await fetch(`/api/workflows/${workflowId}/publish`, {
          method: "POST",
        });

        if (!res.ok) {
          const error = await res.text();
          telemetryTracker.error(startTime, error);
          throw new Error(error);
        }

        const result = await res.json();

        // Track success with additional metadata
        telemetryTracker.success(startTime, {
          workflowId,
          newStatus: result.status,
        });

        // Also emit custom event
        telemetry.trackAction("workflow_published", "workflow", workflowId, {
          previousStatus: "draft",
          newStatus: result.status,
        });

        return result;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        telemetry.trackQueryError("workflow", msg);
        throw error;
      }
    },
  });
}

// Register telemetry listener (in app initialization)
telemetry.subscribe((event) => {
  // Send to analytics backend (Segment, Mixpanel, etc.)
  if (process.env.NEXT_PUBLIC_ANALYTICS_KEY) {
    analytics.track(event.type, {
      timestamp: event.timestamp,
      userId: event.userId,
      action: event.action,
      resourceId: event.resourceId,
      resourceType: event.resourceType,
      duration: event.duration,
      error: event.error,
      ...event.metadata,
    });
  }
});
```

---

## 6. COMPREHENSIVE TESTING

**DoD Requirement**: Unit + integration tests covering all criteria.

### Pattern: DoD-Compliant Component Test

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "@/lib/auth/session-context";
import { WorkflowDetailPage } from "@/app/workflows/[id]/page";
import {
  describeAsyncStates,
  describeRBACCompliance,
  describeA11yCompliance,
  describeObservability,
} from "@/__tests__/dod-test-utilities";

describe("WorkflowDetailPage - Production DoD", () => {
  // ===== ASYNC STATES =====
  describe("Async States", () => {
    it("shows loading skeleton while fetching", async () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <SessionProvider>
            <WorkflowDetailPage params={{ id: "123" }} />
          </SessionProvider>
        </QueryClientProvider>
      );

      expect(screen.getByRole("status")).toHaveAttribute(
        "aria-label",
        "Loading..."
      );
      expect(screen.getByRole("status")).toHaveAttribute(
        "aria-live",
        "polite"
      );
    });

    it("renders success state with workflow data", async () => {
      // Mock successful API response
      vi.mock("@tanstack/react-query", async () => ({
        ...vi.importActual("@tanstack/react-query"),
        useQuery: vi.fn(() => ({
          data: { id: "123", name: "Test", status: "draft" },
          isLoading: false,
          isError: false,
        })),
      }));

      render(
        <QueryClientProvider client={new QueryClient()}>
          <SessionProvider>
            <WorkflowDetailPage params={{ id: "123" }} />
          </SessionProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Test")).toBeInTheDocument();
      });
    });

    it("renders error state with retry button", async () => {
      vi.mock("@tanstack/react-query", async () => ({
        ...vi.importActual("@tanstack/react-query"),
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
          isError: true,
          error: new Error("Failed to fetch"),
          refetch: vi.fn(),
        })),
      }));

      render(
        <QueryClientProvider client={new QueryClient()}>
          <SessionProvider>
            <WorkflowDetailPage params={{ id: "123" }} />
          </SessionProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Failed to fetch"
        );
        expect(screen.getByText("Try again")).toBeInTheDocument();
      });
    });

    it("renders forbidden state for unauthorized users", async () => {
      // Mock user without permission
      vi.mock("@/lib/auth/session-context", () => ({
        useSession: () => ({
          user: { id: "1", roles: ["org_viewer"] },
        }),
      }));

      render(
        <QueryClientProvider client={new QueryClient()}>
          <SessionProvider>
            <WorkflowDetailPage params={{ id: "123" }} />
          </SessionProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Access Denied")).toBeInTheDocument();
      });
    });
  });

  // ===== RBAC COMPLIANCE =====
  describe("RBAC Compliance", () => {
    it("disables edit button for viewers", async () => {
      vi.mock("@/lib/auth/session-context", () => ({
        useSession: () => ({
          user: { id: "1", roles: ["org_viewer"] },
        }),
      }));

      render(
        <QueryClientProvider client={new QueryClient()}>
          <SessionProvider>
            <WorkflowDetailPage params={{ id: "123" }} />
          </SessionProvider>
        </QueryClientProvider>
      );

      const editButton = screen.getByLabelText(/Edit workflow/i);
      expect(editButton).toBeDisabled();
    });

    it("enables edit button for editors", async () => {
      vi.mock("@/lib/auth/session-context", () => ({
        useSession: () => ({
          user: { id: "1", roles: ["org_editor"] },
        }),
      }));

      render(
        <QueryClientProvider client={new QueryClient()}>
          <SessionProvider>
            <WorkflowDetailPage params={{ id: "123" }} />
          </SessionProvider>
        </QueryClientProvider>
      );

      const editButton = screen.getByLabelText(/Edit workflow/i);
      expect(editButton).toBeEnabled();
    });

    it("disables delete button for non-admins", async () => {
      vi.mock("@/lib/auth/session-context", () => ({
        useSession: () => ({
          user: { id: "1", roles: ["org_editor"] },
        }),
      }));

      render(
        <QueryClientProvider client={new QueryClient()}>
          <SessionProvider>
            <WorkflowDetailPage params={{ id: "123" }} />
          </SessionProvider>
        </QueryClientProvider>
      );

      const deleteButton = screen.getByLabelText(/Delete workflow/i);
      expect(deleteButton).toBeDisabled();
    });
  });

  // ===== ACCESSIBILITY =====
  describe("Accessibility", () => {
    it("has semantic heading for workflow name", async () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <SessionProvider>
            <WorkflowDetailPage params={{ id: "123" }} />
          </SessionProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        const heading = screen.getByRole("heading", { level: 1 });
        expect(heading).toBeInTheDocument();
      });
    });

    it("supports keyboard navigation", async () => {
      const { container } = render(
        <QueryClientProvider client={new QueryClient()}>
          <SessionProvider>
            <WorkflowDetailPage params={{ id: "123" }} />
          </SessionProvider>
        </QueryClientProvider>
      );

      const editButton = screen.getByLabelText(/Edit workflow/i);
      editButton.focus();
      expect(editButton).toHaveFocus();

      fireEvent.keyDown(editButton, { key: "Enter" });
      expect(editButton).toHaveFocus();
    });

    it("has focus-visible indicators on buttons", async () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <SessionProvider>
            <WorkflowDetailPage params={{ id: "123" }} />
          </SessionProvider>
        </QueryClientProvider>
      );

      const editButton = screen.getByLabelText(/Edit workflow/i);
      fireEvent.focus(editButton);

      const styles = window.getComputedStyle(editButton);
      expect(styles.outline).not.toBe("none");
    });
  });

  // ===== OBSERVABILITY =====
  describe("Observability", () => {
    it("emits page_view telemetry event", async () => {
      const telemetryMock = vi.fn();
      vi.mock("@/lib/telemetry/observability", async () => ({
        ...vi.importActual("@/lib/telemetry/observability"),
        telemetry: {
          subscribe: (cb: Function) => {
            telemetryMock(cb);
          },
        },
      }));

      render(
        <QueryClientProvider client={new QueryClient()}>
          <SessionProvider>
            <WorkflowDetailPage params={{ id: "123" }} />
          </SessionProvider>
        </QueryClientProvider>
      );

      // Should emit page_view for this page
      expect(telemetryMock).toHaveBeenCalled();
    });

    it("emits action telemetry on button click", async () => {
      const telemetryMock = vi.fn();

      render(
        <QueryClientProvider client={new QueryClient()}>
          <SessionProvider>
            <WorkflowDetailPage params={{ id: "123" }} />
          </SessionProvider>
        </QueryClientProvider>
      );

      const editButton = screen.getByLabelText(/Edit workflow/i);
      fireEvent.click(editButton);

      // Should emit action event for click
      await waitFor(() => {
        expect(telemetryMock).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "action_click",
            action: "edit",
          })
        );
      });
    });
  });

  // ===== TYPE SAFETY =====
  describe("TypeScript Compliance", () => {
    it("has fully typed props", () => {
      const props = { params: { id: "123" } };
      // TypeScript compiler will error if props don't match PageProps
      <WorkflowDetailPage {...props} />;
    });

    it("has typed API responses", async () => {
      // This should not have any TypeScript errors
      const data = await fetch("/api/workflows/123").then((r) => r.json());
      const workflow: WorkflowDTO = data; // Type-safe assignment
    });
  });
});
```

---

## Summary: Checklist for Each Component

Before marking a component as production-ready, verify:

- [ ] **Async States**: Handles loading → success/empty/error/forbidden states
- [ ] **RBAC**: All mutation buttons wrapped with `GuardedAction` orpermission hooks
- [ ] **Types**: End-to-end typed (request/response from feature modules)
- [ ] **A11y**: Keyboard navigation, ARIA labels, screen reader announcements
- [ ] **Observability**: Major actions tracked; telemetry events emitted
- [ ] **Testing**: Tests cover all above DoD criteria
- [ ] **No Console Errors**: Clean console output (no warnings/errors)
- [ ] **Error Recovery**: Users can recover from errors (retry, go back, etc.)

Use this guide to audit and update each component systematically.
