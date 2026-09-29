# Research: Which 3D stack fits Next 16 + React 19.2?

Resolves wayfinder ticket #2 (map #1). Researched 2026-09-29.

## Answer

Use **React Three Fiber 9 + drei 10 on three.js**, rendered from a Client Component loaded with `next/dynamic({ ssr: false })`.

| Package              | Pin      | Why                                                                  |
| -------------------- | -------- | -------------------------------------------------------------------- |
| `three`              | `0.186.1` | Current latest [1]                                                   |
| `@react-three/fiber` | `9.8.1`  | Current latest; peer `react >=19 <19.4` covers our React 19.2.8 [2]   |
| `@react-three/drei`  | `10.7.9` | Current latest; peers `@react-three/fiber ^9`, `react ^19`, `three >=0.159` [3] |
| `@types/three`       | match `three` | Types                                                            |

Don't use R3F v10: it is still alpha (`10.0.0-alpha.5`) and centred on WebGPU/TSL, which we don't need [4].

## Findings

### Compatibility

- R3F is a React renderer, so its major version has to match React's: "@react-three/fiber@9 pairs with react@19" [5]. v9.5.0 added support for "all versions of React between 19.0 and 19.2", and v9.8.0 extends it to 19.3 [4]. Our `react@19.2.8` is inside the peer range `>=19 <19.4` [2].
- The R3F install guide asks Next.js (13.1+) projects to add `transpilePackages: ['three']` in `next.config` [5].
- Next 16's local docs say `ssr: false` works **only inside Client Components**. Using it in a Server Component raises an error ("`ssr: false` is not allowed with `next/dynamic` in Server Components. Please move it into a Client Component.") [6]. The pattern is therefore: `page.tsx` (server) → `<BrainExplorer>` client wrapper (`"use client"`) → `dynamic(() => import("./BrainStage"), { ssr: false })`.
- The same doc notes that when a Server Component dynamically imports a Client Component, automatic code splitting is **not** supported [6]. That's one more reason the `dynamic()` call must live in a client file. Otherwise three.js won't be split out of the main bundle.
- **Bun:** I found no primary-source statement either way. three, R3F and drei run in the browser; Bun only runs `next dev`/`next build` (`bun --bun next …`). This is low risk but **unverified**, so the first Brain Explorer slice should confirm `bun --bun next build` succeeds with R3F installed.

### Why R3F over plain three.js

- The Brain Explorer is heavily stateful UI: tools that combine, selection, Isolate, the Structure panel, the index, Condition deep-links and the bottom sheet (DESIGN.md §9). R3F lets that state drive the scene declaratively and share one React state model with the DOM panels.
- R3F's own docs claim "no overhead. Components render outside of React" [7]. That's a first-party claim, but render-loop code (`useFrame`) does run outside React reconciliation, so per-frame work is plain three.js.
- For contrast, the reference viewer for our GLB (`itayinbarr/brainproject`) uses vanilla three.js plus a hand-rolled controller [8]. That works, but we'd be re-implementing what drei gives us (`useGLTF`, `OrbitControls`/`CameraControls`, `ContactShadows`, `Bvh`).
- Escape hatch: anything R3F doesn't wrap (stencil passes for Slice, see the Slice-capping research) is plain three.js inside `useFrame`/refs. Choosing R3F closes off nothing.

### Draco decoder hosting

- drei's `useGLTF(path, useDraco)` defaults the decoder to Google's CDN `https://www.gstatic.com/draco/versioned/decoders/1.5.5/`. Passing a string path uses a local decoder instead, and `useGLTF.setDecoderPath` sets it globally [9].
- **Recommendation: self-host.** Copy three's decoders (`three/examples/jsm/libs/draco/`) into `public/draco/` and call `useGLTF.setDecoderPath('/draco/')`. That gives the decoder the same origin, cache and version as our three pin, and no third-party request. The reference viewer does the same and vendors the decoder locally [8].

