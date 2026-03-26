# DoD QUICK REFERENCE CARD

## 🚀 Use This When Building New Components

---

### 1️⃣ LIST PAGE TEMPLATE

```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { ListPageWrapper } from "@/components/ui/ListPageWrapper";
import { DataTable } from "@/components/ui/DataTable";
import { useTelemetryPageView } from "@/lib/telemetry/observability";

export default function ResourceListPage({ searchParams }) {
  useTelemetryPageView("resource-list");
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["resources", searchParams],
    queryFn: () => fetch("/api/resources").then(r => r.json()),
  });

  return (
    <ListPageWrapper
      title="Resources"
      isLoading={isLoading}
      isError={isError}
      isEmpty={data?.items?.length === 0}
      error={error?.message}
      filters={<ResourceFilters />}
      current={parseInt(searchParams.page || "1")}
      total={data?.totalPages || 1}
    >
      <DataTable columns={columns} data={data?.items || []} />
    </ListPageWrapper>
  );
}
```

---

### 2️⃣ DETAIL PAGE TEMPLATE

```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { ProductionAsyncStateView } from "@/components/ui/ProductionAsyncStateView";
import { DetailPageHeader } from "@/components/ui/DetailPageHeader";
import { useSession } from "@/lib/auth/session-context";
import { canEdit } from "@/lib/rbac/permissions";
import { useTelemetryPageView } from "@/lib/telemetry/observability";

export default function ResourceDetailPage({ params }) {
  useTelemetryPageView("resource-detail", { id: params.id });
  const { user } = useSession();

  const { data: resource, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["resource", params.id],
    queryFn: () => fetch(`/api/resources/${params.id}`).then(r => r.json()),
  });

  const state = isLoading ? "loading" 
    : isError ? "error"
    : !canEdit(user) ? "forbidden"
    : resource ? "success" : "empty";

  return (
    <ProductionAsyncStateView state={state} error={error?.message} onRetry={refetch}>
      {resource && (
        <>
          <DetailPageHeader
            title={resource.name}
            actions={[
              { id: "edit", label: "Edit", requiresPermission: "org_editor" },
              { id: "delete", label: "Delete", requiresPermission: "org_admin" },
            ]}
          />
          <ResourceContent resource={resource} />
        </>
      )}
    </ProductionAsyncStateView>
  );
}
```

---

### 3️⃣ PROTECTED ACTION BUTTON

```typescript
import { GuardedAction } from "@/lib/rbac/production-rbac";
import { useSession } from "@/lib/auth/session-context";

export function DeleteButton({ resourceId, resourceName }) {
  const { user } = useSession();

  return (
    <GuardedAction
      user={user}
      requiredRole="org_admin"
      fallback={<button disabled>Delete (Admin only)</button>}
    >
      <button
        onClick={() => deleteResource(resourceId)}
        aria-label={`Delete ${resourceName}`}
      >
        Delete
      </button>
    </GuardedAction>
  );
}
```

---

### 4️⃣ PROTECTED MUTATION

```typescript
import { useProductionMutation } from "@/hooks/useProductionMutation";

export function useDeleteResource() {
  return useProductionMutation({
    action: "delete",
    resourceType: "resource",
    requiredRole: "org_admin", // ← Enforced before mutation
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      // Telemetry automatically tracked ✅
      // Permission checked automatically ✅
      // Error logged automatically ✅
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}
```

---

### 5️⃣ ACCESSIBLE INTERACTIVE COMPONENT

```typescript
import { useFocusTrap, keyboard } from "@/lib/a11y/accessibility";
import { ScreenReaderAnnouncement } from "@/lib/a11y/accessibility";

export function Modal({ isOpen, onClose, children }) {
  const containerRef = useFocusTrap(isOpen);
  const [announcement, setAnnouncement] = React.useState("");

  return (
    <>
      <ScreenReaderAnnouncement message={announcement} />
      
      {isOpen && (
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="title"
          onKeyDown={(e) => keyboard.isEscape(e) && onClose()}
        >
          <h2 id="title">Modal Title</h2>
          {children}
          <button onClick={onClose} aria-label="Close modal">
            Close
          </button>
        </div>
      )}
    </>
  );
}
```

---

### 6️⃣ PROPERLY TYPED API

```typescript
// features/resource/types.ts
export interface ResourceDTO {
  id: string; name: string; status: "active" | "inactive";
}
export interface GetResourcesResponse {
  items: ResourceDTO[]; total: number;
}

// features/resource/queries.ts
export const resourceQueries = {
  getAll: () => ({
    queryKey: ["resources"],
    queryFn: () => fetch("/api/resources").then(r => r.json() as Promise<GetResourcesResponse>),
  }),
};

// Component usage - fully typed ✅
const { data } = useQuery(resourceQueries.getAll());
data.items.forEach(r => console.log(r.id)); // ✅ TypeScript knows fields
```

---

### 7️⃣ TESTING CHECKLIST

