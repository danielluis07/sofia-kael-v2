import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

// The controls need no specimen: the GLB is held back, as in explorer.spec.ts.
const GLB = "**/models/brain.glb";

const stage = (page: Page) => page.locator("[data-specimen]");
const rail = (page: Page) => page.getByRole("group", { name: "Ferramentas" });
const tool = (page: Page, name: string) => rail(page).getByRole("button", { name });
const controls = (page: Page) => page.getByRole("group", { name: "Corte", exact: true });
const axis = (page: Page, name: string) => controls(page).getByRole("radio", { name: new RegExp(`^${name}`) });
/** Clicks an axis the way a Visitor does: on its label, since the radio itself is visually hidden. */
const choose = (page: Page, name: string) => controls(page).locator("label", { hasText: name }).click();
const slider = (page: Page) => controls(page).getByRole("slider", { name: "Posição do corte" });
const readout = (page: Page) => page.getByTestId("slice-readout");

/** The readout and the slider's announced value agree. */
async function expectReadout(page: Page, text: string) {
  await expect(readout(page)).toHaveText(text);
  await expect(slider(page)).toHaveAttribute("aria-valuetext", text);
}

/** Loads `url` and waits until the Explorer is hydrated. */
async function open(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator("html")).toHaveAttribute("data-explorer-jumps");
}

test.beforeEach(async ({ page }) => {
  await page.route(GLB, () => {});
});

test("Slice toggles with aria-pressed, shows its controls at Coronal 0 mm, and counts as the first interaction", async ({ page }) => {
  await open(page, "/#brain-explorer");
  await expect(stage(page)).toHaveAttribute("data-idle", "rotating");
  await expect(tool(page, "Corte")).toHaveAttribute("aria-pressed", "false");
  await expect(controls(page)).toHaveCount(0);

  await tool(page, "Corte").click();
  await expect(tool(page, "Corte")).toHaveAttribute("aria-pressed", "true");
  await expect(stage(page)).toHaveAttribute("data-idle", "still");
  await expect(axis(page, "Coronal")).toBeChecked();
  await expectReadout(page, "Coronal · y = 0 mm");
  await expect(page).toHaveURL(/\/#brain-explorer$/);

  await tool(page, "Corte").click();
  await expect(tool(page, "Corte")).toHaveAttribute("aria-pressed", "false");
  await expect(controls(page)).toHaveCount(0);
});

test("the keyboard sets the position in mm, and the readout follows in RAS convention", async ({ page }) => {
  await open(page, "/#brain-explorer");
  await tool(page, "Corte").focus();
  await page.keyboard.press("Enter");

  await slider(page).focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expectReadout(page, "Coronal · y = −2 mm");
  await expect(slider(page)).toHaveAttribute("aria-valuenow", "-2");

  await page.keyboard.press("PageDown");
  await expectReadout(page, "Coronal · y = −12 mm");
  // The brain's bounds on each axis.
  await page.keyboard.press("Home");
  await expectReadout(page, "Coronal · y = −90 mm");
  await page.keyboard.press("End");
  await expectReadout(page, "Coronal · y = 90 mm");
  await page.keyboard.press("ArrowRight");
  await expectReadout(page, "Coronal · y = 90 mm");
});

test("changing the axis re-centres the plane and names its coordinate", async ({ page }) => {
  await open(page, "/#brain-explorer");
  await tool(page, "Corte").click();
  await slider(page).focus();
  await page.keyboard.press("PageDown");
  await expectReadout(page, "Coronal · y = −10 mm");

  await choose(page, "Sagital");
  await expect(axis(page, "Sagital")).toBeChecked();
  await expectReadout(page, "Sagital · x = 0 mm");
  await slider(page).focus();
  await page.keyboard.press("End");
  await expectReadout(page, "Sagital · x = 68 mm");

  // The radios are one Tab stop; the arrow keys move between the axes.
  await axis(page, "Sagital").focus();
  await page.keyboard.press("ArrowRight");
  await expect(axis(page, "Coronal")).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(axis(page, "Axial")).toBeChecked();
  await expectReadout(page, "Axial · z = 0 mm");
  await slider(page).focus();
  await page.keyboard.press("Home");
  await expectReadout(page, "Axial · z = −80 mm");
});

test("toggled off and on, it keeps its axis and position; Reset brings back Coronal 0 mm", async ({ page }) => {
  await open(page, "/#brain-explorer");
  await tool(page, "Corte").click();
  await choose(page, "Axial");
  await slider(page).focus();
  await page.keyboard.press("PageUp");
  await tool(page, "Corte").click();
  await tool(page, "Corte").click();
  await expect(axis(page, "Axial")).toBeChecked();
  await expectReadout(page, "Axial · z = 10 mm");

  await tool(page, "Redefinir").click();
  await expect(tool(page, "Corte")).toHaveAttribute("aria-pressed", "false");
  await tool(page, "Corte").click();
  await expectReadout(page, "Coronal · y = 0 mm");
});

test("it combines with Split, X-ray, a Focus and Isolate, and clearing the Focus keeps it on", async ({ page }) => {
  await open(page, "/?structure=thalamus#brain-explorer");
  for (const name of ["Corte", "Separar", "Raio X", "Isolar"]) await tool(page, name).click();
  for (const name of ["Corte", "Separar", "Raio X", "Isolar"]) await expect(tool(page, name)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("complementary", { name: "Tálamo" })).toBeVisible();
  await expectReadout(page, "Coronal · y = 0 mm");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await expect(tool(page, "Corte")).toHaveAttribute("aria-pressed", "true");
  await expect(controls(page)).toBeVisible();
});

test("the controls pass axe", async ({ page }) => {
  await open(page, "/#brain-explorer");
  await tool(page, "Corte").click();
  await expect(controls(page)).toBeVisible();
  await expectNoAxeViolations(page);
});
