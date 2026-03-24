import { expect, test } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

type SeedUser = {
  email: string;
  password: string;
  expectsAdminAccess: boolean;
};

const users: SeedUser[] = [
  { email: "admin@rex.dev", password: "demo1234", expectsAdminAccess: true },
  { email: "studio@rex.dev", password: "demo1234", expectsAdminAccess: false },
  { email: "business@rex.dev", password: "demo1234", expectsAdminAccess: false },
];

async function signIn(page: import("@playwright/test").Page, user: SeedUser) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.locator("form .auth-submit").click();
  await page.waitForURL(/\/dashboard$/, { timeout: 15000 });
}

async function assertRouteLoads(page: import("@playwright/test").Page, route: string, heading: string) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: heading })).toBeVisible({ timeout: 15000 });
}

test.describe("Role-based smoke coverage", () => {
  for (const user of users) {
    test(`seeded user ${user.email} route checks`, async ({ page }) => {
      await signIn(page, user);

      await assertRouteLoads(page, "/studio", "Studio Dashboard");
      await assertRouteLoads(page, "/business", "Run automations without writing code.");
      await assertRouteLoads(page, "/admin", "Global Admin Command Deck");

      const forbidden = page.getByText("Super admin access required");
      if (user.expectsAdminAccess) {
        await expect(forbidden).toHaveCount(0);
      } else {
        await expect(forbidden).toBeVisible();
      }
    });
  }
});