```typescript
import { testProductionComponent } from "@/__tests__/dod-test-utilities";

testProductionComponent("ResourceDetail", {
  asyncStates: true,    // ✅ Tests loading/error/empty/forbidden
  rbac: true,          // ✅ Tests permission enforcement
  a11y: true,          // ✅ Tests keyboard/focus/ARIA
  typeCheck: true,     // ✅ Validates TypeScript types
  observability: true, // ✅ Tests telemetry events
  production: true,    // ✅ Tests error recovery, perf, edge cases
});
```

---

## 📋 DoD CHECKLIST FOR EACH COMPONENT

Before shipping any component, verify:

- [ ] **Async States**: Handles loading, success, empty, error, forbidden
- [ ] **RBAC**: All mutations wrapped with GuardedAction or permission hook
- [ ] **Types**: No `any` types; request/response typed from feature modules
- [ ] **Accessible**: Keyboard navigation works; ARIA labels present
- [ ] **Observed**: Major actions emit telemetry events
- [ ] **Tested**: Unit tests cover all above
- [ ] **No Errors**: TypeScript, linter, console all clean
- [ ] **Recoverable**: Users can retry on error, back navigate, cancel actions

---

## 🎯 COMMON PATTERNS

### Pattern: Async Query + Telemetry
```typescript
const { data, isLoading, isError, error } = useQuery({
  queryKey: ["resource"],
  queryFn: async () => {
    const res = await fetch("/api/resources");
    if (!res.ok) telemetry.trackQueryError("resource", res.statusText);
    return res.json();
  },
});
```

### Pattern: Permission-Gated Action
```typescript
const { canMutate, error: permError } = useMutationGuard(user, "org_admin");
if (!canMutate) return <button disabled>{permError}</button>;
return <button onClick={deleteAction}>Delete</button>;
```

### Pattern: Page View Tracking
```typescript
useTelemetryPageView("page-name", { contextMetadata });
```

### Pattern: Keyboard Shortcut
```typescript
const handleKeyDown = useKeyboardEvent("Delete", (e) => {
  deleteAction(); // Called when Delete key pressed
});
```

### Pattern: Focus Trap (Modal)
```typescript
const modalRef = useFocusTrap(isModalOpen);
return <div ref={modalRef} role="dialog">...</div>;
```

---

## 🚨 ANTI-PATTERNS TO AVOID

❌ **DON'T:**
```typescript
// Don't: Untyped API response
const data = await fetch("/api/resource").then(r => r.json()); // ❌ any type

// Don't: Unguarded mutation
<button onClick={() => deleteResource()}>Delete</button>; // ❌ No permission check

// Don't: No async state handling
{resource && <div>{resource.name}</div>} // ❌ No loading state

// Don't: Disabled buttons instead of permission gates
<button disabled={!canEdit(user)}>Edit</button> // ❌ Should use GuardedAction

// Don't: No telemetry
// ❌ User action not tracked
```

---

## ✅ DO:
```typescript
// Do: Typed API response
const { data }: { data: ResourceDTO } = useQuery(...); // ✅ Explicit type

// Do: Permission-guarded mutation
<GuardedAction user={user} requiredRole="admin">
  <button onClick={deleteResource}>Delete</button> // ✅ Guarded
</GuardedAction>

// Do: Proper async state handling
<ProductionAsyncStateView state={state} error={error}>
  {resource && <div>{resource.name}</div>}
</ProductionAsyncStateView>

// Do: Telemetry tracking
telemetryTracker.start(); // ✅ User action tracked
// ... mutation ...
telemetryTracker.success(startTime, metadata); // ✅ Duration captured

// Do: Meaningful ARIA labels
<button aria-label="Delete workflow Test-123">Delete</button> // ✅ Descriptive
```

---

## 📚 REFERENCE LINKS

- **Implementation Guide**: `PRODUCTION_DOD_IMPLEMENTATION_GUIDE.md`
- **Integration Setup**: `DOD_SYSTEM_INTEGRATION_SETUP.md`
- **Test Utilities**: `src/__tests__/dod-test-utilities.ts`
- **Compliance Audit**: `src/__tests__/dod-compliance-audit.ts`
- **Readiness Checklist**: `PRODUCTION_READINESS_CHECKLIST.md`

---

## 🤔 QUICK TROUBLESHOOTING

| Issue | Solution |
|---|---|
| "Type 'any' is not assignable to..." | Import typed queries from feature module instead of raw fetch |
| "Cannot read property of undefined" | Add proper async state handling with ProductionAsyncStateView |
| "Permission denied" button click | Wrap with GuardedAction; check user roles |
| "Button not focused" after modal | Use useFocusTrap to manage focus automatically |
| "Telemetry not sending" | Check TelemetryInitializer is in layout.tsx; verify API endpoint |
| Tests failing on accessibility | Add aria-labels and role attributes to interactive elements |

---

## 💡 PRO TIPS

1. **Use the convenience hooks**: `useProductionComponent()` and `useProductionMutation()` handle most boilerplate
2. **Copy-paste templates above**: Start with list/detail templates for fastest development
3. **Test as you build**: Use `testProductionComponent()` to auto-generate test suites
4. **Check types first**: Run `npm run type-check` before testing
5. **Monitor telemetry**: Use browser DevTools Network tab to see telemetry events in flight

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready ✅
