import { expect, test, type Page } from "@playwright/test";

// The toggle needs no specimen: the GLB is held back, as in explorer.spec.ts.
const GLB = "**/models/brain.glb";

const stage = (page: Page) => page.locator("[data-specimen]");
const rail = (page: Page) => page.getByRole("group", { name: "Tools" });
const tool = (page: Page, name: string) => rail(page).getByRole("button", { name });

/** Loads `url` and waits until the Explorer is hydrated. */
async function open(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator("html")).toHaveAttribute("data-explorer-jumps");
}

test.beforeEach(async ({ page }) => {
  await page.route(GLB, () => {});
});

test("Split toggles with aria-pressed, without a Focus, and counts as the first interaction", async ({ page }) => {
  await open(page, "/#brain-explorer");
  await expect(stage(page)).toHaveAttribute("data-idle", "rotating");
  await expect(tool(page, "Split")).toHaveAttribute("aria-pressed", "false");
  await expect(tool(page, "Split")).not.toHaveAttribute("aria-disabled");

  await tool(page, "Split").click();
  await expect(tool(page, "Split")).toHaveAttribute("aria-pressed", "true");
  await expect(stage(page)).toHaveAttribute("data-idle", "still");
  await expect(page).toHaveURL(/\/#brain-explorer$/);

  await tool(page, "Split").click();
  await expect(tool(page, "Split")).toHaveAttribute("aria-pressed", "false");
});

test("the keyboard toggles it, and it combines with X-ray, a Focus and Isolate", async ({ page }) => {
  await open(page, "/?structure=corpus-callosum#brain-explorer");
  await tool(page, "Split").focus();
  await page.keyboard.press("Enter");
  await expect(tool(page, "Split")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(tool(page, "Split")).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Space");

  await tool(page, "X-ray").click();
  await tool(page, "Isolate").click();
  for (const name of ["Split", "X-ray", "Isolate"]) await expect(tool(page, name)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("complementary", { name: "Corpus callosum" })).toBeVisible();
});

test("clearing the Focus keeps Split on; Reset turns it off", async ({ page }) => {
  await open(page, "/?structure=thalamus#brain-explorer");
  await tool(page, "Split").click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await expect(tool(page, "Split")).toHaveAttribute("aria-pressed", "true");

  await tool(page, "Reset").click();
  await expect(tool(page, "Split")).toHaveAttribute("aria-pressed", "false");
});

test("the halves slide over --dur-camera", async ({ page }) => {
  await open(page, "/#brain-explorer");
  await expect(stage(page)).toHaveAttribute("data-camera-ms", "900");
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the slide is a cut", async ({ page }) => {
    await open(page, "/#brain-explorer");
    await expect(stage(page)).toHaveAttribute("data-camera-ms", "0");
  });
});
