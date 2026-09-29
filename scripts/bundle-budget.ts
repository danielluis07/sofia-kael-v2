// Bundle budgets from ADR 0006. Run after `next build`: `bun run budget`.
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import {
  INITIAL_JS_BUDGET_KB,
  THREE_D_CHUNK_BUDGET_KB,
  checkBudget,
  initialScriptPaths,
  is3dChunk,
} from "./bundle-budget-lib";

const NEXT_DIR = join(process.cwd(), ".next");
const HOME_HTML = join(NEXT_DIR, "server", "app", "index.html");
const CHUNKS_DIR = join(NEXT_DIR, "static", "chunks");

if (!existsSync(HOME_HTML)) {
  console.error("No build output found. Run `bun run build` first.");
  process.exit(1);
}

const gzipSize = (buf: Buffer) => gzipSync(buf).length;

const html = await readFile(HOME_HTML, "utf8");
const initial = new Set(initialScriptPaths(html).map((p) => p.replace(/^\/_next\//, "")));

let initialBytes = 0;
for (const rel of initial) {
  initialBytes += gzipSize(await readFile(join(NEXT_DIR, rel)));
}

let threeDBytes = 0;
for (const file of await readdir(CHUNKS_DIR, { recursive: true })) {
  if (!file.endsWith(".js")) continue;
  const rel = `static/chunks/${file.replaceAll("\\", "/")}`;
  if (initial.has(rel)) continue;
  const buf = await readFile(join(CHUNKS_DIR, file));
  if (is3dChunk(buf.toString("utf8"))) threeDBytes += gzipSize(buf);
}

const results = [
  checkBudget("Initial-route JS", initialBytes, INITIAL_JS_BUDGET_KB),
  checkBudget("3D chunk", threeDBytes, THREE_D_CHUNK_BUDGET_KB),
];

for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}: ${r.kb.toFixed(1)} KB gzipped (limit ${r.limitKb} KB)`);
}
process.exit(results.every((r) => r.ok) ? 0 : 1);
