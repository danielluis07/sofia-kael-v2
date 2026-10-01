import { expect, test, type Page } from "@playwright/test";
import { CONTACT } from "../content/site";
import { expectNoAxeViolations } from "./axe";

async function fillRequiredFields(page: Page) {
  const contact = page.locator("#contact");
  await contact.getByLabel(CONTACT.form.labels.name, { exact: true }).fill("Alex Morgan");
  await contact.getByLabel(CONTACT.form.labels.email, { exact: true }).fill("alex@example.com");
  await contact.getByLabel(CONTACT.form.labels.reason, { exact: true }).fill("Recurring headaches.");
}

test.describe("Contact form", () => {
  test.use({ reducedMotion: "reduce" });

  test("submit validates in order, associates errors and revalidates on change", async ({ page }) => {
    await page.goto("/#contact");
    const contact = page.locator("#contact");
    const name = contact.getByLabel(CONTACT.form.labels.name, { exact: true });
    const email = contact.getByLabel(CONTACT.form.labels.email, { exact: true });
    const phone = contact.getByLabel(CONTACT.form.labels.phone, { exact: true });
    const reason = contact.getByLabel(CONTACT.form.labels.reason, { exact: true });
    const submit = contact.getByRole("button", { name: CONTACT.form.submit });
    await name.fill("Alex Morgan");
    await email.fill("invalid");
    await name.blur();
    await expect(contact.getByRole("alert")).toHaveCount(0);
    await name.fill("");
    await submit.click();
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAccessibleDescription(CONTACT.form.errors.nameRequired);
    await expect(email).toHaveAccessibleDescription(CONTACT.form.errors.emailInvalid);
    await expect(reason).toHaveAccessibleDescription(CONTACT.form.errors.reasonRequired);
    await expectNoAxeViolations(page);
    await name.fill("Alex Morgan");
    await expect(contact.getByText(CONTACT.form.errors.nameRequired)).toHaveCount(0);
    await submit.click();
    await expect(email).toBeFocused();
    await email.fill("alex@example.com");
    await phone.fill("not a phone");
    await submit.click();
    await expect(phone).toBeFocused();
    await expect(phone).toHaveAccessibleDescription(CONTACT.form.errors.phoneInvalid);
    await phone.fill("(11) 0000-0142");
    await expect(contact.getByText(CONTACT.form.errors.phoneInvalid)).toHaveCount(0);
    await submit.click();
    await expect(reason).toBeFocused();
  });

  test("keyboard submission focuses success and sends no values", async ({ page }) => {
    await page.goto("/#contact");
    const contact = page.locator("#contact");
    await expect(contact.getByRole("radio", { name: CONTACT.form.preferredTimes.noPreference })).toBeChecked();
    await fillRequiredFields(page);
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.method() !== "GET" || /Alex|alex%40|alex@example|Recurring/.test(request.url())) requests.push(request.url());
    });
    await contact.getByLabel(CONTACT.form.labels.name, { exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(contact.getByLabel(CONTACT.form.labels.email, { exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(contact.getByLabel(CONTACT.form.labels.phone, { exact: true })).toBeFocused();
    expect(await page.locator(":focus").evaluate((element) => getComputedStyle(element).outlineColor)).toBe("rgb(110, 31, 36)");
    await page.keyboard.press("Tab");
    await expect(contact.getByLabel(CONTACT.form.labels.reason, { exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(contact.getByRole("radio", { name: CONTACT.form.preferredTimes.noPreference })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(contact.getByRole("radio", { name: CONTACT.form.preferredTimes.afternoon })).toBeChecked();
    await page.keyboard.press("Tab");
    await expect(contact.getByRole("button", { name: CONTACT.form.submit })).toBeFocused();
    await page.keyboard.press("Enter");
    const success = contact.getByRole("status");
    await expect(success).toBeFocused();
    await expect(success).toContainText(CONTACT.form.success.body);
    await expect(contact.locator("form")).toHaveCount(0);
    await expect(page).toHaveURL(/\/#contact$/);
    await expectNoAxeViolations(page);
    expect(requests).toEqual([]);
  });
});

test.describe("Contact without JavaScript", () => {
  test.use({ javaScriptEnabled: false, reducedMotion: "reduce" });

  test("contact details are readable and both empty and filled submits stay inert", async ({ page }) => {
    await page.goto("/#contact");
    const contact = page.locator("#contact");
    for (const line of CONTACT.addressLines) await expect(contact.getByText(line, { exact: true })).toBeVisible();
    await expect(contact.getByRole("link", { name: CONTACT.phone })).toHaveAttribute("href", CONTACT.phoneHref);
    for (const hours of CONTACT.hours) await expect(contact.getByText(hours.time, { exact: true })).toBeVisible();
    const navigations: string[] = [];
    page.on("request", (request) => { if (request.isNavigationRequest()) navigations.push(request.url()); });
    await contact.getByRole("button", { name: CONTACT.form.submit }).click();
    await fillRequiredFields(page);
    await contact.getByLabel(CONTACT.form.labels.phone, { exact: true }).fill("617-555-0101");
    await contact.getByRole("button", { name: CONTACT.form.submit }).click();
    await expect(page).toHaveURL(/\/#contact$/);
    await expect(contact.getByLabel(CONTACT.form.labels.name, { exact: true })).toHaveValue("Alex Morgan");
    await expect(contact.getByRole("status")).toHaveCount(0);
    expect(navigations).toEqual([]);
  });
});

for (const width of [1440, 375]) {
  test.describe(`Contact at ${width}px`, () => {
    test.use({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });

    test("fits the viewport, is axe-clean and uses bottom-border inputs", async ({ page }) => {
      await page.goto("/#contact");
      await expectNoAxeViolations(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const contact = page.locator("#contact");
      const form = await contact.locator("form").boundingBox();
      const details = await contact.locator("dl").boundingBox();
      if (width >= 768) expect(details!.x).toBeGreaterThan(form!.x + form!.width);
      else expect(details!.y).toBeGreaterThan(form!.y + form!.height);
      const borders = await contact.getByLabel(CONTACT.form.labels.name, { exact: true }).evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth];
      });
      expect(borders).toEqual(["0px", "0px", "1px", "0px"]);
      await contact.screenshot({ path: `test-results/contact-${width}.png` });
    });
  });
}
