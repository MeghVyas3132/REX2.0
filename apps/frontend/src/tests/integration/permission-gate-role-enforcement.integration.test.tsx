import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PermissionGate } from "@/components/shared/PermissionGate";

describe("PermissionGate role enforcement integration", () => {
  it("blocks edit-only actions for org_viewer", () => {
    render(
      <PermissionGate
        user={{
          id: "u_viewer",
          email: "viewer@rex.dev",
          name: "Viewer",
          role: "viewer",
          globalRole: "user",
          tenantId: "t_1",
          tenantRole: "org_viewer",
        }}
        requireEdit
        fallback={<span>forbidden</span>}
      >
        <button type="button">Stop Execution</button>
      </PermissionGate>,
    );

    expect(screen.getByText("forbidden")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stop Execution" })).not.toBeInTheDocument();
  });

  it("allows edit-only actions for org_admin", () => {
    render(
      <PermissionGate
        user={{
          id: "u_admin",
          email: "admin@rex.dev",
          name: "Admin",
          role: "admin",
          globalRole: "user",
          tenantId: "t_1",
          tenantRole: "org_admin",
        }}
        requireEdit
        fallback={<span>forbidden</span>}
      >
        <button type="button">Stop Execution</button>
      </PermissionGate>,
    );

    expect(screen.queryByText("forbidden")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop Execution" })).toBeInTheDocument();
  });

  it("respects explicit role requirements", () => {
    render(
      <PermissionGate
        user={{
          id: "u_editor",
          email: "editor@rex.dev",
          name: "Editor",
          role: "editor",
          globalRole: "user",
          tenantId: "t_1",
          tenantRole: "org_editor",
        }}
        requireRoles={["super_admin"]}
        fallback={<span>super-admin-only</span>}
      >
        <button type="button">Admin Action</button>
      </PermissionGate>,
    );

    expect(screen.getByText("super-admin-only")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Admin Action" })).not.toBeInTheDocument();
  });
});
