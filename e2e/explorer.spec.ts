import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const GLB = "**/models/brain.glb";
const DESCRIPTION =
  "Um cérebro interativo em três dimensões. Selecione uma estrutura no índice para ler sua descrição e conhecer as condições relacionadas.";
const FALLBACK = "Explore o cérebro pelo índice de estruturas. Cada estrutura tem uma descrição e uma lista de condições relacionadas.";

const stage = (page: Page) => page.locator("[data-specimen]");

/** Fails the test on any uncaught page error: the Visitor never sees one (ADR 0006). */
function collectPageErrors(page: Page) {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  return errors;
}

async function goToExplorer(page: Page) {
  await page.goto("/");
  await page.locator("#brain-explorer").scrollIntoViewIfNeeded();
}

// The one spec that waits for the GLB: SwiftShader is slow (ADR 0006), and every
// input event waits for a frame, hence the small viewport and the short drag.
test.describe("the specimen", () => {
  test.use({ viewport: { width: 800, height: 600 } });

  test("loads as the section approaches, then idles until touched", async ({ page }) => {
    test.slow();
    const errors = collectPageErrors(page);
    let glbRequested = false;
    page.on("request", (request) => {
      if (request.url().endsWith("/models/brain.glb")) glbRequested = true;
    });

    await page.goto("/");
    await expect(stage(page)).toHaveAttribute("data-specimen", "idle");
    expect(glbRequested).toBe(false);

    await page.locator("#brain-explorer").scrollIntoViewIfNeeded();
    const readout = page.getByTestId("specimen-readout");
    await expect(readout).toHaveText(/^Carregando modelo · \d+%$/);
    await expect(page.getByTestId("specimen-outline").locator("..")).toHaveCSS("transition-duration", "0.4s");
    await expect(stage(page)).toHaveAttribute("data-specimen", "ready", { timeout: 60_000 });
    await expect(readout).toHaveText("Carregando modelo · 100%");
    await expect(readout).toHaveCSS("opacity", "0");
    await expect(page.getByTestId("specimen-outline").locator("..")).toHaveCSS("opacity", "0");
    await expect(page.getByRole("img", { name: DESCRIPTION }).locator(":scope > div")).toHaveCSS("transition-duration", "0.4s");

    const hint = page.getByText("Arraste para girar · Clique em uma estrutura");
    await expect(hint).toHaveAttribute("aria-hidden", "false");
    await expect(stage(page)).toHaveAttribute("data-idle", "rotating");

    const box = (await page.locator("#brain-explorer canvas").boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 2 });
    await page.mouse.up();

    await expect(stage(page)).toHaveAttribute("data-idle", "still");
    await expect(hint).toHaveAttribute("aria-hidden", "true");

    // A drag, even one ending on the brain, selects nothing; nor does a click on empty background.
    await page.mouse.click(box.x + 12, box.y + box.height - 12);
    await expect(page.getByRole("complementary")).toHaveCount(0);
    expect(page.url()).not.toContain("structure=");

    // A click on the specimen selects the whole Structure under it.
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(/\?structure=[a-z-]+#brain-explorer$/);
    await expect(page.getByRole("complementary")).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 412, height: 823 } });

  test("nothing loads until the Visitor scrolls, even with the section within reach", async ({ page }) => {
    let glbRequested = false;
    page.on("request", (request) => {
      if (request.url().endsWith("/models/brain.glb")) glbRequested = true;
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(stage(page)).toHaveAttribute("data-specimen", "idle");
    expect(glbRequested).toBe(false);

    // Approach the stage without assuming the height of the preceding sections.
    // Keep it below the viewport, but within the observer's loading margin.
    const scrollDistance = await stage(page).evaluate((element) =>
      element.getBoundingClientRect().top - window.innerHeight - 100,
    );
    await page.mouse.wheel(0, scrollDistance);
    await expect(stage(page)).not.toHaveAttribute("data-specimen", "idle");
  });
});

test("the canvas has a text description", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("img", { name: DESCRIPTION })).toBeAttached();
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("there is no idle rotation", async ({ page }) => {
    await page.goto("/");
    await expect(stage(page)).toHaveAttribute("data-idle", "still");
  });
});

test.describe("with reduced motion, when the GLB fails", () => {
  // Reduced motion keeps the page at rest for axe (see page-shell.spec.ts).
  test.use({ reducedMotion: "reduce" });

  test("falls back the same way, axe-clean", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.route(GLB, (route) => route.abort());

    await goToExplorer(page);
    await expect(stage(page)).toHaveAttribute("data-specimen", "fallback", { timeout: 30_000 });
    await expect(stage(page).getByTestId("specimen-outline")).toBeVisible();
    await expect(page.getByText(FALLBACK)).toBeVisible();
    await expect(page.locator("#brain-explorer canvas")).toHaveCount(0);
    expect(errors).toEqual([]);
    await expectNoAxeViolations(page);
  });
});

