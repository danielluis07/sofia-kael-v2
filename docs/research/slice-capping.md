# Research: How do we render Slice with capped cut faces?

Resolves wayfinder ticket #5 (map #1). Researched 2026-09-29.

## Answer

Use **stencil-buffer caps, one stencil group per Structure**, following the three.js `webgl_clipping_stencil` example [1]:

1. Each sliced Structure mesh is clipped by the Slice plane (`material.clippingPlanes = [plane]`).
2. For each Structure, two extra colour-less draws of the same geometry write the stencil: back faces **increment**, front faces **decrement** [1].
3. A cap quad lying on the Slice plane draws where `stencil != 0`, in `--porcelain-cut`, and resets the stencil in `onAfterRender` [1].
4. `renderOrder` sequences each Structure's stencil passes → its cap → the next Structure [1].

Optionally, add **three-mesh-bvh section outlines**: a BVH `shapecast` finds each triangle crossing the plane and emits the intersection segments as lines [2][3]. These give hairline contours around each Structure's cut, in the anatomy-plate style of DESIGN.md §1.5 and §6.

The approach needs a **stencil buffer** and **local clipping**, both off by default in `WebGLRenderer` (`stencil = false`, `localClippingEnabled = false`) [4]. Enable them on the R3F `<Canvas>`.

## How the stencil technique works

Verbatim from the three.js example [1]: a `MeshBasicMaterial` with `colorWrite = false`, `depthWrite = false`, `depthTest = false` and `stencilWrite = true`, `stencilFunc = AlwaysStencilFunc`. It's cloned twice:

- `BackSide`, clipped by the plane, `stencilFail/ZFail/ZPass = IncrementWrapStencilOp`
- `FrontSide`, clipped by the plane, `stencilFail/ZFail/ZPass = DecrementWrapStencilOp`

The cap is a `MeshStandardMaterial` plane with `stencilRef = 0`, `stencilFunc = NotEqualStencilFunc`, `stencilFail/ZFail/ZPass = ReplaceStencilOp`, `onAfterRender = renderer => renderer.clearStencil()` and `renderOrder = i + 1.1` [1].

Why it works (my reasoning from the ops above, not stated in the source): for any pixel, the clipped mesh's back faces minus its front faces equals 1 exactly where the view ray enters the solid through the cut, which is where the cap must show. So the cap fills exactly the cross-section, drawn flat on the plane.

## Options compared

| Technique | Solid cut look | Many meshes | X-ray / Split | Mobile cost | Verdict |
| --- | --- | --- | --- | --- | --- |
| **Stencil caps per Structure** [1] | True planar cap; hides everything behind the plane, like an MRI slice | Yes, with one stencil group + cap per Structure, sequenced by `renderOrder` | Split: fine, since the plane is in world space and moving the hemispheres doesn't matter. X-ray: needs a rule (below) | ~2 extra colourless draws per sliced mesh + 1 quad each. Cheap fragment work | **Recommended** |
| **Back-face flat colour** (clipped mesh rendered `BackSide` in unlit `--porcelain-cut`) | Approximates a cap for a single closed mesh. With nested meshes, deep Structures show as 3D shapes through the hole instead of flat sections | Yes | Weak: X-ray translucency shows interior back faces | Cheapest (one extra draw) | Fallback only if stencil proves too costly on phones |
| **three-mesh-bvh clipped edges** [2][3] | Outline only. The example itself fills the cap with the stencil trick [3] | Yes (BVH per geometry) | Fine | CPU work every time the plane moves. BVH makes it fast, but it runs per drag frame | **Complement** for contours, not a replacement |
| **CSG** (boolean-subtract a half-space) | Real geometry | Per mesh | Fine | Rebuilds geometry on every slider move. Unsuited to live dragging | Rejected (my assessment, not benchmarked) |

## Constraints the prototype and GLB tickets must check

- **Watertight meshes.** The stencil count only equals 1 inside the solid if every mesh is closed. Holes or open borders leave cap streaks or gaps. The three.js example doesn't say this explicitly [1]. It follows from the parity logic, and the three-mesh-bvh example's outline code likewise assumes clean closed triangles and drops degenerate cases (`if ( count !== 2 )`) [3]. **The GLB inventory ticket should check whether each Structure's meshes are closed.** If they aren't, this feeds the Blender-fallback fog on the map.
- **Nested Structures.** The deep Structures sit inside the cortex volume. With per-Structure stencil groups, each Structure's cap is its own region, so a thalamus cap can differ from the cortex cap (e.g. a slightly darker tone, or `--oxblood` when selected). A single combined stencil pass would merge them into one flat blob and lose the MRI-like section. Hence one group per Structure. Order the groups outer → inner so inner caps overwrite outer ones. The depth of all caps is the same plane, so the later cap wins with `depthFunc` set to `LessEqual` (to verify in the prototype).
- **X-ray combined with Slice.** Translucent cortex in X-ray should probably **not** cap (skip its stencil group). Otherwise an opaque cortex cap hides the deep Structures the X-ray exists to show. This is a design call for the rendering prototype or the state-model ticket.
- **Isolate.** Ghosted Structures (`--porcelain-ghost`, 8% opacity) should likewise skip capping.
- **Cost.** Each sliced Structure adds 2 geometry passes. That roughly triples the vertex work for sliced meshes while Slice is on. Fragment cost is tiny (no colour writes). How this holds up on phones depends on the triangle count from the GLB inventory. The rendering prototype should measure it.
- **Renderer flags:** `stencil: true` on the WebGL context and `localClippingEnabled = true` [4]. The stencil buffer has to be requested at context creation, so it can't be enabled later.

## Sources

1. three.js example `webgl_clipping_stencil`: https://github.com/mrdoob/three.js/blob/dev/examples/webgl_clipping_stencil.html (live: https://threejs.org/examples/webgl_clipping_stencil.html)
2. three-mesh-bvh README ("Clipped edges" example): https://github.com/gkjohnson/three-mesh-bvh (live: https://gkjohnson.github.io/three-mesh-bvh/clippedEdges.html)
3. three-mesh-bvh `clippedEdges.js` source: https://github.com/gkjohnson/three-mesh-bvh/blob/master/example/clippedEdges.js
4. three.js `WebGLRenderer` source (constructor defaults, `localClippingEnabled`): https://github.com/mrdoob/three.js/blob/dev/src/renderers/WebGLRenderer.js
