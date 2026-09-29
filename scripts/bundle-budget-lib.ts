export const INITIAL_JS_BUDGET_KB = 170;
export const THREE_D_CHUNK_BUDGET_KB = 400;

/**
 * The 3D chunk rule: a JS file under `.next/static/chunks` that is NOT loaded by
 * the home page's initial HTML and whose source contains `WebGLRenderer`
 * (three.js's renderer class, whose name survives minification). Every file
 * matching the rule counts toward the 3D budget. Until three is bundled, no
 * file matches and the check passes trivially.
 */
export const THREE_D_MARKER = "WebGLRenderer";

/**
 * `src` paths of every script tag the page loads up front, in document order.
 * `nomodule` scripts (legacy polyfills) are skipped: every browser in ADR 0006's
 * support list supports modules and never downloads them.
 */
export function initialScriptPaths(html: string): string[] {
  const paths: string[] = [];
  for (const tag of html.matchAll(/<script\b[^>]*>/g)) {
    if (/\snomodule(=|\s|>)/i.test(tag[0])) continue;
    const src = tag[0].match(/\ssrc="([^"]+)"/)?.[1];
    if (src) paths.push(src.split("?")[0]);
  }
  return [...new Set(paths)];
}

export function is3dChunk(source: string): boolean {
  return source.includes(THREE_D_MARKER);
}

export function toKb(bytes: number): number {
  return bytes / 1024;
}

export type BudgetResult = { name: string; kb: number; limitKb: number; ok: boolean };

export function checkBudget(name: string, bytes: number, limitKb: number): BudgetResult {
  const kb = toKb(bytes);
  return { name, kb, limitKb, ok: kb <= limitKb };
}
