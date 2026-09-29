import { describe, expect, test } from "bun:test";
import { checkBudget, initialScriptPaths, is3dChunk } from "./bundle-budget-lib";

describe("initialScriptPaths", () => {
  test("collects script srcs, drops query strings, duplicates, inline and nomodule scripts", () => {
    const html = `<script src="/_next/static/chunks/a.js?dpl=1" async=""></script>
      <script>self.x=1</script>
      <script src="/_next/static/chunks/b.js" async=""></script>
      <script src="/_next/static/chunks/poly.js" noModule=""></script>
      <script src="/_next/static/chunks/legacy.js" nomodule></script>
      <script src="/_next/static/chunks/a.js"></script>`;
    expect(initialScriptPaths(html)).toEqual([
      "/_next/static/chunks/a.js",
      "/_next/static/chunks/b.js",
    ]);
  });
});

describe("is3dChunk", () => {
  test("matches on the WebGLRenderer marker only", () => {
    expect(is3dChunk("class x{};var r=new WebGLRenderer()")).toBe(true);
    expect(is3dChunk("console.log('hello')")).toBe(false);
  });
});

describe("checkBudget", () => {
  test("passes at the limit and fails above it", () => {
    expect(checkBudget("x", 170 * 1024, 170).ok).toBe(true);
    expect(checkBudget("x", 170 * 1024 + 1, 170).ok).toBe(false);
  });
});
