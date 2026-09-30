import { describe, expect, test } from "bun:test";
import { CONDITIONS, conditionsForStructure } from "@/content/conditions";
import { isPlaceholder, placeholder } from "@/content/placeholder";
import * as site from "@/content/site";
import { STRUCTURES } from "@/content/structures";
import { STRUCTURE_IDS } from "@/lib/brain/structures";

function stringsIn(value: unknown, path: string): { path: string; text: string }[] {
  if (typeof value === "string") return [{ path, text: value }];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => stringsIn(child, `${path}.${key}`));
  }
  return [];
}

describe("content integrity (ADR 0004)", () => {
  test("lists remaining placeholders by field, including repeated text", () => {
    const copy = stringsIn(site, "site");
    const remaining = copy.filter(({ text }) => isPlaceholder(text));
    console.info(`Remaining placeholders: ${remaining.length}\n${remaining.map(({ path }) => path).join("\n")}`);
    // A finished copy pass can leave zero placeholders. Unmarked lorem is always an error.
    expect(copy.filter(({ text }) => /\b(lorem|ipsum)\b/i.test(text) && !isPlaceholder(text))).toEqual([]);
    // Fictional institutions and journals stay marked for review even after
    // their draft copy replaces lorem (ADR 0004).
    for (const { text } of remaining) expect(text.trim().length).toBeGreaterThan(0);
    const text = "Lorem ipsum identity check";
    expect(placeholder(text)).toBe(text);
    expect(stringsIn({ first: text, second: text }, "fixture").filter(({ text }) => isPlaceholder(text))).toHaveLength(2);
  });

  test("Explorer copy is complete and never a placeholder", () => {
    expect(Object.keys(STRUCTURES)).toEqual([...STRUCTURE_IDS]);
    const copy = stringsIn({ STRUCTURES, CONDITIONS, EXPLORER: site.EXPLORER }, "explorer");
    for (const { text } of copy) {
      expect(text.trim().length).toBeGreaterThan(0);
      expect(isPlaceholder(text)).toBe(false);
      expect(text).not.toMatch(/\b(lorem|ipsum)\b/i);
    }
    for (const description of [
      ...Object.values(STRUCTURES).map((structure) => structure.description),
      ...CONDITIONS.map((condition) => condition.description),
    ]) {
      expect(description.match(/[.!?](?:\s|$)/g)?.length).toBeGreaterThanOrEqual(2);
      expect(description.match(/[.!?](?:\s|$)/g)?.length).toBeLessThanOrEqual(3);
    }
    for (const condition of CONDITIONS) {
      const words = condition.oneLiner.split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(10);
      expect(words).toBeLessThanOrEqual(14);
      expect(condition.structures.length).toBeGreaterThan(0);
      expect(new Set(condition.structures).size).toBe(condition.structures.length);
      for (const id of condition.structures) expect(STRUCTURE_IDS).toContain(id);
    }
  });

  test("only the four pinned Structures have no Conditions; reverse results keep Conditions order", () => {
    expect(STRUCTURE_IDS.filter((id) => conditionsForStructure(id).length === 0)).toEqual([
      "insula", "postcentral-gyrus", "cingulate-gyrus", "hypothalamus",
    ]);
    expect(conditionsForStructure("cerebellum").map(({ id }) => id)).toEqual([
      "essential-tremor", "ataxia", "vertigo",
    ]);
    for (const id of STRUCTURE_IDS) {
      expect(conditionsForStructure(id)).toEqual(CONDITIONS.filter(({ structures }) => (structures as readonly string[]).includes(id)));
    }
  });

  test("Condition ids are unique, URL-safe and stable", () => {
    const ids = CONDITIONS.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(ids).toEqual([
      "temporal-lobe-epilepsy", "alzheimers-disease", "parkinsons-disease",
      "essential-tremor", "stroke", "migraine", "multiple-sclerosis",
      "hydrocephalus", "ataxia", "vertigo",
    ]);
  });
});
