import { expect, test } from "@playwright/test";

// Axe runs in page-shell.spec.ts, at rest under reduced motion.
test("home page loads", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("main")).toBeVisible();
});
