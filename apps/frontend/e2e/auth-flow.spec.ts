import { expect, test } from "@playwright/test";

test.describe("auth flow", () => {
  test("renders login page and validates required fields", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("submits login form and redirects to dashboard", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            token: "test-token",
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

    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@rex.dev");
    await page.getByLabel("Password").fill("demo1234");
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
