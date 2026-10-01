import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const SECTIONS = [
  { id: "about", label: "Sobre" },
  { id: "conditions", label: "Condições" },
  { id: "brain-explorer", label: "Explore o cérebro" },
  { id: "first-visit", label: "Primeira consulta" },
  { id: "contact", label: "Contato" },
];

// Required footer lines from DESIGN.md §8, localized into Brazilian Portuguese.
const FOOTER_LINES = [
  "Modelo do cérebro: Z-Anatomy – The libre 3D atlas of anatomy e BodyParts3D (DBCLS), sob licença CC BY-SA 4.0.",
  "A Dra. Sofia Kael e a Kael Neurologia são fictícias. O endereço e o telefone também são fictícios. Este site é um projeto de design e não oferece orientação médica.",
];

/** Every `[data-reveal]` element's resting opacity and transform. */
function revealStyles(page: Page) {
  return page.locator("[data-reveal]").evaluateAll((elements) =>
    elements.map((el) => {
      const style = getComputedStyle(el);
      return { opacity: style.opacity, transform: style.transform };
    }),
  );
}

test("renders the sections in order, each labelled by its headline", async ({ page }) => {
  await page.goto("/");
  const main = page.getByRole("main");
  const names = await main.locator("section").evaluateAll((sections) =>
    sections.map((section) => document.getElementById(section.getAttribute("aria-labelledby") ?? "")?.textContent),
  );
  expect(names).toHaveLength(7);
  expect(names.every(Boolean)).toBe(true);
  expect(await main.locator("section[id]").evaluateAll((s) => s.map((el) => el.id))).toEqual(
    SECTIONS.map((section) => section.id),
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("every nav link lands with the section headline below the nav", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  const header = page.getByRole("banner");

  for (const { id, label } of SECTIONS) {
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    const headline = page.locator(`#${id}-title`);
    await expect(headline).toBeInViewport();
    await expect
      .poll(async () => {
        const [navBox, headlineBox] = await Promise.all([header.boundingBox(), headline.boundingBox()]);
        return navBox && headlineBox ? headlineBox.y - (navBox.y + navBox.height) : -1;
      })
      .toBeGreaterThanOrEqual(0);
  }
});

test("the consultation pill links to Contact", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByRole("link", { name: "Agende uma consulta" })).toHaveAttribute(
    "href",
    "#contact",
  );
});

test("reveals content once it scrolls into view", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/\breveal\b/);
  const contactTitle = page.locator("#contact-title");
  await expect(contactTitle).not.toHaveAttribute("data-revealed");
  await expect(contactTitle).toHaveCSS("opacity", "0");

  await contactTitle.scrollIntoViewIfNeeded();
  await expect(contactTitle).toHaveAttribute("data-revealed", "");
  await expect(contactTitle).toHaveCSS("opacity", "1");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("every section is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/\breveal\b/);
    for (const { opacity, transform } of await revealStyles(page)) {
      expect(opacity).toBe("1");
      expect(transform).toBe("none");
    }
    for (const heading of await page.getByRole("main").getByRole("heading").all()) {
      await expect(heading).toBeVisible();
    }
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("nothing carries a reveal transform", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/\breveal\b/);
    const styles = await revealStyles(page);
    expect(styles.length).toBeGreaterThan(0);
    for (const { opacity, transform } of styles) {
      expect(opacity).toBe("1");
      expect(transform).toBe("none");
    }
  });

  // Axe runs where everything is at rest: mid-fade text would read as low contrast.
  test("is axe-clean", async ({ page }) => {
    await page.goto("/");
    await expectNoAxeViolations(page);
  });
});

test("the footer carries the required lines, the links and the model credits", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  for (const line of FOOTER_LINES) await expect(footer.getByText(line, { exact: true })).toBeVisible();
  const links = footer.getByRole("navigation", { name: "Navegação do rodapé" }).getByRole("link");
  await expect(links).toHaveText(SECTIONS.map((section) => section.label));
  await expect(footer.getByRole("link", { name: "Créditos do modelo" })).toHaveAttribute("href", "/models/CREDITS.md");
});

test.describe("on mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hides the nav links and keeps the footer links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Navegação do rodapé" }).getByRole("link")).toHaveCount(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});
