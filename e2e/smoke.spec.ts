import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test("home page loads and is axe-clean", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("main")).toBeVisible();
  await expectNoAxeViolations(page);
});
