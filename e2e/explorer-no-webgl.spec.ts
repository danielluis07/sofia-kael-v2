import { expect, test } from "@playwright/test";

// A file of its own: launch options force a new browser (ADR 0006 "Browser support").
test.use({ launchOptions: { args: ["--disable-webgl", "--disable-webgl2"] } });

test("without WebGL the stage stays on the line drawing and the text description, with no error", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  let glbRequested = false;
  page.on("request", (request) => {
    if (request.url().endsWith("/models/brain.glb")) glbRequested = true;
  });

  await page.goto("/");
  await page.locator("#brain-explorer").scrollIntoViewIfNeeded();
  const stage = page.locator("[data-specimen]");
  await expect(stage).toHaveAttribute("data-specimen", "fallback");
  await expect(stage.locator("svg")).toBeVisible();
  await expect(
    page.getByText("Explore the brain using the Structure index. Each Structure has a description and a list of related Conditions."),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: /^An interactive three-dimensional brain\./ })).toBeAttached();
  await expect(page.locator("#brain-explorer canvas")).toHaveCount(0);
  expect(glbRequested).toBe(false);
  expect(errors).toEqual([]);
});