// Selection needs no specimen: the GLB is held back, so the index, the panel
// and the URL are exercised exactly as they are before it loads.
test.describe("selecting a Structure", () => {
  const panel = (page: Page, name: string) => page.getByRole("complementary", { name });
  const index = (page: Page) => page.getByRole("list", { name: "Índice de estruturas" });

  test.beforeEach(async ({ page }) => {
    await page.route(GLB, () => {});
  });

  test("?structure= opens its panel on load, before the specimen", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto("/?structure=hippocampus#brain-explorer");
    const hippocampus = panel(page, "Hipocampo");
    await expect(hippocampus).toBeVisible();
    await expect(stage(page)).not.toHaveAttribute("data-specimen", "ready");
    await expect(hippocampus.locator("[lang=la]")).toHaveText("Hippocampus");
    await expect(hippocampus.getByText(/^O hipocampo ajuda a transformar experiências/)).toBeVisible();
    await expect(hippocampus.getByText("Condições tratadas pela Dra. Kael nesta estrutura")).toBeVisible();
    await expect(hippocampus.getByRole("link")).toHaveText(["Epilepsia do lobo temporal", "Doença de Alzheimer"]);
    await expect(hippocampus.getByRole("link").first()).toHaveAttribute("href", "#condition-temporal-lobe-epilepsy");
    await expect(index(page).getByRole("button", { name: "Hipocampo" })).toHaveAttribute("aria-current", "true");
    await expect(page.locator("[aria-live=polite]")).toContainText("Hipocampo");
    expect(errors).toEqual([]);
  });

  test("a Structure without Conditions has no Conditions block", async ({ page }) => {
    await page.goto("/?structure=insula#brain-explorer");
    const insula = panel(page, "Ínsula");
    await expect(insula).toBeVisible();
    await expect(insula.getByText("Condições tratadas pela Dra. Kael nesta estrutura")).toHaveCount(0);
  });

  test("an unknown id is dropped from the URL, silently", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto("/?structure=spleen#brain-explorer");
    await expect(page).toHaveURL(/\/#brain-explorer$/);
    await expect(page.getByRole("complementary")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("the keyboard selects through the Structure index, and Esc clears", async ({ page }) => {
    await page.goto("/#brain-explorer");
    const entries = await page.evaluate(() => history.length);
    await page.getByRole("button", { name: "Índice de estruturas" }).focus();
    await page.keyboard.press("Tab");
    await expect(index(page).getByRole("button", { name: "Lobo frontal" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    const temporal = index(page).getByRole("button", { name: "Lobo temporal" });
    await expect(temporal).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(panel(page, "Lobo temporal")).toBeVisible();
    await expect(page).toHaveURL(/\/\?structure=temporal-lobe#brain-explorer$/);
    await expect(temporal).toHaveAttribute("aria-current", "true");
    // Selections replace the URL, never push.
    expect(await page.evaluate(() => history.length)).toBe(entries);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(page).toHaveURL(/\/#brain-explorer$/);
    await expect(temporal).not.toHaveAttribute("aria-current");
    await expect(temporal).toBeFocused();
  });

  test("Home and End reach both ends of the index; one Tab stop leaves it", async ({ page }) => {
    await page.goto("/#brain-explorer");
    await index(page).getByRole("button", { name: "Lobo frontal" }).focus();
    await page.keyboard.press("End");
    await expect(index(page).getByRole("button", { name: "Cerebelo" })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(index(page).getByRole("button", { name: "Lobo frontal" })).toBeFocused();
    await expect(index(page).locator("button[tabindex='0']")).toHaveCount(1);
  });

  test("the close control clears the Focus and hands keyboard focus back to the index", async ({ page }) => {
    await page.goto("/?structure=pons#brain-explorer");
    await panel(page, "Ponte").getByRole("button", { name: "Fechar painel" }).click();
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(page).toHaveURL(/\/#brain-explorer$/);
    await expect(index(page).getByRole("button", { name: "Ponte" })).toBeFocused();
  });

  test("the index collapses", async ({ page }) => {
    await page.goto("/#brain-explorer");
    const toggle = page.getByRole("button", { name: "Índice de estruturas" });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(index(page)).toBeHidden();
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("camera moves are cuts", async ({ page }) => {
      await page.goto("/#brain-explorer");
      await expect(stage(page)).toHaveAttribute("data-camera-ms", "0");
    });

    test("is axe-clean with a Structure focused", async ({ page }) => {
      await page.goto("/?structure=hippocampus#brain-explorer");
      await expect(panel(page, "Hipocampo")).toBeVisible();
      await expectNoAxeViolations(page);
    });
  });

  test("camera moves ease over --dur-camera", async ({ page }) => {
    await page.goto("/#brain-explorer");
    await expect(stage(page)).toHaveAttribute("data-camera-ms", "900");
  });
});
