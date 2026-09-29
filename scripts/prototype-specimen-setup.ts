// PROTOTYPE (issue #6). Fetches the pinned upstream Z-Anatomy GLB and the Draco
// decoder into public/prototype/ (gitignored), so `bun run prototype:specimen` just works.
import { cp, mkdir } from "node:fs/promises";

const GLB_URL =
  "https://raw.githubusercontent.com/itayinbarr/brainproject/ac32adad68d86af019fa99ecbf56eaed85a0039e/brain-atlas/models/brain.glb";
const out = "public/prototype";

await mkdir(`${out}/draco`, { recursive: true });
await cp("node_modules/three/examples/jsm/libs/draco/gltf", `${out}/draco`, { recursive: true });

const glb = Bun.file(`${out}/brain.glb`);
if (!(await glb.exists())) {
  console.log("Fetching upstream brain.glb (4.65 MB)…");
  const res = await fetch(GLB_URL);
  if (!res.ok) throw new Error(`GLB fetch failed: ${res.status}`);
  await Bun.write(glb, res);
}
console.log("Prototype assets ready in public/prototype/");
