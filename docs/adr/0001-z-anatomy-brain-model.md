# Use the Z-Anatomy brain model (CC BY-SA 4.0)

The Brain Explorer uses the segmented Z-Anatomy brain GLB, a Draco-compressed web-ready derivative of about 4.65 MB with around 437 named nodes, published in `itayinbarr/brainproject` at `brain-atlas/models/brain.glb`. It is the only freely available model that is already web-ready and separates both the cortex and the deep Structures, which Slice, Split, X-ray and Isolate all depend on.

## Considered Options

- **SPL/NAC Brain Atlas (Open Anatomy Project).** It is MRI-accurate and has a more permissive license (the 3D Slicer license, with no share-alike). Rejected because it ships as Slicer/VTK data that needs heavy conversion before it can reach the web.
- **Z-Anatomy source `.blend`.** Higher quality, but it needs a full Blender pass. It stays the fallback if the GLB's coarse subcortical meshes (about 7 mm, registered from MNI atlases) prove too crude.
- **NIH 3D subcortical STL.** No cortex, and the license is non-commercial.

## Consequences

- The model is **CC BY-SA 4.0**. The footer must credit "Z-Anatomy – The libre 3D atlas of anatomy" and "BodyParts3D (DBCLS)" with the license. Any modified mesh we redistribute, including the curated regrouping of about 20 Structures, must stay CC BY-SA 4.0. That applies only to the model; the site's code is unaffected.
- Loading it requires a Draco decoder.
