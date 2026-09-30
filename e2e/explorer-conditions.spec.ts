import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

// None of this needs the specimen: the GLB is held back, as in explorer.spec.ts.
const GLB = "**/models/brain.glb";

const panel = (page: Page, name: string) => page.getByRole("complementary", { name });
const rail = (page: Page) => page.getByRole("group", { name: "Tools" });
const row = (page: Page, id: string) => page.locator(`#condition-${id}`);
const entries = (page: Page) => page.evaluate(() => history.length);

/** Loads `url` and waits until the Explorer intercepts its links: before that, they are plain links. */
async function open(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator("html")).toHaveAttribute("data-explorer-jumps");
}

function collectPageErrors(page: Page) {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.route(GLB, () => {});
});

test.describe("the Conditions section", () => {
  test("is an index of rows, each with its Structures and a link into the brain", async ({ page }) => {
    await open(page, "/");
    const rows = page.locator("#conditions li[id^='condition-']");
    await expect(rows).toHaveCount(10);
    const epilepsy = row(page, "temporal-lobe-epilepsy");
    await expect(epilepsy.getByRole("heading", { level: 3 })).toHaveText("Epilepsy (temporal lobe)");
    await expect(epilepsy).toContainText("Recurring seizures starting in the temporal lobe");
    const structures = epilepsy.getByRole("list", { name: "Structures" });
    await expect(structures).toHaveText("Hippocampus · Temporal lobe · Amygdala");
    await expect(structures.getByRole("listitem")).toHaveCount(3);
    const link = epilepsy.getByRole("link", { name: "See it in the brain", exact: true });
    await expect(link).toHaveAttribute("href", "?condition=temporal-lobe-epilepsy#brain-explorer");
    await expect(link).toHaveAccessibleDescription("Epilepsy (temporal lobe)");
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("the rows are all there, and the link is a plain deep link", async ({ page }) => {
      await page.goto("/");
      await expect(row(page, "vertigo")).toBeVisible();
      await expect(row(page, "vertigo").getByRole("link")).toHaveAttribute("href", "?condition=vertigo#brain-explorer");
    });
  });
});

