# Brain model credits

`brain.glb` is a modified version of the segmented Z-Anatomy brain model. It is licensed under **[Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/)**. This license covers only the 3D model. The website's code is licensed separately.

This site is fictional. Dr. Sofia Kael and Kael Neurology do not exist, and nothing here is medical advice. The model is approximate and educational, and it is not for clinical use.

## Sources

- **Z-Anatomy – The libre 3D atlas of anatomy** by the Z-Anatomy contributors: <https://www.z-anatomy.com/> · <https://github.com/Z-Anatomy>
- **BodyParts3D**, © The Database Center for Life Science (DBCLS): <https://lifesciencedb.jp/bp3d/>
- **Web-ready segmentation** by the `itayinbarr/brainproject` contributors: `brain-atlas/models/brain.glb` at commit [`ac32adad68d86af019fa99ecbf56eaed85a0039e`](https://github.com/itayinbarr/brainproject/tree/ac32adad68d86af019fa99ecbf56eaed85a0039e/brain-atlas), CC BY-SA 4.0.

Upstream placed some of the deep nuclei by registering them from these open MNI-space atlases:

- **CIT168 subcortical atlas** (substantia nigra, subthalamic nucleus, nucleus accumbens, globus pallidus segments): W. M. Pauli, A. N. Nili and J. M. Tyszka, "A high-resolution probabilistic in vivo atlas of human subcortical brain nuclei," *Scientific Data* 5, 180063 (2018). CC BY 4.0. <https://osf.io/jkzwp/>
- **CIT168 amygdala atlas** (amygdala groups): J. M. Tyszka and W. M. Pauli, "In vivo delineation of subdivisions of the human amygdaloid complex in a high-resolution group template," *Human Brain Mapping* 37 (2016). CC BY-SA 4.0. <https://osf.io/hksa6/>
- **Thalamic nuclei atlas**: E. Najdenovska, Y. Alemán-Gómez, G. Battistella et al., "In-vivo probabilistic atlas of human thalamic nuclei based on diffusion-weighted magnetic resonance imaging," *Scientific Data* 5, 180270 (2018). CC BY-SA 4.0. <https://doi.org/10.5281/zenodo.1405484>
- **Hypothalamic region atlas** (hypothalamus zones): C. Neudorfer, J. Germann, G. J. B. Elias et al., "A high-resolution in vivo magnetic resonance imaging atlas of the human hypothalamic region," *Scientific Data* 7, 305 (2020). CC BY 4.0. <https://doi.org/10.5281/zenodo.3942115>

The upstream white-matter tracts (HCP1065) are not included.

## Changes made

`bun run build:brain` (`scripts/build-brain.ts`) made these changes to the upstream model:

- grouped the upstream nodes into one mesh per Structure and side, keeping two white-matter context meshes;
- dropped the vessels, meninges, cranial nerves, tracts and a few small nuclei, as well as all materials and texture coordinates;
- welded vertices and recomputed normals;
- cut the midline meshes at x = 0, filled the cut faces, and made the right medulla oblongata by mirroring the left one;
- recentred the model and recompressed it with Draco.

The full mapping is recorded in [ADR 0002](https://github.com/danielluis07/sofia-kael-v2/blob/main/docs/adr/0002-curate-the-brain-model-at-build-time.md).
