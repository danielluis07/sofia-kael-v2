import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

// None of this needs the specimen: the GLB is held back, as in explorer.spec.ts.
const GLB = "**/models/brain.glb";

const panel = (page: Page, name: string) => page.getByRole("complementary", { name });
const rail = (page: Page) => page.getByRole("group", { name: "Ferramentas" });
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
    await expect(epilepsy.getByRole("heading", { level: 3 })).toHaveText("Epilepsia do lobo temporal");
    await expect(epilepsy).toContainText("Crises recorrentes no lobo temporal");
    const structures = epilepsy.getByRole("list", { name: "Estruturas" });
    await expect(structures).toHaveText("Hipocampo · Lobo temporal · Amígdala");
    await expect(structures.getByRole("listitem")).toHaveCount(3);
    const link = epilepsy.getByRole("link", { name: "Veja no cérebro", exact: true });
    await expect(link).toHaveAttribute("href", "?condition=temporal-lobe-epilepsy#brain-explorer");
    await expect(link).toHaveAccessibleDescription("Epilepsia do lobo temporal");
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

test.describe("Veja no cérebro", () => {
  test("focuses the Condition in the Explorer, isolated; Back returns to the row with no Focus", async ({ page }) => {
    const errors = collectPageErrors(page);
    await open(page, "/#conditions");
    const before = await entries(page);
    await row(page, "migraine").getByRole("link").click();

    await expect(page).toHaveURL(/\/\?condition=migraine#brain-explorer$/);
    const migraine = panel(page, "Enxaqueca");
    await expect(migraine).toBeVisible();
    await expect(migraine.getByText(/^A enxaqueca causa crises recorrentes/)).toBeVisible();
    await expect(migraine.getByRole("listitem")).toHaveText(["Lobo occipital→", "Tálamo→", "Ponte→"]);
    await expect(rail(page).getByRole("button", { name: "Isolar" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#brain-explorer")).toBeInViewport();
    expect(await entries(page)).toBe(before + 1);

    await page.goBack();
    await expect(page).toHaveURL(/\/#conditions$/);
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(rail(page).getByRole("button", { name: "Isolar" })).toHaveAttribute("aria-pressed", "false");
    await expect(row(page, "migraine")).toBeInViewport();

    // Forward brings the Condition back.
    await page.goForward();
    await expect(page).toHaveURL(/\/\?condition=migraine#brain-explorer$/);
    await expect(panel(page, "Enxaqueca")).toBeVisible();
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
    await panel(page, "Hipocampo").getByRole("link", { name: "Doença de Alzheimer" }).click();
    await expect(page).toHaveURL(/\/\?structure=hippocampus#condition-alzheimers-disease$/);
    await row(page, "alzheimers-disease").getByRole("link").click();
    await expect(panel(page, "Doença de Alzheimer")).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/\?structure=hippocampus#condition-alzheimers-disease$/);
    await expect(panel(page, "Hipocampo")).toBeVisible();
    await expect(rail(page).getByRole("button", { name: "Isolar" })).toHaveAttribute("aria-pressed", "false");

    await page.goBack();
    await expect(page).toHaveURL(/\/\?structure=hippocampus#brain-explorer$/);
    await expect(panel(page, "Hipocampo")).toBeVisible();
  });
});

test.describe("a Condition chip", () => {
  test("jumps to its row, keeping the Focus; Back returns to the Explorer", async ({ page }) => {
    const errors = collectPageErrors(page);
    await open(page, "/?structure=pons#brain-explorer");
    const before = await entries(page);
    await panel(page, "Ponte").getByRole("link", { name: "Vertigem" }).click();

    await expect(page).toHaveURL(/\/\?structure=pons#condition-vertigo$/);
    await expect(row(page, "vertigo")).toBeFocused();
    await expect(row(page, "vertigo")).toBeInViewport();
    expect(await entries(page)).toBe(before + 1);

    await page.goBack();
    await expect(page).toHaveURL(/\/\?structure=pons#brain-explorer$/);
    await expect(panel(page, "Ponte")).toBeVisible();
    await expect(page.locator("#brain-explorer")).toBeInViewport();
    expect(errors).toEqual([]);
  });
});

test.describe("?condition=", () => {
  test("opens the Condition panel on load, isolated, before the specimen", async ({ page }) => {
    await open(page, "/?condition=parkinsons-disease#brain-explorer");
    await expect(panel(page, "Doença de Parkinson")).toBeVisible();
    await expect(page.locator("[data-specimen]")).not.toHaveAttribute("data-specimen", "ready");
    await expect(rail(page).getByRole("button", { name: "Isolar" })).toHaveAttribute("aria-pressed", "true");
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
    await expect(panel(page, "Ponte")).toBeVisible();
    await expect(page).toHaveURL(/\/\?structure=pons#brain-explorer$/);
    expect(errors).toEqual([]);
  });
});

test.describe("the Condition panel", () => {
  test("a Structure row selects it, with a back link to the Condition; neither adds history", async ({ page }) => {
    await open(page, "/?condition=parkinsons-disease#brain-explorer");
    const before = await entries(page);
    await panel(page, "Doença de Parkinson").getByRole("button", { name: "Substância negra" }).click();

    const nigra = panel(page, "Substância negra");
    await expect(nigra).toBeVisible();
    await expect(page).toHaveURL(/\/\?structure=substantia-nigra#brain-explorer$/);
    await expect(nigra.getByRole("heading", { name: "Substância negra" })).toBeFocused();
    // Isolate carries over to the Structure.
    await expect(nigra.getByRole("button", { name: "Isolar" })).toHaveAttribute("aria-pressed", "true");

    await nigra.getByRole("link", { name: "Voltar para Doença de Parkinson" }).click();
    await expect(panel(page, "Doença de Parkinson")).toBeVisible();
    await expect(page).toHaveURL(/\/\?condition=parkinsons-disease#brain-explorer$/);
    expect(await entries(page)).toBe(before);
  });

  test("the back link is gone after a reload: `via` never enters the URL", async ({ page }) => {
    await open(page, "/?condition=vertigo#brain-explorer");
    await panel(page, "Vertigem").getByRole("button", { name: "Ponte" }).click();
    await expect(panel(page, "Ponte").getByRole("link", { name: "Voltar para Vertigem" })).toBeVisible();
    await page.reload();
    await expect(panel(page, "Ponte")).toBeVisible();
    await expect(panel(page, "Ponte").getByRole("link", { name: "Voltar para Vertigem" })).toHaveCount(0);
  });

  test("Clear returns to free exploration", async ({ page }) => {
    await open(page, "/?condition=stroke#brain-explorer");
    await panel(page, "Acidente vascular cerebral (AVC)").getByRole("button", { name: "Limpar" }).click();
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(page).toHaveURL(/\/#brain-explorer$/);
    const isolate = rail(page).getByRole("button", { name: "Isolar" });
    await expect(isolate).toHaveAttribute("aria-pressed", "false");
    await expect(isolate).toHaveAttribute("aria-disabled", "true");
  });

  test("Esc clears a Condition focus too", async ({ page }) => {
    await open(page, "/?condition=stroke#brain-explorer");
    await panel(page, "Acidente vascular cerebral (AVC)").getByRole("button", { name: "Giro pré-central" }).focus();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(page).toHaveURL(/\/#brain-explorer$/);
  });
});

test.describe("the tool rail", () => {
  test("Isolate is aria-disabled without a Focus, then toggles with aria-pressed, in step with the panel's", async ({ page }) => {
    await open(page, "/#brain-explorer");
    const isolate = rail(page).getByRole("button", { name: "Isolar" });
    await expect(isolate).toHaveAttribute("aria-disabled", "true");
    await expect(isolate).toHaveAttribute("aria-pressed", "false");
    // Playwright won't click an aria-disabled button unforced; a Visitor can, and nothing happens.
    await isolate.click({ force: true });
    await expect(isolate).toHaveAttribute("aria-pressed", "false");

    await page.getByRole("list", { name: "Índice de estruturas" }).getByRole("button", { name: "Tálamo", exact: true }).click();
    await expect(isolate).not.toHaveAttribute("aria-disabled");
    await isolate.click();
    await expect(isolate).toHaveAttribute("aria-pressed", "true");
    const panelIsolate = panel(page, "Tálamo").getByRole("button", { name: "Isolar" });
    await expect(panelIsolate).toHaveAttribute("aria-pressed", "true");
    await panelIsolate.click();
    await expect(isolate).toHaveAttribute("aria-pressed", "false");
  });

  test("Reset returns everything to the start, but the idle rotation never comes back", async ({ page }) => {
    await open(page, "/#brain-explorer");
    const stage = page.locator("[data-specimen]");
    await expect(stage).toHaveAttribute("data-idle", "rotating");
    const reset = rail(page).getByRole("button", { name: "Redefinir" });
    await expect(reset).not.toHaveAttribute("aria-pressed");
    // Reset as the very first interaction still counts as one.
    await reset.click();
    await expect(stage).toHaveAttribute("data-idle", "still");

    await page.getByRole("list", { name: "Índice de estruturas" }).getByRole("button", { name: "Ponte" }).click();
    await rail(page).getByRole("button", { name: "Isolar" }).click();
    await reset.click();
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(page).toHaveURL(/\/#brain-explorer$/);
    await expect(rail(page).getByRole("button", { name: "Isolar" })).toHaveAttribute("aria-pressed", "false");
    await expect(stage).toHaveAttribute("data-idle", "still");
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("is axe-clean with a Condition focus", async ({ page }) => {
    await open(page, "/?condition=temporal-lobe-epilepsy#brain-explorer");
    await expect(panel(page, "Epilepsia do lobo temporal")).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
