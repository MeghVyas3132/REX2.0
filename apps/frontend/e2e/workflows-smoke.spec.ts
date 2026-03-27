import { expect, test } from "@playwright/test";

test.describe("workflows page smoke", () => {
  test.beforeEach(async ({ page }) => {
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
              id: "u_1",
              email: "admin@rex.dev",
              name: "Admin",
              role: "admin",
              globalRole: "super_admin",
              tenantId: "t_1",
              tenantRole: "org_admin",
            },
          },
        }),
      });
    });

    await page.route("**/api/workflows**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            data: [
              { id: "wf_1", name: "Workflow One", status: "active", version: 1 },
              { id: "wf_2", name: "Workflow Two", status: "draft", version: 2 },
            ],
            meta: { total: 2, page: 1, limit: 20 },
          },
        }),
      });
    });
  });

  test("loads list page shell and renders heading", async ({ page }) => {
    await page.goto("/workflows");
    await expect(page.getByRole("heading", { name: "Workflows" })).toBeVisible();
  });

  test("shows filter controls", async ({ page }) => {
    await page.goto("/workflows");
    await expect(page.getByPlaceholder("Search workflows by name...")).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible();
  });
});
