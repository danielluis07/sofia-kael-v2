import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { DRACO_DECODER_FILES, DRACO_DECODER_PATH, SPECIMEN_BYTES, SPECIMEN_URL, loadingPercent } from "./specimen";

describe("loadingPercent", () => {
  test("reads bytes against the response length", () => {
    expect(loadingPercent(0, 1000)).toBe(0);
    expect(loadingPercent(620, 1000)).toBe(62);
  });

  test("never claims 100% before the load finishes", () => {
    expect(loadingPercent(999, 1000)).toBe(99);
    expect(loadingPercent(1000, 1000)).toBe(99);
  });

  test("falls back to the known size without a length", () => {
    expect(loadingPercent(SPECIMEN_BYTES / 2, 0)).toBe(50);
  });

  test("falls back to the known size when a compressed length undershoots the decoded bytes", () => {
    expect(loadingPercent(SPECIMEN_BYTES / 4, SPECIMEN_BYTES / 8)).toBe(25);
    expect(loadingPercent(SPECIMEN_BYTES * 2, 10)).toBe(99);
  });
});

describe("assets", () => {
  test("SPECIMEN_BYTES matches the committed GLB", () => {
    expect(Bun.file(join("public", SPECIMEN_URL)).size).toBe(SPECIMEN_BYTES);
  });

  test("the self-hosted Draco decoder matches the installed three", async () => {
    for (const file of DRACO_DECODER_FILES) {
      const hosted = await Bun.file(join("public", DRACO_DECODER_PATH, file)).bytes();
      const upstream = await Bun.file(join("node_modules/three/examples/jsm/libs/draco/gltf", file)).bytes();
      expect(Bun.hash(hosted), `public/draco/${file} is stale: copy it from three again`).toBe(Bun.hash(upstream));
    }
  });
});
