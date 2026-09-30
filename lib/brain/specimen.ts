// Where the curated GLB and its decoder live, and how its download reads as a percentage.

export const SPECIMEN_URL = "/models/brain.glb";

/** Self-hosted copy of three's `examples/jsm/libs/draco/gltf` WebAssembly decoder (#2). */
export const DRACO_DECODER_PATH = "/draco/";
export const DRACO_DECODER_FILES = ["draco_wasm_wrapper.js", "draco_decoder.wasm"] as const;

/** Byte size of `public/models/brain.glb`, for when the response has no usable length. A test keeps it in sync. */
export const SPECIMEN_BYTES = 2_059_952;

/**
 * Download progress for "Loading specimen · 62%". `total` is 0 when the
 * response has no Content-Length. A compressed response reports the compressed
 * length but counts decoded bytes, so `loaded` can overshoot it; either way the
 * known size stands in. Clamped to 99 until the load actually finishes.
 */
export function loadingPercent(loaded: number, total: number): number {
  const size = total >= loaded && total > 0 ? total : Math.max(SPECIMEN_BYTES, loaded);
  return Math.min(99, Math.max(0, Math.floor((loaded / size) * 100)));
}