test.describe("See it in the brain", () => {
  test("focuses the Condition in the Explorer, isolated; Back returns to the row with no Focus", async ({ page }) => {
    const errors = collectPageErrors(page);
    await open(page, "/#conditions");
    const before = await entries(page);
    await row(page, "migraine").getByRole("link").click();

    await expect(page).toHaveURL(/\/\?condition=migraine#brain-explorer$/);
    const migraine = panel(page, "Migraine");
    await expect(migraine).toBeVisible();
    await expect(migraine.getByText(/^Migraine causes recurring attacks/)).toBeVisible();
    await expect(migraine.getByRole("listitem")).toHaveText(["Occipital lobe→", "Thalamus→", "Pons→"]);
    await expect(rail(page).getByRole("button", { name: "Isolate" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#brain-explorer")).toBeInViewport();
    expect(await entries(page)).toBe(before + 1);

    await page.goBack();
    await expect(page).toHaveURL(/\/#conditions$/);
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(rail(page).getByRole("button", { name: "Isolate" })).toHaveAttribute("aria-pressed", "false");
    await expect(row(page, "migraine")).toBeInViewport();

    // Forward brings the Condition back.
    await page.goForward();
    await expect(page).toHaveURL(/\/\?condition=migraine#brain-explorer$/);
    await expect(panel(page, "Migraine")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("from the keyboard, keyboard focus lands on the Condition panel's heading", async ({ page }) => {
    await open(page, "/#conditions");
    await row(page, "ataxia").getByRole("link").focus();
    await page.keyboard.press("Enter");
    await expect(panel(page, "Ataxia").getByRole("heading", { name: "Ataxia" })).toBeFocused();
  });

  test("Back restores the previous Focus exactly", async ({ page }) => {
    await open(page, "/?structure=hippocampus#brain-explorer");
    await panel(page, "Hippocampus").getByRole("link", { name: "Alzheimer's disease" }).click();
    await expect(page).toHaveURL(/\/\?structure=hippocampus#condition-alzheimers-disease$/);
    await row(page, "alzheimers-disease").getByRole("link").click();
    await expect(panel(page, "Alzheimer's disease")).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/\?structure=hippocampus#condition-alzheimers-disease$/);
    await expect(panel(page, "Hippocampus")).toBeVisible();
    await expect(rail(page).getByRole("button", { name: "Isolate" })).toHaveAttribute("aria-pressed", "false");

    await page.goBack();
    await expect(page).toHaveURL(/\/\?structure=hippocampus#brain-explorer$/);
    await expect(panel(page, "Hippocampus")).toBeVisible();
  });
});

test.describe("a Condition chip", () => {
  test("jumps to its row, keeping the Focus; Back returns to the Explorer", async ({ page }) => {
    const errors = collectPageErrors(page);
    await open(page, "/?structure=pons#brain-explorer");
    const before = await entries(page);
    await panel(page, "Pons").getByRole("link", { name: "Vertigo" }).click();

    await expect(page).toHaveURL(/\/\?structure=pons#condition-vertigo$/);
    await expect(row(page, "vertigo")).toBeFocused();
    await expect(row(page, "vertigo")).toBeInViewport();
    expect(await entries(page)).toBe(before + 1);

    await page.goBack();
    await expect(page).toHaveURL(/\/\?structure=pons#brain-explorer$/);
    await expect(panel(page, "Pons")).toBeVisible();
    await expect(page.locator("#brain-explorer")).toBeInViewport();
    expect(errors).toEqual([]);
  });
});

test.describe("?condition=", () => {
  test("opens the Condition panel on load, isolated, before the specimen", async ({ page }) => {
    await open(page, "/?condition=parkinsons-disease#brain-explorer");
    await expect(panel(page, "Parkinson's disease")).toBeVisible();
    await expect(page.locator("[data-specimen]")).not.toHaveAttribute("data-specimen", "ready");
    await expect(rail(page).getByRole("button", { name: "Isolate" })).toHaveAttribute("aria-pressed", "true");
  });

  test("wins over ?structure=, which is dropped", async ({ page }) => {
    await open(page, "/?structure=pons&condition=ataxia#brain-explorer");
    await expect(panel(page, "Ataxia")).toBeVisible();
    await expect(page).toHaveURL(/\/\?condition=ataxia#brain-explorer$/);
  });

  test("an unknown id is dropped from the URL, silently", async ({ page }) => {
    const errors = collectPageErrors(page);
    await open(page, "/?condition=gout#brain-explorer");
    await expect(page).toHaveURL(/\/#brain-explorer$/);
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await open(page, "/?condition=gout&structure=pons#brain-explorer");
    await expect(panel(page, "Pons")).toBeVisible();
    await expect(page).toHaveURL(/\/\?structure=pons#brain-explorer$/);
    expect(errors).toEqual([]);
  });
});

test.describe("the Condition panel", () => {
  test("a Structure row selects it, with a back link to the Condition; neither adds history", async ({ page }) => {
    await open(page, "/?condition=parkinsons-disease#brain-explorer");
    const before = await entries(page);
    await panel(page, "Parkinson's disease").getByRole("button", { name: "Substantia nigra" }).click();

    const nigra = panel(page, "Substantia nigra");
    await expect(nigra).toBeVisible();
    await expect(page).toHaveURL(/\/\?structure=substantia-nigra#brain-explorer$/);
    await expect(nigra.getByRole("heading", { name: "Substantia nigra" })).toBeFocused();
    // Isolate carries over to the Structure.
    await expect(nigra.getByRole("button", { name: "Isolate" })).toHaveAttribute("aria-pressed", "true");

    await nigra.getByRole("link", { name: "Back to Parkinson's disease" }).click();
    await expect(panel(page, "Parkinson's disease")).toBeVisible();
    await expect(page).toHaveURL(/\/\?condition=parkinsons-disease#brain-explorer$/);
    expect(await entries(page)).toBe(before);
  });

  test("the back link is gone after a reload: `via` never enters the URL", async ({ page }) => {
    await open(page, "/?condition=vertigo#brain-explorer");
    await panel(page, "Vertigo").getByRole("button", { name: "Pons" }).click();
    await expect(panel(page, "Pons").getByRole("link", { name: "Back to Vertigo" })).toBeVisible();
    await page.reload();
    await expect(panel(page, "Pons")).toBeVisible();
    await expect(panel(page, "Pons").getByRole("link", { name: "Back to Vertigo" })).toHaveCount(0);
  });

  test("Clear returns to free exploration", async ({ page }) => {
    await open(page, "/?condition=stroke#brain-explorer");
    await panel(page, "Stroke").getByRole("button", { name: "Clear" }).click();
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(page).toHaveURL(/\/#brain-explorer$/);
    const isolate = rail(page).getByRole("button", { name: "Isolate" });
    await expect(isolate).toHaveAttribute("aria-pressed", "false");
    await expect(isolate).toHaveAttribute("aria-disabled", "true");
  });

  test("Esc clears a Condition focus too", async ({ page }) => {
    await open(page, "/?condition=stroke#brain-explorer");
    await panel(page, "Stroke").getByRole("button", { name: "Precentral gyrus" }).focus();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(page).toHaveURL(/\/#brain-explorer$/);
  });
});

test.describe("the tool rail", () => {
  test("Isolate is aria-disabled without a Focus, then toggles with aria-pressed, in step with the panel's", async ({ page }) => {
    await open(page, "/#brain-explorer");
    const isolate = rail(page).getByRole("button", { name: "Isolate" });
    await expect(isolate).toHaveAttribute("aria-disabled", "true");
    await expect(isolate).toHaveAttribute("aria-pressed", "false");
    // Playwright won't click an aria-disabled button unforced; a Visitor can, and nothing happens.
    await isolate.click({ force: true });
    await expect(isolate).toHaveAttribute("aria-pressed", "false");

    await page.getByRole("list", { name: "Structure index" }).getByRole("button", { name: "Thalamus", exact: true }).click();
    await expect(isolate).not.toHaveAttribute("aria-disabled");
    await isolate.click();
    await expect(isolate).toHaveAttribute("aria-pressed", "true");
    const panelIsolate = panel(page, "Thalamus").getByRole("button", { name: "Isolate" });
    await expect(panelIsolate).toHaveAttribute("aria-pressed", "true");
    await panelIsolate.click();
    await expect(isolate).toHaveAttribute("aria-pressed", "false");
  });

  test("Reset returns everything to the start, but the idle rotation never comes back", async ({ page }) => {
    await open(page, "/#brain-explorer");
    const stage = page.locator("[data-specimen]");
    await expect(stage).toHaveAttribute("data-idle", "rotating");
    const reset = rail(page).getByRole("button", { name: "Reset" });
    await expect(reset).not.toHaveAttribute("aria-pressed");
    // Reset as the very first interaction still counts as one.
    await reset.click();
    await expect(stage).toHaveAttribute("data-idle", "still");

    await page.getByRole("list", { name: "Structure index" }).getByRole("button", { name: "Pons" }).click();
    await rail(page).getByRole("button", { name: "Isolate" }).click();
    await reset.click();
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(page).toHaveURL(/\/#brain-explorer$/);
    await expect(rail(page).getByRole("button", { name: "Isolate" })).toHaveAttribute("aria-pressed", "false");
    await expect(stage).toHaveAttribute("data-idle", "still");
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("is axe-clean with a Condition focus", async ({ page }) => {
    await open(page, "/?condition=temporal-lobe-epilepsy#brain-explorer");
    await expect(panel(page, "Epilepsy (temporal lobe)")).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
