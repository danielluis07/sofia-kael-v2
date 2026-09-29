// PROTOTYPE (issue #6). Scene knobs and the frame probe the HUD and benchmark read.
import type { StructureId } from "./structures";

export type Axis = "sagittal" | "coronal" | "axial";

export type Settings = {
  ao: "off" | "half" | "full";
  aoIntensity: number;
  aoRadiusMm: number;
  shadow: "off" | "baked" | "live";
  roughness: number;
  slice: boolean;
  axis: Axis;
  mm: number;
  capTone: "uniform" | "layered";
  cortexWeld: "0.1mm" | "0.01mm";
  xray: boolean;
  focus: StructureId | null;
  autoRotate: boolean;
  dpr: 1 | 1.5 | 2 | 3;
  msaa: 0 | 4;
};

export const DEFAULTS: Settings = {
  ao: "half",
  aoIntensity: 2.5,
  aoRadiusMm: 6,
  shadow: "baked",
  roughness: 0.85,
  slice: false,
  axis: "coronal",
  mm: 0,
  capTone: "layered",
  cortexWeld: "0.1mm",
  xray: false,
  focus: "hippocampus",
  autoRotate: true,
  dpr: 2,
  msaa: 0,
};

export const BENCH: { name: string; patch: Partial<Settings> }[] = [
  { name: "Bare: porcelain + light", patch: { ao: "off", shadow: "off", slice: false, xray: false } },
  { name: "+ contact shadow (baked)", patch: { ao: "off", shadow: "baked", slice: false, xray: false } },
  { name: "+ contact shadow (live)", patch: { ao: "off", shadow: "live", slice: false, xray: false } },
  { name: "+ AO half-res", patch: { ao: "half", shadow: "baked", slice: false, xray: false } },
  { name: "+ AO full-res", patch: { ao: "full", shadow: "baked", slice: false, xray: false } },
  { name: "Look + Slice caps", patch: { ao: "half", shadow: "baked", slice: true, xray: false } },
  { name: "Look + X-ray", patch: { ao: "half", shadow: "baked", slice: false, xray: true } },
  { name: "Look + Slice + X-ray", patch: { ao: "half", shadow: "baked", slice: true, xray: true } },
  { name: "Slice caps, no AO", patch: { ao: "off", shadow: "baked", slice: true, xray: false } },
];

// Written by the scene every frame, read by the HUD. No React state on the hot path.
export const probe = {
  deltas: [] as number[],
  calls: 0,
  triangles: 0,
  gpu: "",
  canvas: "",
  pixelRatio: 1,
};
