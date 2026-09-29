# Sofia Kael

The single-page website of a fictional neurologist, built to read as a credible real practice while showcasing an interactive 3D human brain.

## Language

### People

**Sofia Kael**:
The fictional general clinical neurologist the site belongs to. Referred to in copy as "Dr. Sofia Kael" or "Dr. Kael".
_Avoid_: the doctor, the client, the user

**Visitor**:
A person browsing the site. In-world they are a prospective patient; out-of-world they are someone judging the craft.
_Avoid_: user, patient, viewer

### Practice

**Kael Neurology**:
Dr. Kael's fictional practice, located at a fictional address in Boston.
_Avoid_: the clinic, the office

**Condition**:
A neurological disorder Dr. Kael treats (e.g. epilepsy, migraine, Parkinson's disease), linked to the Structures it involves.
_Avoid_: disease, illness, specialty, service

### Brain Explorer

**Brain Explorer**:
The dedicated section of the page where the Visitor freely rotates, opens and looks inside the 3D brain.
_Avoid_: brain viewer, 3D section, model

**Structure**:
A named anatomical part of the brain the Visitor can select in the Brain Explorer (e.g. hippocampus, cerebellum, frontal lobe). Always bilateral: it has a left and a right side, and selecting it highlights both. Structures never overlap: the Frontal lobe means the frontal lobe without the Precentral gyrus, which is its own Structure.
_Avoid_: region, part, mesh, node

**Slice**:
The signature Brain Explorer tool: a draggable cutting plane (sagittal, coronal or axial) that reveals the brain's interior like an MRI.
_Avoid_: cut, section, clip

**Split**:
The Brain Explorer tool that separates the two hemispheres to reveal the medial surface.
_Avoid_: open, halve

**X-ray**:
The Brain Explorer tool that makes the cortex translucent so deep Structures show through.
_Avoid_: transparency, ghost mode

**Focus**:
The one Structure or Condition the Brain Explorer is currently centred on, set by selecting a Structure or by "See it in the brain". There is at most one Focus; a Condition focus is the only way several Structures are highlighted at once. Always write "keyboard focus" for the DOM sense.
_Avoid_: selection (for a Condition), active item

**Isolate**:
The Brain Explorer tool that fades every Structure outside the Focus to ghost. It only takes effect while there is a Focus.
_Avoid_: solo, highlight

**Structure panel**:
The side panel (bottom sheet on mobile) describing the focused Structure: its names, what it does, and the Conditions Dr. Kael treats there.

**Condition panel**:
The same panel when a Condition is the Focus: its name, a short description, and its Structures as selectable rows, with a "Clear" link.
