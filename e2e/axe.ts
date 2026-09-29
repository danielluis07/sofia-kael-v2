import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/**
 * Runs axe (WCAG 2.2 AA) on the current page state and fails on any violation.
 * An exception needs a rule-scoped `disableRules` with a written reason at the
 * call site (ADR 0006).
 */
export async function expectNoAxeViolations(
  page: Page,
  options: { disableRules?: string[] } = {},
) {
  const builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "wcag22aa",
  ]);
  if (options.disableRules?.length) builder.disableRules(options.disableRules);
  const { violations } = await builder.analyze();
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}
