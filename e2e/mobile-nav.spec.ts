import { expect, test } from "@playwright/test";
import { SECTIONS } from "../content/site";
import { expectNoAxeViolations } from "./axe";

test.use({ viewport: { width: 375, height: 812 } });

test("fills the screen, traps keyboard focus, and restores it on Escape or Close", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await menu.focus();
  await page.keyboard.press("Enter");
  const sheet = page.getByRole("dialog", { name: "Main navigation" });
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveCSS("background-color", "rgb(252, 251, 250)");
  expect(await sheet.boundingBox()).toEqual({ x: 0, y: 0, width: 375, height: 812 });
  await expect(sheet.getByRole("link")).toHaveText([...SECTIONS.map(({ label }) => label), "Book a consultation"]);
  const close = sheet.getByRole("button", { name: "Close menu" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(sheet.getByRole("link", { name: "Book a consultation" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(menu).toBeFocused();
  await expect(page).toHaveURL(/\/$/);
  await menu.click();
  await close.click();
  await expect(sheet).toBeHidden();
  await expect(menu).toBeFocused();
});

test("each link closes before jumping and moves keyboard focus to the section headline", async ({ page }) => {
  await page.goto("/");
  for (const { id, label } of [...SECTIONS, { id: "contact", label: "Book a consultation" }]) {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("link", { name: label, exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    const headline = page.locator(`#${id}-title`);
    await expect(headline).toBeFocused();
    await expect(headline).toBeInViewport();
    await expect.poll(async () => {
      const [header, title] = await Promise.all([page.getByRole("banner").boundingBox(), headline.boundingBox()]);
      return header && title ? title.y - header.y - header.height : -1;
    }).toBeGreaterThanOrEqual(0);
  }
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await menu.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
});

test("resizing to desktop closes the sheet and releases the page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("button", { name: "Menu", exact: true })).toBeHidden();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/#about$/);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("is axe-clean while open and navigates without animations", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoAxeViolations(page);
    await page.getByRole("dialog").getByRole("link", { name: "Contact", exact: true }).click();
    await expect(page.locator("#contact-title")).toBeFocused();
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, reducedMotion: "reduce" });
  test("Menu is inert and the footer links still navigate", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
    const footer = page.getByRole("navigation", { name: "Footer navigation" });
    for (const { id, label } of SECTIONS) {
      await footer.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}-title`)).toBeInViewport();
    }
  });
});
