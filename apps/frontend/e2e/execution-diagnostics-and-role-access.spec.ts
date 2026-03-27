import { expect, test } from "@playwright/test";

test.describe("execution diagnostics and role enforcement", () => {
  test("org_viewer sees execution diagnostics but cannot stop", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("rex_token", "test-token");
    });

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: "u_viewer",
              email: "viewer@rex.dev",
              name: "Viewer",
              role: "viewer",
              globalRole: "user",
              tenantId: "t_1",
              tenantRole: "org_viewer",
            },
          },
        }),
      });
    });

    await page.route("**/api/executions/**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "[executionId]",
            workflowId: "wf_1",
            status: "running",
            startedAt: "2026-01-01T00:00:00.000Z",
            completedAt: null,
            stepsTotal: 12,
            stepsCompleted: 6,
          },
        }),
      });
    });

    await page.goto("/executions/%5BexecutionId%5D");

    await expect(page.getByRole("heading", { name: "Execution [executionId]" })).toBeVisible();
    await expect(page.getByText("Progress: 6/12 (50%)")).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop Execution" })).toHaveCount(0);
  });

  test("org_admin can access stop control on running execution", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("rex_token", "test-token");
    });

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: "u_admin",
              email: "admin@rex.dev",
              name: "Admin",
              role: "admin",
              globalRole: "user",
              tenantId: "t_1",
              tenantRole: "org_admin",
            },
          },
        }),
      });
    });

    await page.route("**/api/executions/**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "[executionId]",
            workflowId: "wf_2",
            status: "running",
            startedAt: "2026-01-01T00:00:00.000Z",
            completedAt: null,
            stepsTotal: 8,
            stepsCompleted: 3,
          },
        }),
      });
    });

    await page.goto("/executions/%5BexecutionId%5D");

    await expect(page.getByRole("heading", { name: "Execution [executionId]" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop Execution" })).toBeVisible();
  });
});
