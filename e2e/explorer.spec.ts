import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const GLB = "**/models/brain.glb";
const DESCRIPTION =
  "An interactive three-dimensional brain. Select a Structure using the Structure index to read its description and related Conditions.";
const FALLBACK = "Explore the brain using the Structure index. Each Structure has a description and a list of related Conditions.";

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
    await expect(readout).toHaveText(/^Loading specimen · \d+%$/);
    await expect(stage(page)).toHaveAttribute("data-specimen", "ready", { timeout: 60_000 });
    await expect(readout).toHaveText("Loading specimen · 100%");
    await expect(readout).toHaveCSS("opacity", "0");

    const hint = page.getByText("Drag to rotate · Click a Structure");
    await expect(hint).toHaveAttribute("aria-hidden", "false");
    await expect(stage(page)).toHaveAttribute("data-idle", "rotating");

    const box = (await page.locator("#brain-explorer canvas").boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 2 });
    await page.mouse.up();

    await expect(stage(page)).toHaveAttribute("data-idle", "still");
    await expect(hint).toHaveAttribute("aria-hidden", "true");
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
    await expect(stage(page).locator("svg")).toBeVisible();
    await expect(page.getByText(FALLBACK)).toBeVisible();
    await expect(page.locator("#brain-explorer canvas")).toHaveCount(0);
    expect(errors).toEqual([]);
    await expectNoAxeViolations(page);
  });
});