### Lazy loading with real progress ("Loading specimen · 62%")

- **drei's `useProgress` can't drive a byte percentage for one GLB.** It hooks `THREE.DefaultLoadingManager` [10], whose `onProgress(url, itemsLoaded, itemsTotal)` reports **item counts**: `itemsLoaded++` per finished file [11]. With one GLB plus decoder files, it jumps in steps rather than counting up.
- **Byte progress** comes from the per-load `onProgress` callback. three's `FileLoader` streams the fetch body and emits `ProgressEvent({ lengthComputable, loaded, total })`, with `loaded += chunk.byteLength` and `total` taken from `X-File-Size` or else `Content-Length` [12]. Use `GLTFLoader.load(url, onLoad, onProgress)` yourself (or drei's `extendLoader` / the loader's manager) and feed `loaded/total` into the readout.
- **Caveat:** if the host serves the GLB with gzip/brotli, `Content-Length` is the compressed size while `loaded` counts decompressed bytes. The ratio can then overshoot or go non-computable. Mitigations: clamp to 99% until `onLoad`, and fall back to the known file size (a constant generated at build time) when `lengthComputable` is false. Check what Vercel sends for `.glb` in the deploy slice.
- Trigger loading as the section approaches, using an IntersectionObserver with a generous `rootMargin` to mount the dynamic component. Until then, the line-drawing placeholder (DESIGN.md §9) renders on the server.

### Bundle size

- `three@0.186.1`: 736 kB minified, **~185 kB gzip** by Bundlephobia's full-package measure [13]. Tree-shaking reduces this in practice. R3F and drei add on top, and drei is per-import.
- None of it lands in the initial page JS if the `dynamic()` boundary is in a Client Component (see above). Measure it in the first Brain Explorer slice. The budget itself belongs to the quality-bar ticket.

## Findings that affect other tickets

- **Node mapping (#4) / GLB inventory (#3):** the reference viewer says each mesh carries glTF `extras`: `bx_id`, `bx_label`, `bx_side` (`left`/`right`/`median`) and `bx_cat`. The viewer "never matches on display names" [8]. GLTFLoader exposes extras as `object.userData`. So Split can likely key on `bx_side`, and the mapping can key on `bx_id`. The inventory should confirm this.
- **Slice (#5):** `WebGLRenderer` defaults to `stencil = false` and `localClippingEnabled = false` [14]. Both have to be enabled on the R3F `<Canvas gl={{ stencil: true }}>` / renderer.

## Sources

1. npm registry, `three` latest: https://registry.npmjs.org/three/latest
2. npm registry, `@react-three/fiber` latest (peerDependencies): https://registry.npmjs.org/@react-three/fiber/latest
3. npm registry, `@react-three/drei` latest (peerDependencies): https://registry.npmjs.org/@react-three/drei/latest
4. R3F releases: https://github.com/pmndrs/react-three-fiber/releases
5. R3F installation guide: https://r3f.docs.pmnd.rs/getting-started/installation
6. Next.js 16 local docs: `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` (lines 60–95)
7. R3F introduction: https://r3f.docs.pmnd.rs/getting-started/introduction
8. itayinbarr/brainproject README: https://github.com/itayinbarr/brainproject
9. drei `useGLTF` source: https://github.com/pmndrs/drei/blob/master/src/core/Gltf.tsx
10. drei `useProgress` source: https://github.com/pmndrs/drei/blob/master/src/core/Progress.tsx
11. three.js `LoadingManager` source: https://github.com/mrdoob/three.js/blob/dev/src/loaders/LoadingManager.js
12. three.js `FileLoader` source: https://github.com/mrdoob/three.js/blob/dev/src/loaders/FileLoader.js
13. Bundlephobia, three@0.186.1: https://bundlephobia.com/package/three@0.186.1
14. three.js `WebGLRenderer` source: https://github.com/mrdoob/three.js/blob/dev/src/renderers/WebGLRenderer.js
