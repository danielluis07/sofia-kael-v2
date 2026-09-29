# Curate the brain model at build time

The upstream Z-Anatomy GLB has 437 flat nodes: gyrus and sulcus patches, nuclei, vessels, nerves and tracts, with no lobe or Structure geometry. We don't regroup it at runtime. A committed script (`bun run build:brain`) reads the upstream file at a pinned commit and writes a curated `public/models/brain.glb`, which is committed too. It contains one mesh per Structure per side and nothing the Brain Explorer doesn't show. Every tool works on whole Structure-sides (Isolate, X-ray, hover and the Slice stencil caps), so baking that granularity in drops about 1M triangles and brings draw calls from ~325 to ~40. The node-to-Structure mapping lives in one module under `lib/brain/`, which both the script and the app import.

## Considered Options

- **Runtime lookup by `bx_label`.** No build step, but it ships 1.38M triangles and hundreds of draw calls. It also leaves welding, recentring and splitting the midline meshes to the browser on every load.
- **Midline meshes left whole during Split.** The corpus callosum would float in the gap and the vermis would sit as a lump between the cerebellar halves. Cutting them at x = 0 gives the textbook medial view instead.

## Decisions baked into the script

- **Source:** `itayinbarr/brainproject`, `brain-atlas/models/brain.glb` at commit `ac32adad68d86af019fa99ecbf56eaed85a0039e`. Group on the node extras (`bx_label`, `bx_side`), never on node names.
- **Output:** one node per Structure-side, named `<structure-id>.l` / `.r`, with extras `{ structure, side }`. Also `white-matter.l` / `.r` with `{ context: true }`: never selectable, shown and capped only during Slice, never part of X-ray. No materials (the app assigns porcelain). Positions and normals only. Recentred on the brain's own bounds, in metres. Draco.
- **Structures never overlap:** every node belongs to at most one Structure. The build fails if a core node is neither mapped nor listed as hidden, or if a Structure lacks a side.
- **Watertightness:** cortex vertices are welded at 0.1 mm, cortex only; other meshes keep the 0.01 mm weld.
- **Split:** the 22 midline meshes are mirror-symmetric, so the script cuts each at x = 0 into two halves and fills each cut face as a separate primitive. After that, every mesh is `.l` or `.r` and the whole brain separates. The right medulla is missing upstream, so it is made by mirroring `Medulla oblongata.l`. The ~15 Pons vertices that cross x = 0 are clamped.
- **X-ray layer:** the eight cortical Structures (four lobes, Insula, Precentral, Postcentral, Cingulate) are the outer layer. Everything else is deep.

## Mapping

Upstream names, one side shown; the other side mirrors it. "(cut)" means a midline mesh split at x = 0.

| Structure id | Upstream nodes |
|---|---|
| `frontal-lobe` | every `bx_region` Frontal patch except Precentral gyrus |
| `precentral-gyrus` | Precentral gyrus, Central sulcus |
| `postcentral-gyrus` | Postcentral gyrus |
| `parietal-lobe` | every Parietal patch except Postcentral gyrus; Parieto-occipital sulcus, Subparietal sulcus, Sulcus interm_prim-Jensen |
| `temporal-lobe` | every Temporal patch (incl. parahippocampal); Lat_Fis-post, Collateral sulcus, Posterior transverse collateral sulcus, Anterior occipital sulcus |
| `occipital-lobe` | every Occipital patch |
| `insula` | Insula, Circular sulcus of insula |
| `cingulate-gyrus` | the five cingulate patches |
| `hippocampus` | Hippocampus |
| `corpus-callosum` | Corpus callosum (cut) |
| `thalamus` | the seven `bx_parent` Thalamus nuclei, Lateral and Medial geniculate bodies |
| `hypothalamus` | the five `bx_parent` Hypothalamus zones, Mamillary body |
| `amygdala` | the four `bx_parent` Amygdaloid body groups |
| `basal-ganglia` | Caudate, Putamen, Globus pallidus external and internal, Nucleus accumbens, Subthalamic nucleus |
| `substantia-nigra` | Substantia nigra |
| `ventricles` | Lateral ventricle, Choroid plexus, Third ventricle (cut), Aqueduct of midbrain (cut), Fourth ventricle (cut) |
| `midbrain` | Midbrain, Superior and Inferior colliculus, Red nucleus, Nucleus of oculomotor nerve, Accessory nucleus of oculomotor nerve, Interpeduncular fossa, Base of peduncle (upstream mislabels it cerebellum; it is the crus cerebri) |
| `pons` | Pons, Nucleus of abducens nerve, Motor nucleus of facial nerve, Superior salivatory nucleus, Vestibular nuclei |
| `medulla-oblongata` | Medulla oblongata (right side mirrored), Olive, Pyramid of medulla oblongata |
| `cerebellum` | every other `bx_cat` cerebellum node: hemisphere lobules, vermis parts (cut), flocculus, Superior cerebellar peduncle `.l/.r` |

**Hidden (dropped):** arteries, veins and sinuses, meninges, cranial nerves, all 54 tracts (including the midline superior and middle cerebellar peduncle tubes), Fornix, Anterior, Posterior and Hippocampal commissures, Septal nuclei, Septum pellucidum, Stria terminalis, Stria medullaris thalami, Habenula, Pineal gland, Adeno- and Neurohypophysis, Optic chiasm and tract.

## Consequences

- The curated GLB is a modified Z-Anatomy mesh, so it stays **CC BY-SA 4.0** (ADR 0001), and `public/models/CREDITS.md` says so.
- Changing a membership means rerunning the script and committing a new GLB. Deploys never fetch from upstream.
