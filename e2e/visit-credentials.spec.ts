import { expect, test } from "@playwright/test";
import { FIRST_VISIT, CREDENTIALS } from "../content/site";
import { expectNoAxeViolations } from "./axe";

test.describe("First visit and Credentials without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the visit is the only numbered sequence and all credential details are readable", async ({ page }) => {
    await page.goto("/");
    const visit = page.getByRole("region", { name: FIRST_VISIT.headline });
    await expect(page.locator("main ol")).toHaveCount(1);
    await expect(visit.getByRole("listitem")).toHaveCount(4);
    await expect(visit.getByRole("heading", { level: 3 })).toHaveText(FIRST_VISIT.steps.map((step) => step.title));
    for (const step of FIRST_VISIT.steps) await expect(visit.getByText(step.body, { exact: true })).toBeVisible();

    const credentials = page.getByRole("region", { name: CREDENTIALS.headline });
    for (const entry of CREDENTIALS.training) {
      await expect(credentials.getByText(entry.years, { exact: true })).toBeVisible();
      await expect(credentials.getByText(entry.text, { exact: true })).toBeVisible();
    }
    for (const publication of CREDENTIALS.publications) {
      await expect(credentials.getByRole("heading", { name: publication.title })).toBeVisible();
      await expect(credentials.getByText(publication.venue, { exact: true })).toBeVisible();
      await expect(credentials.getByText(publication.year, { exact: true })).toBeVisible();
    }
  });
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 375, height: 812 }]) {
  test.describe(`First visit and Credentials at ${viewport.width}px`, () => {
    test.use({ viewport, reducedMotion: "reduce" });

    test("layouts fit and are axe-clean", async ({ page }) => {
      await page.goto("/");
      const visit = page.getByRole("region", { name: FIRST_VISIT.headline });
      const credentials = page.getByRole("region", { name: CREDENTIALS.headline });
      await visit.scrollIntoViewIfNeeded();
      await expectNoAxeViolations(page);
      await credentials.scrollIntoViewIfNeeded();
      await expectNoAxeViolations(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);

      const training = await credentials.getByRole("list").nth(0).boundingBox();
      const publications = await credentials.getByRole("list").nth(1).boundingBox();
      expect(training).not.toBeNull();
      expect(publications).not.toBeNull();
      if (viewport.width >= 768) {
        expect(publications!.x).toBeGreaterThan(training!.x + training!.width);
        const steps = await visit.getByRole("list").boundingBox();
        const section = await visit.boundingBox();
        expect(steps!.x + steps!.width).toBeLessThan(section!.x + section!.width * 0.65);
      } else {
        expect(publications!.y).toBeGreaterThan(training!.y + training!.height);
      }
    });
  });
}
