# Research: Inventory of the Z-Anatomy brain GLB

Resolves wayfinder ticket #3 (map #1). Inspected 2026-09-29.

Source: `brain-atlas/models/brain.glb` from `itayinbarr/brainproject`, last changed in commit `ac32adad68d86af019fa99ecbf56eaed85a0039e` (2026-06-11, "add 54 white-matter tracts as centerline tubes"). File size 4,650,816 bytes. Parsed with glTF-Transform 4.5.1 and the Draco decoder from `draco3dgltf` 1.5.7. The companion `manifest.json` (232,455 bytes, 437 entries) was read as well. Apart from the licensing notes, everything below was measured on the file, not taken from the README.

## Answer

The GLB matches ADR 0001 on size and node count, but four facts change how we should plan around it:

1. **It is far heavier than 4.65 MB suggests: 1,383,522 triangles, 853,972 vertices.** Hiding vessels, meninges and cranial nerves (as DESIGN.md §9 says) still leaves 746,096 triangles in 325 meshes; dropping the tracts too leaves 694,472. The two telencephalic white-matter meshes alone are 270,576.
2. **The cortex is not watertight as shipped, but it is close.** Only 11 of 128 cortex meshes pass a strict test (0.01 mm weld). Each mesh is one gyrus, sulcus or pole (a small near-closed shell), and there is **no** whole-hemisphere, lobe or pial-surface mesh. The shells carry a median of 44 boundary edges each. Welding vertices within 0.1 mm closes 42 of them fully and leaves a median of 4 boundary edges. Whether that is good enough for stencil-capped Slice (ticket #5) is for the rendering prototype to say.
3. **Left and right are separate nodes** (`.l` / `.r`, left = **+X**), so Split works directly. Only 34 structures are single median nodes.
4. **The ticket's `bx_*` extras are present and richer than the README says**, but they live on the **node**, not on the mesh.

## Container facts

- glTF 2.0, generator `glTF-Transform v4.5.1`. One scene, **437 root nodes, no hierarchy** (max depth 0, no node has children). Every node has exactly one mesh and no local transform (all identity). No skins, animations, textures or cameras.
- **Draco-compressed.** `KHR_draco_mesh_compression` is in `extensionsRequired`, so the loader must be given a decoder. Also used: `KHR_materials_ior`, `KHR_materials_specular`.
- Vertex attributes: `POSITION`, `NORMAL`, `TEXCOORD_0`. There are no textures, so the UVs are unused weight.
- Meshes: 437, of which 126 have 2 primitives (all cortex: a material split into `Temporal lobe` + `Brain-Inner`, or `Temporal lobe` + `Brain`) and 311 have 1.
- Because the hierarchy is flat, grouping into ~20 Structures has to come from metadata (`bx_cat`, `bx_region`, `bx_parent`, the manifest's `ta2` path) and names. It cannot come from the scene graph.

## Units, axes, bounds

- **Units are metres**, real scale. Overall bounding box, min → max: x −0.0762 → 0.0762, y 1.1049 → 1.7019, z −0.1124 → 0.0880 (152 × 597 × 200 mm).
- The brain sits about **1.6 m above the origin** (y ≈ 1.54 → 1.70), which is where a head sits on a standing body. The tall y-range only comes from the vagus and accessory nerves running down the neck (y down to 1.105). The `bx_core` = 1 meshes (the brain proper, see below) span x ±0.069, y 1.539 → 1.700, z −0.099 → 0.082: **138 × 161 × 181 mm**. Recentre on load rather than trusting the origin.
- **Y-up, anterior = +Z** (the cerebellum sits at z ≤ 0.01, the frontal lobe at positive z), **left hemisphere = +X** (e.g. cortex `.l` spans x 0 → 0.069 m). The hemispheres meet at x ≈ 0.

## Node and mesh tree

The tree is flat: 437 nodes, all children of the one scene. Full listing in the [appendix](#appendix-all-437-nodes). Counts by `bx_cat`:

| `bx_cat` | Meshes | Triangles | Watertight | Open edges | `bx_core` |
|---|---:|---:|---:|---:|---:|
| `cortex` | 128 | 113,066 | 11 / 128 | 7,807 | all 1 |
| `white_matter` | 9 | 291,037 | 7 / 9 | 246 | all 1 |
| `deep_grey` | 23 | 23,545 | 21 / 23 | 7 | all 1 |
| `diencephalon` | 41 | 35,636 | 32 / 41 | 169 | all 1 |
| `brainstem` | 30 | 57,090 | 25 / 30 | 46 | all 1 |
| `cerebellum` | 33 | 150,509 | 21 / 33 | 75 | all 1 |
| `ventricles` | 7 | 23,589 | 2 / 7 | 83 | all 1 |
| `tracts` | 54 | 51,624 | 54 / 54 | 0 | all 0 |
| `arteries` | 48 | 259,582 | 46 / 48 | 0 | all 0 |
| `veins_sinuses` | 17 | 94,440 | 14 / 17 | 584 | all 0 |
| `meninges_dura` | 3 | 23,668 | 2 / 3 | 2 | all 0 |
| `cranial_nerves` | 44 | 259,736 | 41 / 44 | 0 | all 0 |
| **total** | **437** | **1,383,522** | **276 / 437** | 9,019 | |

"Watertight" here means no boundary edge and no edge shared by more than two triangles, after welding vertices within 0.01 mm **across all primitives of the mesh**. It does not test self-intersection, winding direction or that the volume is positive. See [Watertightness](#watertightness).

### Sides

- `left` 202, `right` 201, `median` 34. The suffix `.l` / `.r` on the node name matches `bx_side` exactly (202 `.l` / 201 `.r` / 34 unsuffixed).
- Unpaired: `Medulla oblongata.l` has no `.r` twin (one medulla mesh, tagged left), and the MCA M2/M3 branches are named inconsistently between sides (`(M2-segment).l` vs `(M2).r`, `(M3 segment).l` vs `(M3-segment).r`). Never match on names across sides. Use `bx_id` / `bx_label`.
- Median nodes: Anterior communicating artery, Basilar venous plexus, Anterior intercavernous sinus, Basilar artery, Inferior sagittal sinus, Occipital sinus, Posterior intercavernous sinus, Straight sinus, Superior sagittal sinus, Falx cerebri, Septal nuclei, Corpus callosum, Anterior commissure, Hippocampal commissure, Septum pellucidum, Habenula, Posterior commissure, Third ventricle, Aqueduct of midbrain, Fourth ventricle, Uvula of vermis, Tuber of vermis, Pyramis of vermis, Nodule of vermis, Lingula of cerebellum, Folium of vermis, Declive, Culmen, Central lobule, Adenohypophysis, Neurohypophysis, Pineal gland, Middle cerebellar peduncle, Superior cerebellar peduncle.

### Names

- 30 names contain `*` (e.g. `Paracentral gyrus and sulcus*.l`), 2 have stray whitespace (" Posterior transverse collateral sulcus.l", " Posterior transverse collateral sulcus.r"), and some keep raw Z-Anatomy source names (`Lat_Fis-ant-Vertical.l`). **Use `bx_label`, which is clean, for display.**
- `GLTFLoader` sanitises node names (spaces, dots, brackets). Read the extras (`userData`) rather than names.

## Cortex

- 128 meshes = 63 patches per hemisphere + 2 hippocampi. Tagged by lobe in `bx_region`: Frontal 42, Temporal 22, Occipital 18, Parietal 14, Limbic 12, Insula 2, "Telencephalon" 18 (patches that are not assigned to a lobe, e.g. `Cuneus`, `Precuneus`, `Superior parietal lobule`, `Temporal plane`).
- Each is an individual gyrus, sulcus or pole patch. Lobes exist **only as `bx_region` metadata**, never as geometry.
- Each patch is nearly a closed shell, not a flat sheet: the 0.01 mm weld leaves a median of 44 boundary edges per mesh (90th percentile 139, max 270). At a 0.1 mm weld the median falls to 4 (p90 27, max 56) and 42 meshes have none; at 1 mm, 88 have none, but by then the same weld starts merging distinct vertices in thin meshes (see [Watertightness](#watertightness)). So most of the openness is sub-0.1 mm cracks between vertices. Loading-time welding is a lever to test; this ticket does not decide it.
- The patches do not seal each other into a bigger surface. Unioning a hemisphere's 63 patches leaves about as many boundary edges (3,436 left, 3,584 right at 0.01 mm) as the patches have alone, so treat them as 63 independent shells.
- The white matter of the telencephalon (`White matter of telencephalon.l/.r`, 135,288 triangles each, **watertight**) is the largest closed mesh in the model. Its bounds sit inside the cortex bounds (x 0.0014 → 0.0649 vs 0 → 0.0689).
- No dedicated meninges beyond `Falx cerebri` and the two `Tentorium cerebelli` meshes; no dura around the whole brain, no skull.

## Watertightness

276 of 437 meshes pass. This matters for stencil-capped Slice (ticket #5), which needs closed, manifold meshes.

- **Passing:** all 54 tracts, 46/48 arteries, 41/44 cranial nerves, 21/23 deep grey, both lateral ventricles, both telencephalic white-matter blocks, the corpus callosum and fornix, most thalamic nuclei, most brainstem and cerebellar lobules.
- **Failing, not cortex, in categories that stay visible** (35; another 9 fail among the hidden vessels, meninges and nerves): Choroid plexus.r (ventricles, 3 open / 5 non-manifold); Choroid plexus.l (ventricles, 3 open / 5 non-manifold); Anterior commissure (white_matter, 10 open / 10 non-manifold); Hippocampal commissure (white_matter, 236 open / 243 non-manifold); Septum pellucidum (ventricles, 23 open / 38 non-manifold); Habenula (diencephalon, 10 open / 12 non-manifold); Posterior commissure (diencephalon, 18 open / 20 non-manifold); Third ventricle (ventricles, 20 open / 19 non-manifold); Base of peduncle.r (cerebellum, 7 open / 1 non-manifold); Base of peduncle.l (cerebellum, 7 open / 1 non-manifold); Aqueduct of midbrain (brainstem, 36 open / 30 non-manifold); Midbrain.r (brainstem, 4 open / 2 non-manifold); Midbrain.l (brainstem, 4 open / 2 non-manifold); Pons.r (brainstem, 1 open / 6 non-manifold); Pons.l (brainstem, 1 open / 6 non-manifold); Fourth ventricle (ventricles, 34 open / 2 non-manifold); Superior semilunar lobule.l (cerebellum, 12 open / 0 non-manifold); Inferior semilunar lobule.l (cerebellum, 3 open / 0 non-manifold); Gracile lobule.l (cerebellum, 3 open / 0 non-manifold); Declive (cerebellum, 7 open / 0 non-manifold); Culmen (cerebellum, 6 open / 0 non-manifold); Biventral lobule.l (cerebellum, 6 open / 0 non-manifold); Superior semilunar lobule.r (cerebellum, 12 open / 0 non-manifold); Inferior semilunar lobule.r (cerebellum, 3 open / 0 non-manifold); Gracile lobule.r (cerebellum, 3 open / 0 non-manifold); Biventral lobule.r (cerebellum, 6 open / 0 non-manifold); Basolateral complex.l (deep_grey, 4 open / 0 non-manifold); Corticomedial group.r (deep_grey, 3 open / 0 non-manifold); Anterior hypothalamus.l (diencephalon, 3 open / 9 non-manifold); Anterior hypothalamus.r (diencephalon, 6 open / 8 non-manifold); Tuberal hypothalamus.l (diencephalon, 0 open / 1 non-manifold); Lateral hypothalamus.l (diencephalon, 10 open / 7 non-manifold); Lateral hypothalamus.r (diencephalon, 10 open / 8 non-manifold); Adenohypophysis (diencephalon, 56 open / 0 non-manifold); Neurohypophysis (diencephalon, 56 open / 0 non-manifold).
- **Failing, cortex:** 117 of 128 at the strict tolerance (see [Cortex](#cortex) for how that changes with the weld). Failing outside the cortex: 44 of 309.
- **Tolerance sweep** (all meshes, same rules, degenerate triangles ignored): watertight at 0.01 mm / 0.1 mm / 1 mm weld = **276 / 281 / 124**. Loosening the weld helps the cortex (11 → 42 → 42 fully closed; 88 have no boundary edge at 1 mm) but degrades tubes and thin meshes (arteries 46 → 36 → 5, cranial nerves 41 → 30 → 2, brainstem 25 → 21 → 10) because distinct vertices start to merge. A single global tolerance is therefore not free; it would have to be per category.
- **Winding:** 61 meshes contain directed edges used more than once (inconsistent winding or non-manifold fans); 7 contain degenerate triangles.
- Every material is **`doubleSided: true`**. The stencil technique needs front and back faces handled in separate passes, so the loader-supplied materials would have to be replaced or cloned per pass.

## Materials

13 materials, no textures:

| Name | Base colour (r, g, b) | Metallic | Roughness | doubleSided |
|---|---|---:|---:|---|
| Artery | 1.00, 1.00, 1.00 | 0.00 | 0.35 | true |
| Cartilage | 1.00, 1.00, 1.00 | 0.00 | 0.32 | true |
| Temporal lobe | 1.00, 1.00, 1.00 | 0.19 | 0.50 | true |
| Brain-Inner | 0.90, 0.60, 0.44 | 0.19 | 0.50 | true |
| Brain | 0.80, 0.28, 0.20 | 0.19 | 0.50 | true |
| Nucleus | 0.50, 0.16, 0.04 | 0.29 | 0.29 | true |
| White matter | 0.51, 0.51, 0.51 | 0.00 | 0.12 | true |
| Nerve | 1.00, 1.00, 1.00 | 0.90 | 0.68 | true |
| LCR | 0.44, 0.80, 0.74 | 0.00 | 0.50 | true |
| Nucleus (efferent fibers) | 0.53, 0.08, 0.07 | 0.29 | 0.56 | true |
| Nucleus (afferent fibers) | 0.16, 0.31, 0.46 | 0.29 | 0.56 | true |
| Cerebellum | 0.34, 0.17, 0.09 | 0.00 | 0.50 | true |
| Bone-4 | 1.00, 1.00, 1.00 | 0.49 | 0.67 | true |

96 meshes have **no material at all** (deep_grey 18, diencephalon 24, tracts 54). We will assign colours ourselves. Artery, Nerve, Cartilage and Temporal lobe have a white (1, 1, 1) base colour, so they carry no tint of their own.

## Triangle counts and the "coarse deep structures" caveat

- Total 1,383,522 triangles. Largest meshes: White matter of telencephalon.l 135,288; White matter of telencephalon.r 135,288; Basilar venous plexus 56,192; Vagus nerve (X).r 30,588; Posterior inferior cerebellar artery.l 25,308; Posterior inferior cerebellar artery.r 25,308; Posterior cerebral artery.l 22,608; Posterior cerebral artery.r 22,608.
- Deep nuclei are **decimated to a cap of ~1,000 triangles each** (58 of the 64 deep-grey and diencephalon meshes have 1,000 triangles or fewer, and 26 sit exactly on 1,000), which matches ADR 0001's "coarse subcortical meshes (about 7 mm)" and the README's "approximate, educational, not for clinical use". They are smooth blobs and will look faceted under a Slice cut.
- Budget if we hide vessels, meninges and cranial nerves: 746,096 triangles / 325 meshes. Also hiding tracts: 694,472. Also dropping the two white-matter blocks:423,896. Draw calls are one per primitive: 437 meshes plus a second primitive on 126 cortex meshes is 563 primitives in total (325 meshes when the hidden categories are dropped).

## The `extras` check

**All 437 nodes carry `bx_id`, `bx_label`, `bx_side`, `bx_cat`** (and `bx_region`, `bx_core`, `bx_source`). They match `manifest.json` field-for-field with **0 mismatches**. Details:

- They are on the **glTF node**, not on the mesh (`mesh.extras` is empty everywhere). In three.js they will surface on the loaded `Object3D.userData`.
- `bx_id`: 0–436, unique, dense.
- `bx_cat` values: the 12 in the table above. `bx_side`: `left` / `right` / `median`.
- Beyond the README: `bx_region` (lobe or region, 18 distinct values), `bx_core` (0/1; 271 core, i.e. everything except vessels, meninges, cranial nerves and tracts), `bx_source` (`Z-Anatomy / BodyParts3D`), `bx_parent` on 38 nodes (a **label** for a grouping, e.g. `Globus pallidus` for the internal and external segments, `Thalamus` for the nuclei, which is not itself a node), and `bx_decussation` (a teaching sentence) on all 54 tracts.
- Leftover Blender custom properties on many nodes (`Cross-section-X/Y/Z`, `muscle_color`, `comic_shader`, `key_color`, `hops`, `M3`, and stray `background`, `theme`, `SheetGenerator`). Ignore them.
- `manifest.json` adds `ta2`: the full Terminologia Anatomica ancestor path per structure (e.g. Central nervous system → Brain → Cerebrum → Left cerebral hemisphere → Neo-cortex → Telencephalon). Useful for grouping and the index; the GLB does not carry it.

### `bx_core`

`bx_core` = 1 for cortex, white matter, deep grey, diencephalon, brainstem, cerebellum and ventricles (271 meshes). It = 0 for arteries, veins, meninges, cranial nerves and tracts (166). That is the same split DESIGN.md §9 wants when it says vessels, meninges and cranial nerves are hidden, **except that the 54 tracts are non-core too** and have to be decided separately.

## Licensing notes

- The upstream repo is dual-licensed: code Apache-2.0, **3D assets and derived metadata CC BY-SA 4.0**, © Z-Anatomy contributors and BodyParts3D / DBCLS. That matches ADR 0001.
- New since the ADR was written: the README says the pallidus split, thalamic nuclei, subthalamic nucleus, substantia nigra, accumbens, amygdala groups, hypothalamus zones **and the white-matter tracts** were registered from open MNI-space atlases (CIT168, Najdenovska 2018, Neudorfer 2020, HCP1065 templates) and "remain CC BY-SA 4.0". Some source atlases are CC BY 4.0, which asks for credit. If we ship the tracts or those nuclei, the footer or an About/credits page may need to name those atlases as well as Z-Anatomy and BodyParts3D. Worth a line in ADR 0001 when this ticket's findings are folded in.

## What this means for other tickets

Facts only, no decisions:

- **Structure mapping** cannot use the scene graph. The groupable keys are `bx_cat`, `bx_region`, `bx_parent`, `bx_side` and, if we import the manifest, `ta2`. Lobes are `bx_region` values on cortex patches.
- **Slice capping (#5):** 117 of 128 cortex meshes fail the strict manifold test (near-closed, with a median of 4 boundary edges at a 0.1 mm weld), as do 44 of the other 309 meshes (5 of 7 ventricle meshes, and the falx cerebri among the meninges). The telencephalic white-matter blocks, most deep nuclei and most cerebellar lobules pass. Whether the cortex residue streaks the caps is an empirical question for the rendering prototype; if it does, the Blender fallback in ADR 0001 is the route. The deep meshes are decimated to ~1,000 triangles, so caps there will be faceted but closed.
- **Split** works on `.l` / `.r` node pairs (left +X). **Isolate / X-ray** run per node. **Explorer performance** needs a triangle budget decision (1,383,522 raw).
- **Loader:** needs Draco (self-hosted decoder, per ticket #2). Node extras arrive as `userData`.

## Method

Script (throwaway, not committed): load the GLB with glTF-Transform `NodeIO`, register all extensions and the Draco decoder, walk the scene, and for each node compute world-space bounds, triangle and vertex counts, and edge statistics. Vertices are welded by position rounded to 10⁻⁵ m (0.01 mm) across all primitives of a mesh, then every undirected edge is counted: one occurrence = boundary edge, more than two = non-manifold. Degenerate triangles (two corners welded together) are skipped. A first pass welded per primitive and wrongly reported material seams as open edges; the numbers here are from the corrected pass. The sweep repeats this at 0.1 mm and 1 mm. Not tested: self-intersection, winding direction, overlap between neighbouring meshes, and how a renderer's stencil pass actually behaves on the residual cracks.

## Appendix: all 437 nodes

Columns: `bx_id`, node name (trimmed), `bx_cat`, `bx_side`, `bx_region`, `bx_core`, primitives, triangles, watertight (if not: boundary edges / non-manifold edges), material(s). "(none)" = no material.

| id | Name | bx_cat | side | bx_region | core | prims | tris | Watertight | Material |
|---:|---|---|---|---|---:|---:|---:|---|---|
| 0 | Posterior transverse collateral sulcus.l | cortex | left | Telencephalon | 1 | 2 | 184 | no (4/0) | Temporal lobe + Brain-Inner |
| 1 | Posterior transverse collateral sulcus.r | cortex | right | Telencephalon | 1 | 2 | 184 | no (4/0) | Temporal lobe + Brain-Inner |
| 2 | Abducens nerve (VI).l | cranial_nerves | left | cranial_nerves | 0 | 1 | 3288 | yes | Nerve |
| 3 | Abducens nerve (VI).r | cranial_nerves | right | cranial_nerves | 0 | 1 | 3288 | yes | Nerve |
| 4 | Accessory nerve (XI).l | cranial_nerves | left | cranial_nerves | 0 | 1 | 10248 | yes | Nerve |
| 5 | Accessory nerve (XI).r | cranial_nerves | right | cranial_nerves | 0 | 1 | 10248 | yes | Nerve |
| 6 | Accessory nucleus of oculomotor nerve.l | brainstem | left | Brainstem | 1 | 1 | 768 | yes | Nucleus (efferent fibers) |
| 7 | Accessory nucleus of oculomotor nerve.r | brainstem | right | Brainstem | 1 | 1 | 768 | yes | Nucleus (efferent fibers) |
| 8 | Acoustic radiation.l | tracts | left | Temporal lobe | 0 | 1 | 956 | yes | (none) |
| 9 | Acoustic radiation.r | tracts | right | Temporal lobe | 0 | 1 | 956 | yes | (none) |
| 10 | Adenohypophysis | diencephalon | median | Diencephalon | 1 | 1 | 680 | no (56/0) | Nucleus |
| 11 | Angular gyrus.l | cortex | left | Parietal lobe | 1 | 2 | 1511 | no (139/0) | Temporal lobe + Brain-Inner |
| 12 | Angular gyrus.r | cortex | right | Parietal lobe | 1 | 2 | 1511 | no (131/0) | Temporal lobe + Brain-Inner |
| 13 | Anterior cerebral artery.l | arteries | left | arteries | 0 | 1 | 588 | yes | Artery |
| 14 | Anterior cerebral artery.r | arteries | right | arteries | 0 | 1 | 588 | yes | Artery |
| 15 | Anterior commissure | white_matter | median | Telencephalon | 1 | 1 | 800 | no (10/10) | White matter |
| 16 | Anterior communicating artery | arteries | median | arteries | 0 | 1 | 106 | yes | Artery |
| 17 | Anterior division of mandibular nerve.l | cranial_nerves | left | cranial_nerves | 0 | 1 | 396 | yes | Nerve |
| 18 | Anterior division of mandibular nerve.r | cranial_nerves | right | cranial_nerves | 0 | 1 | 396 | yes | Nerve |
| 19 | Anterior hypothalamus.l | diencephalon | left | Diencephalon | 1 | 1 | 997 | no (3/9) | (none) |
| 20 | Anterior hypothalamus.r | diencephalon | right | Diencephalon | 1 | 1 | 996 | no (6/8) | (none) |
| 21 | Anterior inferior cerebellar artery.l | arteries | left | arteries | 0 | 1 | 3084 | yes | Artery |
| 22 | Anterior inferior cerebellar artery.r | arteries | right | arteries | 0 | 1 | 3084 | yes | Artery |
| 23 | Anterior intercavernous sinus | veins_sinuses | median | veins_sinuses | 0 | 1 | 396 | yes | Artery |
| 24 | Anterior nuclei of thalamus.l | diencephalon | left | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 25 | Anterior nuclei of thalamus.r | diencephalon | right | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 26 | Anterior occipital sulcus*.l | cortex | left | Telencephalon | 1 | 2 | 364 | no (16/0) | Temporal lobe + Brain-Inner |
| 27 | Anterior occipital sulcus*.r | cortex | right | Telencephalon | 1 | 2 | 364 | no (28/0) | Temporal lobe + Brain-Inner |
| 28 | Anterior quadrangular lobule.l | cerebellum | left | Cerebellum | 1 | 1 | 6520 | yes | Cerebellum |
| 29 | Anterior quadrangular lobule.r | cerebellum | right | Cerebellum | 1 | 1 | 6520 | yes | Cerebellum |
| 30 | Anterior spinal artery.l | arteries | left | arteries | 0 | 1 | 1164 | yes | Artery |
| 31 | Anterior spinal artery.r | arteries | right | arteries | 0 | 1 | 1164 | yes | Artery |
| 32 | Anterior thalamic radiation.l | tracts | left | Diencephalon | 0 | 1 | 956 | yes | (none) |
| 33 | Anterior thalamic radiation.r | tracts | right | Diencephalon | 0 | 1 | 956 | yes | (none) |
| 34 | Aqueduct of midbrain | brainstem | median | Brainstem | 1 | 1 | 460 | no (36/30) | LCR |
| 35 | Arcuate fasciculus.l | tracts | left | Left cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 36 | Arcuate fasciculus.r | tracts | right | Right cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 37 | Basilar artery | arteries | median | arteries | 0 | 1 | 588 | yes | Artery |
| 38 | Basilar venous plexus | veins_sinuses | median | veins_sinuses | 0 | 1 | 56192 | no (576/0) | Artery |
| 39 | Basolateral complex.l | deep_grey | left | Telencephalon | 1 | 1 | 998 | no (4/0) | (none) |
| 40 | Basolateral complex.r | deep_grey | right | Telencephalon | 1 | 1 | 1000 | yes | (none) |
| 41 | Biventral lobule.l | cerebellum | left | Cerebellum | 1 | 1 | 8902 | no (6/0) | Cerebellum |
| 42 | Biventral lobule.r | cerebellum | right | Cerebellum | 1 | 1 | 8902 | no (6/0) | Cerebellum |
| 43 | Buccal nerve.l | cranial_nerves | left | cranial_nerves | 0 | 1 | 1752 | yes | Nerve |
| 44 | Buccal nerve.r | cranial_nerves | right | cranial_nerves | 0 | 1 | 1752 | yes | Nerve |
| 45 | Calcarine sulcus.l | cortex | left | Occipital lobe | 1 | 2 | 872 | no (110/4) | Temporal lobe + Brain-Inner |
| 46 | Calcarine sulcus.r | cortex | right | Occipital lobe | 1 | 2 | 872 | no (116/4) | Temporal lobe + Brain-Inner |
| 47 | Callosomarginal artery.l | arteries | left | arteries | 0 | 1 | 10056 | yes | Artery |
| 48 | Callosomarginal artery.r | arteries | right | arteries | 0 | 1 | 10056 | yes | Artery |
| 49 | Caudate nucleus.l | deep_grey | left | Telencephalon | 1 | 1 | 2570 | yes | Nucleus |
| 50 | Caudate nucleus.r | deep_grey | right | Telencephalon | 1 | 1 | 2570 | yes | Nucleus |
| 51 | Cavernous sinus.l | veins_sinuses | left | veins_sinuses | 0 | 1 | 9728 | no (0/4508) | Artery |
| 52 | Cavernous sinus.r | veins_sinuses | right | veins_sinuses | 0 | 1 | 9728 | no (8/4463) | Artery |
| 53 | Central lobule | cerebellum | median | Cerebellum | 1 | 1 | 1006 | yes | Cerebellum |
| 54 | Central nucleus.l | deep_grey | left | Telencephalon | 1 | 1 | 228 | yes | (none) |
| 55 | Central nucleus.r | deep_grey | right | Telencephalon | 1 | 1 | 224 | yes | (none) |
| 56 | Central sulcus.l | cortex | left | Telencephalon | 1 | 2 | 1440 | no (106/0) | Temporal lobe + Brain-Inner |
| 57 | Central sulcus.r | cortex | right | Telencephalon | 1 | 2 | 1440 | no (120/0) | Temporal lobe + Brain-Inner |
| 58 | Choroid plexus.l | ventricles | left | ventricles | 1 | 1 | 2647 | no (3/5) | Artery |
| 59 | Choroid plexus.r | ventricles | right | ventricles | 1 | 1 | 2647 | no (3/5) | Artery |
| 60 | Cingulate gyrus (Posteroventral part*).l | cortex | left | Limbic lobe | 1 | 2 | 298 | no (40/0) | Temporal lobe + Brain-Inner |
| 61 | Cingulate gyrus (Posteroventral part*).r | cortex | right | Limbic lobe | 1 | 2 | 298 | no (32/0) | Temporal lobe + Brain-Inner |
| 62 | Cingulate gyrus and sulcus (Middle anterior part).l | cortex | left | Limbic lobe | 1 | 2 | 736 | no (24/0) | Temporal lobe + Brain-Inner |
| 63 | Cingulate gyrus and sulcus (Middle anterior part).r | cortex | right | Limbic lobe | 1 | 2 | 736 | no (12/0) | Temporal lobe + Brain-Inner |
| 64 | Cingulate gyrus and sulcus (Middle posterior part).l | cortex | left | Limbic lobe | 1 | 2 | 600 | no (16/0) | Temporal lobe + Brain-Inner |
| 65 | Cingulate gyrus and sulcus (Middle posterior part).r | cortex | right | Limbic lobe | 1 | 2 | 600 | no (4/0) | Temporal lobe + Brain-Inner |
| 66 | Cingulate gyrus and sulcus (Posterior dorsal part).l | cortex | left | Limbic lobe | 1 | 2 | 410 | no (36/0) | Temporal lobe + Brain-Inner |
| 67 | Cingulate gyrus and sulcus (Posterior dorsal part).r | cortex | right | Limbic lobe | 1 | 2 | 410 | no (40/0) | Temporal lobe + Brain-Inner |
| 68 | Cingulate sulcus (Marginal part*).l | cortex | left | Limbic lobe | 1 | 2 | 544 | no (46/0) | Temporal lobe + Brain-Inner |
| 69 | Cingulate sulcus (Marginal part*).r | cortex | right | Limbic lobe | 1 | 2 | 544 | no (38/0) | Temporal lobe + Brain-Inner |
| 70 | Circular sulcus of insula.l | cortex | left | Telencephalon | 1 | 2 | 798 | no (88/0) | Temporal lobe + Brain-Inner |
| 71 | Circular sulcus of insula.r | cortex | right | Telencephalon | 1 | 2 | 798 | no (94/0) | Temporal lobe + Brain-Inner |
| 72 | Collateral sulcus.l | cortex | left | Telencephalon | 1 | 2 | 1142 | no (132/0) | Temporal lobe + Brain-Inner |
| 73 | Collateral sulcus.r | cortex | right | Telencephalon | 1 | 2 | 1142 | no (126/0) | Temporal lobe + Brain-Inner |
| 74 | Corpus callosum | white_matter | median | Telencephalon | 1 | 1 | 3996 | yes | Temporal lobe |
| 75 | Corticobulbar tract.l | tracts | left | Brainstem | 0 | 1 | 956 | yes | (none) |
| 76 | Corticobulbar tract.r | tracts | right | Brainstem | 0 | 1 | 956 | yes | (none) |
| 77 | Corticomedial group.l | deep_grey | left | Telencephalon | 1 | 1 | 1000 | yes | (none) |
| 78 | Corticomedial group.r | deep_grey | right | Telencephalon | 1 | 1 | 999 | no (3/0) | (none) |
| 79 | Corticopontine tract (frontal).l | tracts | left | Brainstem | 0 | 1 | 956 | yes | (none) |
| 80 | Corticopontine tract (frontal).r | tracts | right | Brainstem | 0 | 1 | 956 | yes | (none) |
| 81 | Corticopontine tract (occipital).l | tracts | left | Brainstem | 0 | 1 | 956 | yes | (none) |
| 82 | Corticopontine tract (occipital).r | tracts | right | Brainstem | 0 | 1 | 956 | yes | (none) |
| 83 | Corticopontine tract (parietal).l | tracts | left | Brainstem | 0 | 1 | 956 | yes | (none) |
| 84 | Corticopontine tract (parietal).r | tracts | right | Brainstem | 0 | 1 | 956 | yes | (none) |
| 85 | Corticospinal tract.l | tracts | left | Brainstem | 0 | 1 | 956 | yes | (none) |
| 86 | Corticospinal tract.r | tracts | right | Brainstem | 0 | 1 | 956 | yes | (none) |
| 87 | Corticostriatal tract (anterior).l | tracts | left | Telencephalon | 0 | 1 | 956 | yes | (none) |
| 88 | Corticostriatal tract (anterior).r | tracts | right | Telencephalon | 0 | 1 | 956 | yes | (none) |
| 89 | Corticostriatal tract (posterior).l | tracts | left | Telencephalon | 0 | 1 | 956 | yes | (none) |
| 90 | Corticostriatal tract (posterior).r | tracts | right | Telencephalon | 0 | 1 | 956 | yes | (none) |
| 91 | Corticostriatal tract (superior).l | tracts | left | Telencephalon | 0 | 1 | 956 | yes | (none) |
| 92 | Corticostriatal tract (superior).r | tracts | right | Telencephalon | 0 | 1 | 956 | yes | (none) |
| 93 | Culmen | cerebellum | median | Cerebellum | 1 | 1 | 2378 | no (6/0) | Cerebellum |
| 94 | Cuneus.l | cortex | left | Occipital lobe | 1 | 2 | 946 | no (34/0) | Temporal lobe + Brain-Inner |
| 95 | Cuneus.r | cortex | right | Occipital lobe | 1 | 2 | 946 | yes | Temporal lobe + Brain-Inner |
| 96 | Declive | cerebellum | median | Cerebellum | 1 | 1 | 2125 | no (7/0) | Cerebellum |
| 97 | Dentatorubrothalamic tract.l | tracts | left | Brainstem | 0 | 1 | 956 | yes | (none) |
| 98 | Dentatorubrothalamic tract.r | tracts | right | Brainstem | 0 | 1 | 956 | yes | (none) |
| 99 | Distal lateral striate branches.l | arteries | left | arteries | 0 | 1 | 6252 | yes | Artery |
| 100 | Distal lateral striate branches.r | arteries | right | arteries | 0 | 1 | 6252 | yes | Artery |
| 101 | Facial nerve (VII).l | cranial_nerves | left | cranial_nerves | 0 | 1 | 18192 | yes | Nerve |
| 102 | Facial nerve (VII).r | cranial_nerves | right | cranial_nerves | 0 | 1 | 18192 | yes | Nerve |
| 103 | Falx cerebri | meninges_dura | median | meninges_dura | 0 | 1 | 14708 | no (2/544) | Cartilage |
| 104 | Flocculus.l | cerebellum | left | Cerebellum | 1 | 1 | 3660 | yes | Cerebellum |
| 105 | Flocculus.r | cerebellum | right | Cerebellum | 1 | 1 | 3660 | yes | Cerebellum |
| 106 | Folium of vermis | cerebellum | median | Cerebellum | 1 | 1 | 812 | yes | Cerebellum |
| 107 | Fornix.l | white_matter | left | Telencephalon | 1 | 1 | 2158 | yes | White matter |
| 108 | Fornix.r | white_matter | right | Telencephalon | 1 | 1 | 2158 | yes | White matter |
| 109 | Fourth ventricle | ventricles | median | Brainstem | 1 | 1 | 5798 | no (34/2) | LCR |
| 110 | Frontal aslant tract.l | tracts | left | Left cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 111 | Frontal aslant tract.r | tracts | right | Right cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 112 | Frontal branches of callosomarginal artery.l | arteries | left | arteries | 0 | 1 | 1356 | yes | Artery |
| 113 | Frontal branches of callosomarginal artery.r | arteries | right | arteries | 0 | 1 | 1356 | yes | Artery |
| 114 | Globus pallidus external.l | deep_grey | left | Telencephalon | 1 | 1 | 1000 | yes | (none) |
| 115 | Globus pallidus external.r | deep_grey | right | Telencephalon | 1 | 1 | 1000 | yes | (none) |
| 116 | Globus pallidus internal.l | deep_grey | left | Telencephalon | 1 | 1 | 1000 | yes | (none) |
| 117 | Globus pallidus internal.r | deep_grey | right | Telencephalon | 1 | 1 | 1000 | yes | (none) |
| 118 | Gracile lobule.l | cerebellum | left | Cerebellum | 1 | 1 | 6961 | no (3/0) | Cerebellum |
| 119 | Gracile lobule.r | cerebellum | right | Cerebellum | 1 | 1 | 6961 | no (3/0) | Cerebellum |
| 120 | Habenula | diencephalon | median | Diencephalon | 1 | 1 | 400 | no (10/12) | Nucleus |
| 121 | Hippocampal commissure | white_matter | median | Telencephalon | 1 | 1 | 9857 | no (236/243) | White matter |
| 122 | Hippocampus.l | cortex | left | Limbic lobe | 1 | 1 | 1020 | yes | Nucleus |
| 123 | Hippocampus.r | cortex | right | Limbic lobe | 1 | 1 | 1020 | yes | Nucleus |
| 124 | Hypoglossal nerve (XII).l | cranial_nerves | left | cranial_nerves | 0 | 1 | 10848 | yes | Bone-4 |
| 125 | Hypoglossal nerve (XII).r | cranial_nerves | right | cranial_nerves | 0 | 1 | 10848 | yes | Bone-4 |
| 126 | Inferior alveolar nerve.l | cranial_nerves | left | cranial_nerves | 0 | 1 | 11280 | yes | Nerve |
| 127 | Inferior alveolar nerve.r | cranial_nerves | right | cranial_nerves | 0 | 1 | 11280 | yes | Nerve |
| 128 | Inferior cerebellar peduncle.l | tracts | left | Cerebellum | 0 | 1 | 956 | yes | (none) |
| 129 | Inferior cerebellar peduncle.r | tracts | right | Cerebellum | 0 | 1 | 956 | yes | (none) |
| 130 | Inferior colliculus.l | brainstem | left | Brainstem | 1 | 1 | 464 | yes | Nucleus |
| 131 | Inferior colliculus.r | brainstem | right | Brainstem | 1 | 1 | 464 | yes | Nucleus |
| 132 | Inferior fronto-occipital fasciculus.l | tracts | left | Left cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 133 | Inferior fronto-occipital fasciculus.r | tracts | right | Right cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 134 | Inferior longitudinal fasciculus.l | tracts | left | Left cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 135 | Inferior longitudinal fasciculus.r | tracts | right | Right cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 136 | Inferior occipital gyrus and sulcus*.l | cortex | left | Occipital lobe | 1 | 2 | 894 | no (44/0) | Temporal lobe + Brain-Inner |
| 137 | Inferior occipital gyrus and sulcus*.r | cortex | right | Occipital lobe | 1 | 2 | 894 | no (44/0) | Temporal lobe + Brain-Inner |
| 138 | Inferior petrosal sinus.l | veins_sinuses | left | veins_sinuses | 0 | 1 | 1164 | yes | Artery |
| 139 | Inferior petrosal sinus.r | veins_sinuses | right | veins_sinuses | 0 | 1 | 1164 | yes | Artery |
| 140 | Inferior sagittal sinus | veins_sinuses | median | veins_sinuses | 0 | 1 | 2316 | yes | Artery |
| 141 | Inferior semilunar lobule.l | cerebellum | left | Cerebellum | 1 | 1 | 7787 | no (3/0) | Cerebellum |
| 142 | Inferior semilunar lobule.r | cerebellum | right | Cerebellum | 1 | 1 | 7787 | no (3/0) | Cerebellum |
| 143 | Inferior temporal gyrus.l | cortex | left | Temporal lobe | 1 | 2 | 1498 | no (36/2) | Temporal lobe + Brain |
| 144 | Inferior temporal gyrus.r | cortex | right | Temporal lobe | 1 | 2 | 1498 | no (36/2) | Temporal lobe + Brain |
| 145 | Insula (Subcentral gyrus and ant. and post. sulci*).l | cortex | left | Insula | 1 | 2 | 740 | no (52/0) | Temporal lobe + Brain-Inner |
| 146 | Insula (Subcentral gyrus and ant. and post. sulci*).r | cortex | right | Insula | 1 | 2 | 740 | no (56/0) | Temporal lobe + Brain-Inner |
| 147 | Insular branches of middle cerebral artery (M2).r | arteries | right | arteries | 0 | 1 | 1176 | yes | Artery |
| 148 | Insular branches of middle cerebral artery (M2-segment).l | arteries | left | arteries | 0 | 1 | 1176 | yes | Artery |
| 149 | Internal carotid artery.l | arteries | left | arteries | 0 | 1 | 1932 | yes | Artery |
| 150 | Internal carotid artery.r | arteries | right | arteries | 0 | 1 | 1932 | yes | Artery |
| 151 | Interpeduncular fossa.l | brainstem | left | Brainstem | 1 | 1 | 58 | yes | Brain |
| 152 | Interpeduncular fossa.r | brainstem | right | Brainstem | 1 | 1 | 58 | yes | Brain |
| 153 | Intralaminar and lateral posterior nuclei.l | diencephalon | left | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 154 | Intralaminar and lateral posterior nuclei.r | diencephalon | right | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 155 | Lat_Fis-ant-Horizont.l | cortex | left | Frontal lobe | 1 | 2 | 174 | no (4/0) | Temporal lobe + Brain-Inner |
| 156 | Lat_Fis-ant-Horizont.r | cortex | right | Frontal lobe | 1 | 2 | 174 | no (4/0) | Temporal lobe + Brain-Inner |
| 157 | Lat_Fis-ant-Vertical.l | cortex | left | Frontal lobe | 1 | 2 | 194 | no (8/0) | Temporal lobe + Brain-Inner |
| 158 | Lat_Fis-ant-Vertical.r | cortex | right | Frontal lobe | 1 | 2 | 194 | no (8/0) | Temporal lobe + Brain-Inner |
| 159 | Lat_Fis-post.l | cortex | left | Telencephalon | 1 | 2 | 480 | no (24/0) | Temporal lobe + Brain-Inner |
| 160 | Lat_Fis-post.r | cortex | right | Telencephalon | 1 | 2 | 480 | no (24/0) | Temporal lobe + Brain-Inner |
| 161 | Lateral geniculate body.l | diencephalon | left | Diencephalon | 1 | 1 | 604 | yes | Nucleus |
| 162 | Lateral geniculate body.r | diencephalon | right | Diencephalon | 1 | 1 | 604 | yes | Nucleus |
| 163 | Lateral hypothalamus.l | diencephalon | left | Diencephalon | 1 | 1 | 995 | no (10/7) | (none) |
| 164 | Lateral hypothalamus.r | diencephalon | right | Diencephalon | 1 | 1 | 994 | no (10/8) | (none) |
| 165 | Lateral nucleus.l | deep_grey | left | Telencephalon | 1 | 1 | 1000 | yes | (none) |
| 166 | Lateral nucleus.r | deep_grey | right | Telencephalon | 1 | 1 | 1000 | yes | (none) |
| 167 | Lateral occipital gyrus (Middle occipital gyrus*).l | cortex | left | Occipital lobe | 1 | 2 | 854 | yes | Temporal lobe + Brain-Inner |
| 168 | Lateral occipital gyrus (Middle occipital gyrus*).r | cortex | right | Occipital lobe | 1 | 2 | 854 | no (72/0) | Temporal lobe + Brain-Inner |
| 169 | Lateral occipitotemporal gyrus.l | cortex | left | Temporal lobe | 1 | 2 | 866 | no (74/0) | Temporal lobe + Brain-Inner |
| 170 | Lateral occipitotemporal gyrus.r | cortex | right | Temporal lobe | 1 | 2 | 866 | no (68/0) | Temporal lobe + Brain-Inner |
| 171 | Lateral pontine branches of basilar artery.l | arteries | left | arteries | 0 | 1 | 2328 | yes | Artery |
| 172 | Lateral pontine branches of basilar artery.r | arteries | right | arteries | 0 | 1 | 2328 | yes | Artery |
| 173 | Lateral ventricle.l | ventricles | left | Telencephalon | 1 | 1 | 2898 | yes | LCR |
| 174 | Lateral ventricle.r | ventricles | right | Telencephalon | 1 | 1 | 2898 | yes | LCR |
| 175 | Lingual gyrus.l | cortex | left | Occipital lobe | 1 | 2 | 1658 | no (147/4) | Temporal lobe + Brain-Inner |
| 176 | Lingual gyrus.r | cortex | right | Occipital lobe | 1 | 2 | 1658 | no (145/4) | Temporal lobe + Brain-Inner |
| 177 | Lingual nerve.l | cranial_nerves | left | cranial_nerves | 0 | 1 | 1740 | yes | Nerve |
| 178 | Lingual nerve.r | cranial_nerves | right | cranial_nerves | 0 | 1 | 1740 | yes | Nerve |
| 179 | Lingula of cerebellum | cerebellum | median | Cerebellum | 1 | 1 | 1028 | yes | Cerebellum |
| 180 | Lunate sulcus.l | cortex | left | Occipital lobe | 1 | 2 | 382 | no (44/0) | Temporal lobe + Brain-Inner |
| 181 | Lunate sulcus.r | cortex | right | Occipital lobe | 1 | 2 | 382 | no (41/1) | Temporal lobe + Brain-Inner |
| 182 | Mamillary body.l | diencephalon | left | Diencephalon | 1 | 1 | 220 | yes | Nucleus |
| 183 | Mamillary body.r | diencephalon | right | Diencephalon | 1 | 1 | 220 | yes | Nucleus |
| 184 | Maxillary nerve.l | cranial_nerves | left | cranial_nerves | 0 | 1 | 5244 | yes | Nerve |
| 185 | Maxillary nerve.r | cranial_nerves | right | cranial_nerves | 0 | 1 | 5244 | yes | Nerve |
| 186 | Medial geniculate body.l | diencephalon | left | Diencephalon | 1 | 1 | 198 | yes | Nucleus |
| 187 | Medial geniculate body.r | diencephalon | right | Diencephalon | 1 | 1 | 198 | yes | Nucleus |
| 188 | Medial lemniscus.l | tracts | left | Brainstem | 0 | 1 | 956 | yes | (none) |
| 189 | Medial lemniscus.r | tracts | right | Brainstem | 0 | 1 | 956 | yes | (none) |
| 190 | Medial occipitotemporal gyrus (Parahippocampal*).l | cortex | left | Temporal lobe | 1 | 2 | 858 | no (136/0) | Temporal lobe + Brain-Inner |
| 191 | Medial occipitotemporal gyrus (Parahippocampal*).r | cortex | right | Temporal lobe | 1 | 2 | 858 | no (130/0) | Temporal lobe + Brain-Inner |
| 192 | Medial pontine branches of basilar artery.l | arteries | left | arteries | 0 | 1 | 1560 | yes | Artery |
| 193 | Medial pontine branches of basilar artery.r | arteries | right | arteries | 0 | 1 | 1560 | yes | Artery |
| 194 | Mediodorsal nucleus.l | diencephalon | left | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 195 | Mediodorsal nucleus.r | diencephalon | right | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 196 | Medulla oblongata.l | brainstem | left | Brainstem | 1 | 1 | 6080 | yes | Brain |
| 197 | Meningeal branch of maxillary nerve.l | cranial_nerves | left | cranial_nerves | 0 | 1 | 4068 | yes | Nerve |
| 198 | Meningeal branch of maxillary nerve.r | cranial_nerves | right | cranial_nerves | 0 | 1 | 4068 | yes | Nerve |
| 199 | Mental nerve.l | cranial_nerves | left | cranial_nerves | 0 | 1 | 1764 | no (0/13) | Nerve |
| 200 | Mental nerve.r | cranial_nerves | right | cranial_nerves | 0 | 1 | 1764 | no (0/13) | Nerve |
| 201 | Midbrain.l | brainstem | left | Brainstem | 1 | 1 | 6092 | no (4/2) | Temporal lobe |
| 202 | Midbrain.r | brainstem | right | Brainstem | 1 | 1 | 6092 | no (4/2) | Temporal lobe |
| 203 | Middle cerebellar peduncle | tracts | median | Cerebellum | 0 | 1 | 956 | yes | (none) |
| 204 | Middle cerebral artery (M1-segment).l | arteries | left | arteries | 0 | 1 | 972 | no (0/2) | Artery |
| 205 | Middle cerebral artery (M1-segment).r | arteries | right | arteries | 0 | 1 | 972 | no (0/2) | Artery |
| 206 | Middle cerebral artery (M3 segment).l | arteries | left | arteries | 0 | 1 | 2508 | yes | Artery |
| 207 | Middle cerebral artery (M3-segment).r | arteries | right | arteries | 0 | 1 | 2508 | yes | Artery |
| 208 | Middle frontal gyrus.l | cortex | left | Frontal lobe | 1 | 2 | 2277 | no (171/0) | Temporal lobe + Brain-Inner |
| 209 | Middle frontal gyrus.r | cortex | right | Frontal lobe | 1 | 2 | 2277 | no (185/0) | Temporal lobe + Brain-Inner |
| 210 | Middle longitudinal fasciculus.l | tracts | left | Left cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 211 | Middle longitudinal fasciculus.r | tracts | right | Right cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 212 | Middle temporal gyrus.l | cortex | left | Temporal lobe | 1 | 2 | 1312 | no (156/0) | Temporal lobe + Brain-Inner |
| 213 | Middle temporal gyrus.r | cortex | right | Temporal lobe | 1 | 2 | 1312 | no (158/0) | Temporal lobe + Brain-Inner |
| 214 | Motor nucleus of facial nerve.l | brainstem | left | Brainstem | 1 | 1 | 768 | yes | Nucleus (efferent fibers) |
| 215 | Motor nucleus of facial nerve.r | brainstem | right | Brainstem | 1 | 1 | 768 | yes | Nucleus (efferent fibers) |
| 216 | Motor root of trigeminal nerve.l | cranial_nerves | left | cranial_nerves | 0 | 1 | 960 | yes | Nerve |
| 217 | Motor root of trigeminal nerve.r | cranial_nerves | right | cranial_nerves | 0 | 1 | 960 | yes | Nerve |
| 218 | Neurohypophysis | diencephalon | median | Diencephalon | 1 | 1 | 592 | no (56/0) | Nucleus |
| 219 | Nodule of vermis | cerebellum | median | Cerebellum | 1 | 1 | 1012 | yes | Cerebellum |
| 220 | Nucleus accumbens.l | deep_grey | left | Telencephalon | 1 | 1 | 980 | yes | (none) |
| 221 | Nucleus accumbens.r | deep_grey | right | Telencephalon | 1 | 1 | 968 | yes | (none) |
| 222 | Nucleus of abducens nerve.l | brainstem | left | Brainstem | 1 | 1 | 768 | yes | Nucleus (efferent fibers) |
| 223 | Nucleus of abducens nerve.r | brainstem | right | Brainstem | 1 | 1 | 768 | yes | Nucleus (efferent fibers) |
| 224 | Nucleus of oculomotor nerve.l | brainstem | left | Brainstem | 1 | 1 | 768 | yes | Nucleus (efferent fibers) |
| 225 | Nucleus of oculomotor nerve.r | brainstem | right | Brainstem | 1 | 1 | 768 | yes | Nucleus (efferent fibers) |
| 226 | Occipital pole.l | cortex | left | Occipital lobe | 1 | 2 | 954 | no (74/0) | Temporal lobe + Brain-Inner |
| 227 | Occipital pole.r | cortex | right | Occipital lobe | 1 | 2 | 954 | no (82/0) | Temporal lobe + Brain-Inner |
| 228 | Occipital sinus | veins_sinuses | median | veins_sinuses | 0 | 1 | 780 | yes | Artery |
| 229 | Occipitotemporal sulcus (Lateral part*).l | cortex | left | Temporal lobe | 1 | 2 | 487 | no (29/2) | Temporal lobe + Brain-Inner |
| 230 | Occipitotemporal sulcus (Lateral part*).r | cortex | right | Temporal lobe | 1 | 2 | 487 | no (25/2) | Temporal lobe + Brain-Inner |
| 231 | Oculomotor nerve (III).l | cranial_nerves | left | cranial_nerves | 0 | 1 | 5844 | yes | Nerve |
| 232 | Oculomotor nerve (III).r | cranial_nerves | right | cranial_nerves | 0 | 1 | 5844 | yes | Nerve |
| 233 | Olfactory nerve (I).l | cranial_nerves | left | cranial_nerves | 0 | 1 | 17940 | yes | Nerve |
| 234 | Olfactory nerve (I).r | cranial_nerves | right | cranial_nerves | 0 | 1 | 17940 | yes | Nerve |
| 235 | Olive.l | brainstem | left | Brainstem | 1 | 1 | 960 | yes | Nucleus |
| 236 | Olive.r | brainstem | right | Brainstem | 1 | 1 | 960 | yes | Nucleus |
| 237 | Ophthalmic artery.l | arteries | left | arteries | 0 | 1 | 1164 | yes | Artery |
| 238 | Ophthalmic artery.r | arteries | right | arteries | 0 | 1 | 1164 | yes | Artery |
| 239 | Ophthalmic nerve.l | cranial_nerves | left | cranial_nerves | 0 | 1 | 4476 | yes | Nerve |
| 240 | Ophthalmic nerve.r | cranial_nerves | right | cranial_nerves | 0 | 1 | 4476 | yes | Nerve |
| 241 | Optic chiasm.l | diencephalon | left | Diencephalon | 1 | 1 | 890 | yes | Nerve |
| 242 | Optic chiasm.r | diencephalon | right | Diencephalon | 1 | 1 | 890 | yes | Nerve |
| 243 | Optic nerve (II).l | cranial_nerves | left | cranial_nerves | 0 | 1 | 1164 | yes | Nerve |
| 244 | Optic nerve (II).r | cranial_nerves | right | cranial_nerves | 0 | 1 | 1164 | yes | Nerve |
| 245 | Optic radiation.l | tracts | left | Occipital lobe | 0 | 1 | 956 | yes | (none) |
| 246 | Optic radiation.r | tracts | right | Occipital lobe | 0 | 1 | 956 | yes | (none) |
| 247 | Optic tract.l | diencephalon | left | Diencephalon | 1 | 1 | 2332 | yes | Nerve |
| 248 | Optic tract.r | diencephalon | right | Diencephalon | 1 | 1 | 2332 | yes | Nerve |
| 249 | Orbital gyri (Frontomarginal gyrus and sulcus*).l | cortex | left | Frontal lobe | 1 | 2 | 656 | no (16/0) | Temporal lobe + Brain-Inner |
| 250 | Orbital gyri (Frontomarginal gyrus and sulcus*).r | cortex | right | Frontal lobe | 1 | 2 | 656 | no (16/0) | Temporal lobe + Brain-Inner |
| 251 | Orbital gyri.l | cortex | left | Frontal lobe | 1 | 2 | 1512 | no (68/0) | Temporal lobe + Brain-Inner |
| 252 | Orbital gyri.r | cortex | right | Frontal lobe | 1 | 2 | 1512 | no (68/0) | Temporal lobe + Brain-Inner |
| 253 | Orbital part of  inferior frontal gyrus.l | cortex | left | Frontal lobe | 1 | 2 | 186 | no (4/0) | Temporal lobe + Brain-Inner |
| 254 | Orbital part of  inferior frontal gyrus.r | cortex | right | Frontal lobe | 1 | 2 | 186 | yes | Temporal lobe + Brain-Inner |
| 255 | Orbital sulci (H-shaped orbital sulci*).l | cortex | left | Frontal lobe | 1 | 2 | 762 | no (42/0) | Temporal lobe + Brain-Inner |
| 256 | Orbital sulci (H-shaped orbital sulci*).r | cortex | right | Frontal lobe | 1 | 2 | 762 | no (42/0) | Temporal lobe + Brain-Inner |
| 257 | Orbital sulci (Lateral Orbital sulcus*).l | cortex | left | Frontal lobe | 1 | 2 | 200 | no (12/0) | Temporal lobe + Brain-Inner |
| 258 | Orbital sulci (Lateral Orbital sulcus*).r | cortex | right | Frontal lobe | 1 | 2 | 200 | no (14/0) | Temporal lobe + Brain-Inner |
| 259 | Orbitofrontal branches of anterior cerebral artery.l | arteries | left | arteries | 0 | 1 | 3096 | yes | Artery |
| 260 | Orbitofrontal branches of anterior cerebral artery.r | arteries | right | arteries | 0 | 1 | 3096 | yes | Artery |
| 261 | Paracentral gyrus and sulcus*.l | cortex | left | Frontal lobe | 1 | 2 | 746 | no (54/0) | Temporal lobe + Brain-Inner |
| 262 | Paracentral gyrus and sulcus*.r | cortex | right | Frontal lobe | 1 | 2 | 746 | no (56/0) | Temporal lobe + Brain-Inner |
| 263 | Parietal branches of middle cerebral artery.l | arteries | left | arteries | 0 | 1 | 2712 | yes | Artery |
| 264 | Parietal branches of middle cerebral artery.r | arteries | right | arteries | 0 | 1 | 2712 | yes | Artery |
| 265 | Peduncle of flocculus.l | cerebellum | left | Cerebellum | 1 | 1 | 2368 | yes | Cerebellum |
| 266 | Peduncle of flocculus.r | cerebellum | right | Cerebellum | 1 | 1 | 2368 | yes | Cerebellum |
| 267 | Pericallosal artery.l | arteries | left | arteries | 0 | 1 | 21636 | yes | Artery |
| 268 | Pericallosal artery.r | arteries | right | arteries | 0 | 1 | 21636 | yes | Artery |
| 269 | Postcentral gyrus.l | cortex | left | Parietal lobe | 1 | 2 | 1153 | no (123/0) | Temporal lobe + Brain-Inner |
| 270 | Postcentral gyrus.r | cortex | right | Parietal lobe | 1 | 2 | 1153 | no (134/1) | Temporal lobe + Brain-Inner |
| 271 | Posterior cerebral artery.l | arteries | left | arteries | 0 | 1 | 22608 | yes | Artery |
| 272 | Posterior cerebral artery.r | arteries | right | arteries | 0 | 1 | 22608 | yes | Artery |
| 273 | Posterior commissure | diencephalon | median | Diencephalon | 1 | 1 | 864 | no (18/20) | White matter |
| 274 | Posterior communicating artery.l | arteries | left | arteries | 0 | 1 | 588 | yes | Artery |
| 275 | Posterior communicating artery.r | arteries | right | arteries | 0 | 1 | 588 | yes | Artery |
| 276 | Posterior division of mandibular nerve.l | cranial_nerves | left | cranial_nerves | 0 | 1 | 588 | yes | Nerve |
| 277 | Posterior division of mandibular nerve.r | cranial_nerves | right | cranial_nerves | 0 | 1 | 588 | yes | Nerve |
| 278 | Posterior hypothalamus.l | diencephalon | left | Diencephalon | 1 | 1 | 752 | yes | (none) |
| 279 | Posterior hypothalamus.r | diencephalon | right | Diencephalon | 1 | 1 | 680 | yes | (none) |
| 280 | Posterior inferior cerebellar artery.l | arteries | left | arteries | 0 | 1 | 25308 | yes | Artery |
| 281 | Posterior inferior cerebellar artery.r | arteries | right | arteries | 0 | 1 | 25308 | yes | Artery |
| 282 | Posterior thalamic radiation.l | tracts | left | Diencephalon | 0 | 1 | 956 | yes | (none) |
| 283 | Posterior thalamic radiation.r | tracts | right | Diencephalon | 0 | 1 | 956 | yes | (none) |
| 284 | Precentral gyrus.l | cortex | left | Frontal lobe | 1 | 2 | 1532 | no (1/3) | Temporal lobe + Brain-Inner |
| 285 | Precentral gyrus.r | cortex | right | Frontal lobe | 1 | 2 | 1532 | no (124/2) | Temporal lobe + Brain-Inner |
| 286 | Precuneus.l | cortex | left | Parietal lobe | 1 | 2 | 1300 | no (148/0) | Temporal lobe + Brain-Inner |
| 287 | Precuneus.r | cortex | right | Parietal lobe | 1 | 2 | 1300 | no (142/0) | Temporal lobe + Brain-Inner |
| 288 | Preoptic hypothalamus.l | diencephalon | left | Diencephalon | 1 | 1 | 478 | yes | (none) |
| 289 | Preoptic hypothalamus.r | diencephalon | right | Diencephalon | 1 | 1 | 402 | yes | (none) |
| 290 | Pulvinar.l | diencephalon | left | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 291 | Pulvinar.r | diencephalon | right | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 292 | Red nucleus.l | brainstem | left | Brainstem | 1 | 1 | 704 | yes | Nucleus |
| 293 | Red nucleus.r | brainstem | right | Brainstem | 1 | 1 | 704 | yes | Nucleus |
| 294 | Reticulospinal tract.l | tracts | left | Brainstem | 0 | 1 | 956 | yes | (none) |
| 295 | Reticulospinal tract.r | tracts | right | Brainstem | 0 | 1 | 956 | yes | (none) |
| 296 | Septal nuclei | deep_grey | median | Telencephalon | 1 | 1 | 548 | yes | Nucleus |
| 297 | Inferior frontal sulcus.l | cortex | left | Frontal lobe | 1 | 2 | 742 | no (62/0) | Temporal lobe + Brain-Inner |
| 298 | Inferior frontal sulcus.r | cortex | right | Frontal lobe | 1 | 2 | 742 | no (56/0) | Temporal lobe + Brain-Inner |
| 299 | Inferior temporal sulcus.l | cortex | left | Temporal lobe | 1 | 2 | 246 | no (12/0) | Temporal lobe + Brain-Inner |
| 300 | Inferior temporal sulcus.r | cortex | right | Temporal lobe | 1 | 2 | 246 | no (20/0) | Temporal lobe + Brain-Inner |
| 301 | Intraparietal sulcus.l | cortex | left | Parietal lobe | 1 | 2 | 852 | no (46/0) | Temporal lobe + Brain-Inner |
| 302 | Intraparietal sulcus.r | cortex | right | Parietal lobe | 1 | 2 | 852 | no (46/0) | Temporal lobe + Brain-Inner |
| 303 | Olfactory sulcus.l | cortex | left | Frontal lobe | 1 | 2 | 548 | yes | Temporal lobe + Brain-Inner |
| 304 | Olfactory sulcus.r | cortex | right | Frontal lobe | 1 | 2 | 548 | yes | Temporal lobe + Brain-Inner |
| 305 | Opercular part of inferior frontal gyrus.l | cortex | left | Frontal lobe | 1 | 2 | 740 | no (58/0) | Temporal lobe + Brain-Inner |
| 306 | Opercular part of inferior frontal gyrus.r | cortex | right | Frontal lobe | 1 | 2 | 740 | no (86/0) | Temporal lobe + Brain-Inner |
| 307 | Paracentral sulcus.l | cortex | left | Frontal lobe | 1 | 2 | 668 | no (72/0) | Temporal lobe + Brain-Inner |
| 308 | Paracentral sulcus.r | cortex | right | Frontal lobe | 1 | 2 | 668 | no (74/0) | Temporal lobe + Brain-Inner |
| 309 | Parieto-occipital sulcus.l | cortex | left | Telencephalon | 1 | 2 | 1636 | no (74/582) | Temporal lobe + Brain-Inner |
| 310 | Parieto-occipital sulcus.r | cortex | right | Telencephalon | 1 | 2 | 1636 | no (72/579) | Temporal lobe + Brain-Inner |
| 311 | Pineal gland | diencephalon | median | Diencephalon | 1 | 1 | 634 | yes | Nucleus |
| 312 | Pons.l | brainstem | left | Brainstem | 1 | 1 | 10171 | no (1/6) | Brain |
| 313 | Pons.r | brainstem | right | Brainstem | 1 | 1 | 10171 | no (1/6) | Brain |
| 314 | Postcentral sulcus.l | cortex | left | Parietal lobe | 1 | 2 | 1189 | no (115/2) | Temporal lobe + Brain-Inner |
| 315 | Postcentral sulcus.r | cortex | right | Parietal lobe | 1 | 2 | 1189 | no (101/2) | Temporal lobe + Brain-Inner |
| 316 | Posterior intercavernous sinus | veins_sinuses | median | veins_sinuses | 0 | 1 | 972 | yes | Artery |
| 317 | Posterior quadrangular lobule.l | cerebellum | left | Cerebellum | 1 | 1 | 3618 | yes | Cerebellum |
| 318 | Posterior quadrangular lobule.r | cerebellum | right | Cerebellum | 1 | 1 | 3618 | yes | Cerebellum |
| 319 | Precentral sulcus (inferior part)*.l | cortex | left | Frontal lobe | 1 | 2 | 780 | no (86/1) | Temporal lobe + Brain-Inner |
| 320 | Precentral sulcus (inferior part)*.r | cortex | right | Frontal lobe | 1 | 2 | 780 | no (95/1) | Temporal lobe + Brain-Inner |
| 321 | Precentral sulcus (Superior part)*.l | cortex | left | Frontal lobe | 1 | 2 | 568 | no (28/0) | Temporal lobe + Brain-Inner |
| 322 | Precentral sulcus (Superior part)*.r | cortex | right | Frontal lobe | 1 | 2 | 568 | no (32/0) | Temporal lobe + Brain-Inner |
| 323 | Proximal lateral striate branches.l | arteries | left | arteries | 0 | 1 | 5256 | yes | Artery |
| 324 | Proximal lateral striate branches.r | arteries | right | arteries | 0 | 1 | 5256 | yes | Artery |
| 325 | Putamen.l | deep_grey | left | Telencephalon | 1 | 1 | 1150 | yes | Nucleus |
| 326 | Putamen.r | deep_grey | right | Telencephalon | 1 | 1 | 1150 | yes | Nucleus |
| 327 | Pyramid of medulla oblongata.l | brainstem | left | Brainstem | 1 | 1 | 960 | yes | Nucleus |
| 328 | Pyramid of medulla oblongata.r | brainstem | right | Brainstem | 1 | 1 | 960 | yes | Nucleus |
| 329 | Pyramis of vermis | cerebellum | median | Cerebellum | 1 | 1 | 1182 | yes | Cerebellum |
| 330 | Sensory root of trigeminal nerve.l | cranial_nerves | left | cranial_nerves | 0 | 1 | 2752 | yes | Nucleus (afferent fibers) |
| 331 | Sensory root of trigeminal nerve.r | cranial_nerves | right | cranial_nerves | 0 | 1 | 2752 | yes | Nucleus (afferent fibers) |
| 332 | Septum pellucidum | ventricles | median | Telencephalon | 1 | 1 | 2388 | no (23/38) | White matter |
| 333 | Sigmoid sinus.l | veins_sinuses | left | veins_sinuses | 0 | 1 | 588 | yes | Artery |
| 334 | Sigmoid sinus.r | veins_sinuses | right | veins_sinuses | 0 | 1 | 588 | yes | Artery |
| 335 | Straight gyrus (Gyrus rectus).l | cortex | left | Frontal lobe | 1 | 2 | 508 | no (60/0) | Temporal lobe + Brain-Inner |
| 336 | Straight gyrus (Gyrus rectus).r | cortex | right | Frontal lobe | 1 | 2 | 508 | no (64/0) | Temporal lobe + Brain-Inner |
| 337 | Straight sinus | veins_sinuses | median | veins_sinuses | 0 | 1 | 1548 | yes | Artery |
| 338 | Stria medullaris thalami.l | diencephalon | left | Diencephalon | 1 | 1 | 842 | yes | White matter |
| 339 | Stria medullaris thalami.r | diencephalon | right | Diencephalon | 1 | 1 | 842 | yes | White matter |
| 340 | Stria terminalis.l | white_matter | left | Telencephalon | 1 | 1 | 746 | yes | Nerve |
| 341 | Stria terminalis.r | white_matter | right | Telencephalon | 1 | 1 | 746 | yes | Nerve |
| 342 | Subparietal sulcus.l | cortex | left | Telencephalon | 1 | 2 | 561 | no (26/1) | Temporal lobe + Brain-Inner |
| 343 | Subparietal sulcus.r | cortex | right | Telencephalon | 1 | 2 | 561 | no (44/1) | Temporal lobe + Brain-Inner |
| 344 | Substantia nigra.l | deep_grey | left | Mesencephalon | 1 | 1 | 1000 | yes | (none) |
| 345 | Substantia nigra.r | deep_grey | right | Mesencephalon | 1 | 1 | 1000 | yes | (none) |
| 346 | Subthalamic nucleus.l | deep_grey | left | Diencephalon | 1 | 1 | 616 | yes | (none) |
| 347 | Subthalamic nucleus.r | deep_grey | right | Diencephalon | 1 | 1 | 544 | yes | (none) |
| 348 | Sulcus interm_prim-Jensen.l | cortex | left | Telencephalon | 1 | 2 | 360 | no (34/0) | Temporal lobe + Brain-Inner |
| 349 | Sulcus interm_prim-Jensen.r | cortex | right | Telencephalon | 1 | 2 | 360 | no (30/0) | Temporal lobe + Brain-Inner |
| 350 | Superior cerebellar artery.l | arteries | left | arteries | 0 | 1 | 7344 | yes | Artery |
| 351 | Superior cerebellar artery.r | arteries | right | arteries | 0 | 1 | 7344 | yes | Artery |
| 352 | Base of peduncle.l | cerebellum | left | Cerebellum | 1 | 1 | 5046 | no (7/1) | Brain |
| 353 | Base of peduncle.r | cerebellum | right | Cerebellum | 1 | 1 | 5046 | no (7/1) | Brain |
| 354 | Superior cerebellar peduncle | tracts | median | Cerebellum | 0 | 1 | 956 | yes | (none) |
| 355 | Superior cerebellar peduncle.l | cerebellum | left | Cerebellum | 1 | 1 | 8474 | yes | Cerebellum |
| 356 | Superior cerebellar peduncle.r | cerebellum | right | Cerebellum | 1 | 1 | 8474 | yes | Cerebellum |
| 357 | Superior colliculus.l | brainstem | left | Brainstem | 1 | 1 | 458 | yes | Nucleus |
| 358 | Superior colliculus.r | brainstem | right | Brainstem | 1 | 1 | 458 | yes | Nucleus |
| 359 | Superior frontal gyrus.l | cortex | left | Frontal lobe | 1 | 2 | 3735 | no (131/0) | Temporal lobe + Brain-Inner |
| 360 | Superior frontal gyrus.r | cortex | right | Frontal lobe | 1 | 2 | 3735 | no (11/0) | Temporal lobe + Brain-Inner |
| 361 | Superior frontal sulcus.l | cortex | left | Frontal lobe | 1 | 2 | 1290 | no (111/4) | Temporal lobe + Brain-Inner |
| 362 | Superior frontal sulcus.r | cortex | right | Frontal lobe | 1 | 2 | 1290 | no (129/4) | Temporal lobe + Brain-Inner |
| 363 | Superior longitudinal fasciculus I.l | tracts | left | Left cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 364 | Superior longitudinal fasciculus I.r | tracts | right | Right cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 365 | Superior longitudinal fasciculus II.l | tracts | left | Left cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 366 | Superior longitudinal fasciculus II.r | tracts | right | Right cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 367 | Superior longitudinal fasciculus III.l | tracts | left | Left cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 368 | Superior longitudinal fasciculus III.r | tracts | right | Right cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 369 | Superior occipital gyri.l | cortex | left | Occipital lobe | 1 | 2 | 670 | yes | Temporal lobe + Brain-Inner |
| 370 | Superior occipital gyri.r | cortex | right | Occipital lobe | 1 | 2 | 670 | yes | Temporal lobe + Brain-Inner |
| 371 | Superior parietal lobule.l | cortex | left | Parietal lobe | 1 | 2 | 1199 | no (5/0) | Temporal lobe + Brain-Inner |
| 372 | Superior parietal lobule.r | cortex | right | Parietal lobe | 1 | 2 | 1199 | no (37/0) | Temporal lobe + Brain-Inner |
| 373 | Superior petrosal sinus.l | veins_sinuses | left | veins_sinuses | 0 | 1 | 1164 | yes | Artery |
| 374 | Superior petrosal sinus.r | veins_sinuses | right | veins_sinuses | 0 | 1 | 1164 | yes | Artery |
| 375 | Superior sagittal sinus | veins_sinuses | median | veins_sinuses | 0 | 1 | 4236 | yes | Artery |
| 376 | Superior salivatory nucleus.l | brainstem | left | Brainstem | 1 | 1 | 768 | yes | Nucleus (efferent fibers) |
| 377 | Superior salivatory nucleus.r | brainstem | right | Brainstem | 1 | 1 | 768 | yes | Nucleus (efferent fibers) |
| 378 | Superior semilunar lobule.l | cerebellum | left | Cerebellum | 1 | 1 | 8688 | no (12/0) | Cerebellum |
| 379 | Superior semilunar lobule.r | cerebellum | right | Cerebellum | 1 | 1 | 8688 | no (12/0) | Cerebellum |
| 380 | Superior temporal gyrus (Lateral part).l | cortex | left | Temporal lobe | 1 | 2 | 1072 | no (140/0) | Temporal lobe + Brain-Inner |
| 381 | Superior temporal gyrus (Lateral part).r | cortex | right | Temporal lobe | 1 | 2 | 1072 | no (146/0) | Temporal lobe + Brain-Inner |
| 382 | Superior temporal sulcus.l | cortex | left | Temporal lobe | 1 | 2 | 2374 | no (266/0) | Temporal lobe + Brain-Inner |
| 383 | Superior temporal sulcus.r | cortex | right | Temporal lobe | 1 | 2 | 2374 | no (270/0) | Temporal lobe + Brain-Inner |
| 384 | Superior thalamic radiation.l | tracts | left | Diencephalon | 0 | 1 | 956 | yes | (none) |
| 385 | Superior thalamic radiation.r | tracts | right | Diencephalon | 0 | 1 | 956 | yes | (none) |
| 386 | Supramarginal gyrus.l | cortex | left | Parietal lobe | 1 | 2 | 1510 | no (114/4) | Temporal lobe + Brain-Inner |
| 387 | Supramarginal gyrus.r | cortex | right | Parietal lobe | 1 | 2 | 1510 | no (115/3) | Temporal lobe + Brain-Inner |
| 388 | Temporal branches of middle cerebral artery.l | arteries | left | arteries | 0 | 1 | 3480 | yes | Artery |
| 389 | Temporal branches of middle cerebral artery.r | arteries | right | arteries | 0 | 1 | 3480 | yes | Artery |
| 390 | Temporal plane.l | cortex | left | Temporal lobe | 1 | 2 | 556 | yes | Temporal lobe + Brain-Inner |
| 391 | Temporal plane.r | cortex | right | Temporal lobe | 1 | 2 | 556 | yes | Temporal lobe + Brain-Inner |
| 392 | Temporal pole.l | cortex | left | Temporal lobe | 1 | 2 | 523 | no (62/1) | Temporal lobe + Brain-Inner |
| 393 | Temporal pole.r | cortex | right | Temporal lobe | 1 | 2 | 523 | no (62/1) | Temporal lobe + Brain-Inner |
| 394 | Tentorium cerebelli.l | meninges_dura | left | meninges_dura | 0 | 1 | 4480 | yes | Cartilage |
| 395 | Tentorium cerebelli.r | meninges_dura | right | meninges_dura | 0 | 1 | 4480 | yes | Cartilage |
| 396 | Third ventricle | ventricles | median | Diencephalon | 1 | 1 | 4313 | no (20/19) | LCR |
| 397 | Tonsil of cerebellum.l | cerebellum | left | Cerebellum | 1 | 1 | 3638 | yes | Cerebellum |
| 398 | Tonsil of cerebellum.r | cerebellum | right | Cerebellum | 1 | 1 | 3638 | yes | Cerebellum |
| 399 | Transverse frontopolar gyrus and sulcus*.l | cortex | left | Frontal lobe | 1 | 2 | 242 | no (10/0) | Temporal lobe + Brain-Inner |
| 400 | Transverse frontopolar gyrus and sulcus*.r | cortex | right | Frontal lobe | 1 | 2 | 242 | no (10/0) | Temporal lobe + Brain-Inner |
| 401 | Transverse occipital sulcus.l | cortex | left | Occipital lobe | 1 | 2 | 686 | no (26/0) | Temporal lobe + Brain-Inner |
| 402 | Transverse occipital sulcus.r | cortex | right | Occipital lobe | 1 | 2 | 686 | no (32/0) | Temporal lobe + Brain-Inner |
| 403 | Transverse sinus.l | veins_sinuses | left | veins_sinuses | 0 | 1 | 1356 | yes | Artery |
| 404 | Transverse sinus.r | veins_sinuses | right | veins_sinuses | 0 | 1 | 1356 | yes | Artery |
| 405 | Transverse temporal gyri.l | cortex | left | Temporal lobe | 1 | 2 | 234 | no (12/0) | Temporal lobe + Brain-Inner |
| 406 | Transverse temporal gyri.r | cortex | right | Temporal lobe | 1 | 2 | 234 | no (12/0) | Temporal lobe + Brain-Inner |
| 407 | Triangular part of inferior frontal gyrus.l | cortex | left | Frontal lobe | 1 | 2 | 504 | no (12/0) | Temporal lobe + Brain-Inner |
| 408 | Triangular part of inferior frontal gyrus.r | cortex | right | Frontal lobe | 1 | 2 | 504 | no (24/0) | Temporal lobe + Brain-Inner |
| 409 | Trigeminal nerve (V).l | cranial_nerves | left | cranial_nerves | 0 | 1 | 1560 | yes | Nerve |
| 410 | Trigeminal nerve (V).r | cranial_nerves | right | cranial_nerves | 0 | 1 | 1560 | yes | Nerve |
| 411 | Trochlear nerve (IV).l | cranial_nerves | left | cranial_nerves | 0 | 1 | 2508 | yes | Nerve |
| 412 | Trochlear nerve (IV).r | cranial_nerves | right | cranial_nerves | 0 | 1 | 2508 | yes | Nerve |
| 413 | Tuber of vermis | cerebellum | median | Cerebellum | 1 | 1 | 1178 | yes | Cerebellum |
| 414 | Tuberal hypothalamus.l | diencephalon | left | Diencephalon | 1 | 1 | 1000 | no (0/1) | (none) |
| 415 | Tuberal hypothalamus.r | diencephalon | right | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 416 | Uncinate fasciculus.l | tracts | left | Left cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 417 | Uncinate fasciculus.r | tracts | right | Right cerebral hemisphere | 0 | 1 | 956 | yes | (none) |
| 418 | Uvula of vermis | cerebellum | median | Cerebellum | 1 | 1 | 2176 | yes | Cerebellum |
| 419 | Vagus nerve (X).l | cranial_nerves | left | cranial_nerves | 0 | 1 | 9684 | yes | Nerve |
| 420 | Vagus nerve (X).r | cranial_nerves | right | cranial_nerves | 0 | 1 | 30588 | no (0/1) | Nerve |
| 421 | Ventral anterior nucleus.l | diencephalon | left | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 422 | Ventral anterior nucleus.r | diencephalon | right | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 423 | Ventral laterodorsal nucleus.l | diencephalon | left | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 424 | Ventral laterodorsal nucleus.r | diencephalon | right | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 425 | Ventral lateroventral nucleus.l | diencephalon | left | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 426 | Ventral lateroventral nucleus.r | diencephalon | right | Diencephalon | 1 | 1 | 1000 | yes | (none) |
| 427 | Vertebral artery.l | arteries | left | arteries | 0 | 1 | 3276 | yes | Artery |
| 428 | Vertebral artery.r | arteries | right | arteries | 0 | 1 | 3276 | yes | Artery |
| 429 | Vestibular nerve.l | cranial_nerves | left | cranial_nerves | 0 | 1 | 3120 | yes | Nerve |
| 430 | Vestibular nerve.r | cranial_nerves | right | cranial_nerves | 0 | 1 | 3120 | yes | Nerve |
| 431 | Vestibular nuclei.l | brainstem | left | Brainstem | 1 | 1 | 1568 | yes | Nucleus (afferent fibers) |
| 432 | Vestibular nuclei.r | brainstem | right | Brainstem | 1 | 1 | 1568 | yes | Nucleus (afferent fibers) |
| 433 | White matter of telencephalon.l | white_matter | left | Telencephalon | 1 | 1 | 135288 | yes | White matter |
| 434 | White matter of telencephalon.r | white_matter | right | Telencephalon | 1 | 1 | 135288 | yes | White matter |
| 435 | Wing of central lobule.l | cerebellum | left | Cerebellum | 1 | 1 | 3144 | yes | Cerebellum |
| 436 | Wing of central lobule.r | cerebellum | right | Cerebellum | 1 | 1 | 3144 | yes | Cerebellum |
