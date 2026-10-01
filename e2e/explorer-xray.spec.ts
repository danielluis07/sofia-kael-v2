import { expect, test, type Page } from "@playwright/test";

// The toggle needs no specimen: the GLB is held back, as in explorer.spec.ts.
const GLB = "**/models/brain.glb";

const stage = (page: Page) => page.locator("[data-specimen]");
const rail = (page: Page) => page.getByRole("group", { name: "Ferramentas" });
const xray = (page: Page) => rail(page).getByRole("button", { name: "Raio X" });
const index = (page: Page) => page.getByRole("list", { name: "Índice de estruturas" });

/** Loads `url` and waits until the Explorer is hydrated. */
async function open(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator("html")).toHaveAttribute("data-explorer-jumps");
}

test.beforeEach(async ({ page }) => {
  await page.route(GLB, () => {});
});

test("X-ray toggles with aria-pressed, without a Focus, and counts as the first interaction", async ({ page }) => {
  await open(page, "/#brain-explorer");
  await expect(stage(page)).toHaveAttribute("data-idle", "rotating");
  await expect(xray(page)).toHaveAttribute("aria-pressed", "false");
  await expect(xray(page)).not.toHaveAttribute("aria-disabled");

  await xray(page).click();
  await expect(xray(page)).toHaveAttribute("aria-pressed", "true");
  await expect(stage(page)).toHaveAttribute("data-idle", "still");
  await expect(page).toHaveURL(/\/#brain-explorer$/);

  await xray(page).click();
  await expect(xray(page)).toHaveAttribute("aria-pressed", "false");
});

test("the keyboard toggles it, and the cortex stays reachable through the Structure index", async ({ page }) => {
  await open(page, "/#brain-explorer");
  await xray(page).focus();
  await page.keyboard.press("Enter");
  await expect(xray(page)).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(xray(page)).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Space");

  await index(page).getByRole("button", { name: "Lobo frontal" }).click();
  await expect(page.getByRole("complementary", { name: "Lobo frontal" })).toBeVisible();
  await expect(page).toHaveURL(/\?structure=frontal-lobe#brain-explorer$/);
  await expect(xray(page)).toHaveAttribute("aria-pressed", "true");
});

test("clearing the Focus keeps X-ray on; Reset turns it off", async ({ page }) => {
  await open(page, "/?structure=thalamus#brain-explorer");
  await xray(page).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await expect(xray(page)).toHaveAttribute("aria-pressed", "true");

  await rail(page).getByRole("button", { name: "Redefinir" }).click();
  await expect(xray(page)).toHaveAttribute("aria-pressed", "false");
});

test("the cross-fade takes --dur-slow", async ({ page }) => {
  await open(page, "/#brain-explorer");
  await expect(stage(page)).toHaveAttribute("data-xray-ms", "700");
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the cross-fade is a cut", async ({ page }) => {
    await open(page, "/#brain-explorer");
    await expect(stage(page)).toHaveAttribute("data-xray-ms", "0");
  });
});
