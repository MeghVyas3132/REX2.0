import { describe, expect, it } from "vitest";

import {
  canAccessAdmin,
  canEdit,
  canManageTenant,
  canOperateWorkflows,
  getAppRole,
  hasAnyRole,
  hasRole,
} from "@/lib/rbac/permissions";
import type { AuthUser } from "@/lib/api/types";

function makeUser(overrides: Partial<AuthUser>): AuthUser {
  return {
    id: "u1",
    email: "a@b.com",
    name: "A",
    role: "viewer",
    globalRole: "user",
    tenantId: "t1",
    tenantRole: "org_viewer",
    ...overrides,
  };
}

describe("rbac permissions", () => {
  it("maps user to app roles", () => {
    expect(getAppRole(makeUser({ globalRole: "super_admin" }))).toBe("super_admin");
    expect(getAppRole(makeUser({ tenantRole: "org_admin" }))).toBe("org_admin");
    expect(getAppRole(makeUser({ tenantRole: "org_editor" }))).toBe("org_editor");
    expect(getAppRole(makeUser({ tenantRole: "org_viewer" }))).toBe("org_viewer");
  });

  it("checks admin and edit permissions", () => {
    expect(canAccessAdmin(makeUser({ globalRole: "super_admin" }))).toBe(true);
    expect(canAccessAdmin(makeUser({ globalRole: "user" }))).toBe(false);

    expect(canEdit(makeUser({ tenantRole: "org_admin" }))).toBe(true);
    expect(canEdit(makeUser({ tenantRole: "org_editor" }))).toBe(true);
    expect(canEdit(makeUser({ tenantRole: "org_viewer" }))).toBe(false);
  });

  it("supports hasRole and hasAnyRole checks", () => {
    const editor = makeUser({ tenantRole: "org_editor" });
    expect(hasRole(editor, "org_editor")).toBe(true);
    expect(hasAnyRole(editor, ["org_admin", "org_editor"])).toBe(true);
    expect(hasAnyRole(editor, ["org_admin"])).toBe(false);
  });

  it("exposes route-level capability helpers", () => {
    const admin = makeUser({ tenantRole: "org_admin" });
    const editor = makeUser({ tenantRole: "org_editor" });
    const viewer = makeUser({ tenantRole: "org_viewer" });

    expect(canManageTenant(admin)).toBe(true);
    expect(canManageTenant(editor)).toBe(false);

    expect(canOperateWorkflows(admin)).toBe(true);
    expect(canOperateWorkflows(editor)).toBe(true);
    expect(canOperateWorkflows(viewer)).toBe(false);
  });
});
