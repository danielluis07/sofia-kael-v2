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
  await expect(stage.getByTestId("specimen-outline")).toBeVisible();
  await expect(
    page.getByText("Explore the brain using the Structure index. Each Structure has a description and a list of related Conditions."),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: /^An interactive three-dimensional brain\./ })).toBeAttached();
  await expect(page.locator("#brain-explorer canvas")).toHaveCount(0);
  expect(glbRequested).toBe(false);
  expect(errors).toEqual([]);
});

test("without WebGL the Structure index and panel still work as text, and ?structure= opens the right panel", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.goto("/?structure=pons#brain-explorer");
  await expect(page.locator("[data-specimen]")).toHaveAttribute("data-specimen", "fallback");
  await expect(page.getByRole("complementary", { name: "Pons" })).toBeVisible();

  const index = page.getByRole("list", { name: "Structure index" });
  await index.getByRole("button", { name: "Cerebellum" }).click();
  const cerebellum = page.getByRole("complementary", { name: "Cerebellum" });
  await expect(cerebellum).toBeVisible();
  await expect(cerebellum.getByRole("link")).toHaveText(["Essential tremor", "Ataxia", "Vertigo"]);
  await expect(page).toHaveURL(/\/\?structure=cerebellum#brain-explorer$/);
  expect(errors).toEqual([]);
});

test("without WebGL ?condition= opens the Condition panel, with no tool rail", async ({ page }) => {
  await page.goto("/?condition=vertigo#brain-explorer");
  await expect(page.locator("[data-specimen]")).toHaveAttribute("data-specimen", "fallback");
  await expect(page.getByRole("complementary", { name: "Vertigo" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Tools" })).toHaveCount(0);
});
