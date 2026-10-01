import { expect, test } from "bun:test";
import { Vector3 } from "three";
import { ART_FILES, ART_VIEWBOX, contours, intersectCoronal } from "./build-brain-art";

for (const file of ART_FILES) {
  test(`${file} is a committed SVG within the art budget`, async () => {
    expect(await Bun.file(file).exists()).toBe(true);
    expect(Bun.file(file).size).toBeLessThan(30_000);
    const source = await Bun.file(file).text();
    expect(source).toContain(`viewBox="${ART_VIEWBOX}"`);
    expect(source).toContain('stroke="var(--ink-soft, #5D5752)" stroke-width="1"');
    expect(source).toContain('vector-effect="non-scaling-stroke"');
    expect(source).toContain("CC BY-SA 4.0");
    expect(source).not.toMatch(/NaN|Infinity/);
    expect(source.match(/<path /g)!.length).toBeGreaterThan(1);
  });
}

test("coronal intersection interpolates triangle edges and excludes misses", () => {
  const triangle = [new Vector3(0, 0, -1), new Vector3(1, 0, 1), new Vector3(0, 1, 1)];
  expect(intersectCoronal(triangle, 0)).toEqual([[2750, 500], [500, -1750]]);
  expect(intersectCoronal(triangle, 2)).toBeNull();
  expect(intersectCoronal(triangle, 1)).toBeNull();
});

test("contours join unordered segments without losing separate loops", () => {
  const lines = contours([
    [[1, 0], [1, 1]], [[0, 0], [1, 0]], [[1, 1], [0, 0]],
    [[3, 0], [4, 0]], [[4, 1], [3, 0]], [[4, 0], [4, 1]],
  ], 0.01);
  expect(lines).toHaveLength(2);
  for (const line of lines) {
    expect(line).toHaveLength(4);
    expect(line[0]).toEqual(line.at(-1)!);
  }
});

test("the cross-section has exactly one Thalamus callout and Structure contours", async () => {
  const source = await Bun.file(ART_FILES[1]).text();
  expect(source.match(/<circle /g)).toHaveLength(1);
  expect(source.match(/<text /g)).toHaveLength(1);
  expect(source).toContain(">TÁLAMO</text>");
  expect(source).toContain('data-structure="thalamus.l"');
  expect(source).toContain('data-structure="ventricles.l"');
});

test("the specimen includes the portrait camera projection in the same SVG", async () => {
  expect(await Bun.file(ART_FILES[0]).text()).toContain('<view id="portrait" viewBox="1000 0 1000 1000"/>');
});
