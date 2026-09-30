"use client";

// The 3D chunk (ADR 0006): three, R3F, drei and postprocessing load only through
// `next/dynamic` from ExplorerStage. The scene renders; it holds no rules (ADR 0003).
import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useExplorer, useExplorerDispatch, useExplorerStore, useExplorerView } from "@/components/explorer/explorer-store";
import type { CalloutHandle } from "@/components/explorer/structure-callout";
import { calloutStructure, type ExplorerView, type Look } from "@/lib/brain/explorer-state";
import { FOV, HOME_DIRECTION, SPLIT_M, ZOOM_IN, ZOOM_OUT, frameDistance, homeDistance, medialDirection } from "@/lib/brain/framing";
import { DRACO_DECODER_PATH, SPECIMEN_URL, loadingPercent } from "@/lib/brain/specimen";
import {
  SIDES,
  isStructureId,
  layerOf,
  type ContextMeshExtras,
  type Side,
  type StructureId,
  type StructureMeshExtras,
} from "@/lib/brain/structures";

export type Gesture = "orbit" | "zoom";

export type BrainStageProps = {
  /** False while the section is off screen: the frame loop stops. */
  active: boolean;
  /** The slow idle rotation, until the first interaction (and never under reduced motion). */
  idle: boolean;
  /** How long a camera move takes: `CAMERA_MS`, or 0 for a cut under reduced motion. */
  cameraMs: number;
  /** How long X-ray's cross-fade takes: `--dur-slow`, or 0 for a cut under reduced motion. */
  xrayMs: number;
  /** CSS pixels on the stage's right that the Structure panel covers: the view centres in what's left. */
  insetRight: number;
  /** The leader-line callout the scene places on the hovered Structure. */
  callout: RefObject<CalloutHandle | null>;
  onProgress: (percent: number) => void;
  /** The first frame is on screen. */
  onReady: () => void;
  /** The GLB failed to load or decode. */
  onFail: () => void;
  onGesture: (gesture: Gesture) => void;
};

// Settings approved on the #6 prototype. Units are metres.
const ROUGHNESS = 0.85;
/** A touch brighter than the prototype, whose base colour read slightly grey. */
const EXPOSURE = 1.1;
/** `--porcelain-ghost` (DESIGN.md §2): `--porcelain` at 8% opacity. */
const GHOST_OPACITY = 0.08;
/**
 * X-ray's frost (#6): faint, brightest at the silhouette, so overlapping gyri
 * don't go cloudy. Alpha is FROST_ALPHA + FROST_RIM · rim³.
 */
const FROST_ALPHA = 0.025;
const FROST_RIM = 0.35;
const FROST_ROUGHNESS = 0.35;
/** Pointer travel, in CSS pixels, before a press counts as an orbit drag rather than a click. */
const DRAG_PX = 4;

type Size = readonly [number, number, number];
type Specimen = {
  root: THREE.Group;
  size: Size;
  floorY: number;
  /** Each Structure's two side meshes. */
  parts: ReadonlyMap<StructureId, readonly THREE.Mesh[]>;
  /** Every mesh of each hemisphere, white matter included: Split slides the groups apart along X. */
  halves: Readonly<Record<Side, THREE.Group>>;
  /** Split's slide, 0 (whole) to 1 (apart), before easing. */
  split: { value: number };
  materials: Readonly<Record<Look, THREE.Material>>;
  /** X-ray's cross-fade, 0 (porcelain) to 1 (frost): the frost material's uniform. */
  xray: { value: number };
  dispose: () => void;
};

/** A point on a Structure's surface, kept in its mesh's space so it moves with the mesh. */
type SurfacePoint = { id: StructureId; mesh: THREE.Mesh; local: THREE.Vector3 };

/** A 3D material colour from DESIGN.md §2, read from its CSS token. */
function token(name: string): THREE.Color {
  return new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
}

/**
 * The curated node's extras. GLTFLoader puts them on the node, which is the
 * mesh itself unless the mesh has several primitives and becomes a group.
 */
function extrasOf(object: THREE.Object3D): StructureMeshExtras | ContextMeshExtras | null {
  for (let node: THREE.Object3D | null = object; node; node = node.parent) {
    const extras = node.userData as Partial<StructureMeshExtras & ContextMeshExtras>;
    if (extras.context) return extras as ContextMeshExtras;
    if (extras.structure && isStructureId(extras.structure)) return extras as StructureMeshExtras;
  }
  return null;
}

/**
 * `--porcelain` that cross-fades to frosted glass as `xray` goes from 0 to 1.
 * Depth-free, so the deep Structures show through and it never hides them.
 */
function frostMaterial(xray: { value: number }): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: token("--porcelain"),
    roughness: FROST_ROUGHNESS,
    metalness: 0,
    transparent: true,
    depthWrite: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uXray = xray;
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform float uXray;\nvoid main() {")
      .replace(
        "#include <opaque_fragment>",
          `#include <opaque_fragment>
      float frost = smoothstep(0.0, 1.0, uXray);
      float rim = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0);
      gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0), 0.25 * frost);
      gl_FragColor.a = mix(1.0, ${FROST_ALPHA} + ${FROST_RIM} * rim, frost);`,
      );
  };
  material.customProgramCacheKey = () => "xray-frost";
  return material;
}

async function loadSpecimen(onProgress: (percent: number) => void): Promise<Specimen> {
  const draco = new DRACOLoader().setDecoderPath(DRACO_DECODER_PATH).setDecoderConfig({ type: "wasm" });
  const loader = new GLTFLoader().setDRACOLoader(draco);
  try {
    const gltf = await loader.loadAsync(SPECIMEN_URL, (event) =>
      onProgress(loadingPercent(event.loaded, event.lengthComputable ? event.total : 0)),
    );
    const xray = { value: 0 };
    const materials: Record<Look, THREE.MeshStandardMaterial> = {
      porcelain: new THREE.MeshStandardMaterial({ color: token("--porcelain"), roughness: ROUGHNESS, metalness: 0 }),
      oxblood: new THREE.MeshStandardMaterial({ color: token("--oxblood"), roughness: ROUGHNESS, metalness: 0 }),
      // Depth-free, so the ghosts never hide the Focus or each other.
      ghost: new THREE.MeshStandardMaterial({
        color: token("--porcelain"),
        roughness: ROUGHNESS,
        metalness: 0,
        transparent: true,
        opacity: GHOST_OPACITY,
        depthWrite: false,
      }),
      frost: frostMaterial(xray),
    };
    const geometries: THREE.BufferGeometry[] = [];
    const parts = new Map<StructureId, THREE.Mesh[]>();
    const sided: [THREE.Mesh, Side][] = [];
    const bounds = new THREE.Box3();
    gltf.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.material = materials.porcelain;
      geometries.push(object.geometry);
      const extras = extrasOf(object);
      if (extras) sided.push([object, extras.side]);
      // White matter is context for Slice only (ADR 0002).
      if (!extras || "context" in extras) {
        object.visible = false;
        return;
      }
      bounds.expandByObject(object);
      object.userData.structure = extras.structure;
      object.userData.side = extras.side;
      parts.set(extras.structure, [...(parts.get(extras.structure) ?? []), object]);
    });
    // Every mesh is already one side's, midline meshes cut at x = 0 (ADR 0002).
    const halves = { left: new THREE.Group(), right: new THREE.Group() };
    gltf.scene.add(halves.left, halves.right);
    gltf.scene.updateMatrixWorld(true);
    for (const [mesh, side] of sided) halves[side].attach(mesh);
    return {
      root: gltf.scene,
      size: bounds.getSize(new THREE.Vector3()).toArray(),
      floorY: bounds.min.y,
      parts,
      halves,
      split: { value: 0 },
      materials,
      xray,
      dispose() {
        for (const material of Object.values(materials)) material.dispose();
        for (const geometry of geometries) geometry.dispose();
      },
    };
  } finally {
    draco.dispose();
  }
}

export default function BrainStage({
  active,
  idle,
  cameraMs,
  xrayMs,
  insetRight,
  callout,
  onProgress,
  onReady,
  onFail,
  onGesture,
}: BrainStageProps) {
  const [specimen, setSpecimen] = useState<Specimen | null>(null);
  /** The halves are sliding: the contact shadow follows them, then bakes once where they settle. */
  const [sliding, setSliding] = useState(false);
  const progress = useEffectEvent(onProgress);
  const fail = useEffectEvent(onFail);
  /** The Structure under the pointer, shared by picking and the callout. */
  const pointedRef = useRef<SurfacePoint | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loaded: Specimen | null = null;
    loadSpecimen(progress).then(
      (result) => {
        loaded = result;
        if (cancelled) result.dispose();
        else setSpecimen(result);
      },
      (error: unknown) => {
        if (cancelled) return;
        console.warn("[explorer] specimen failed to load", error);
        fail();
      },
    );
    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, []);

  if (!specimen) return null;

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ fov: FOV, near: 0.02, far: 3, position: [...HOME_DIRECTION] }}
      // Stencil and local clipping are ready for Slice. The composer draws every
      // pixel, so the canvas's own antialiasing would buy nothing (#6: no MSAA).
      gl={{ alpha: true, antialias: false, stencil: true }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = EXPOSURE;
      }}>
      <hemisphereLight args={["#ffffff", "#a89a8b", 1.5]} />
      <directionalLight position={[0.4, 0.8, 0.5]} intensity={1.1} />
      <directionalLight position={[-0.5, 0.2, -0.4]} intensity={0.3} />
      <primitive object={specimen.root} />
      <Looks specimen={specimen} xrayMs={xrayMs} />
      <SplitHalves specimen={specimen} ms={cameraMs} onSliding={setSliding} />
      {/* Baked once: the idle rotation moves the camera, not the brain. Only Split moves the brain. */}
      <ContactShadows
        frames={sliding ? Infinity : 1}
        position={[0, specimen.floorY - 0.004, 0]}
        scale={0.42}
        far={0.09}
        blur={2.6}
        opacity={0.42}
        resolution={512}
        color="#3b2f27"
      />
      <Orbit size={specimen.size} idle={idle} />
      <CameraRig specimen={specimen} ms={cameraMs} insetRight={insetRight} />
      <ViewInset right={insetRight} ms={cameraMs} />
      <EffectComposer multisampling={0} stencilBuffer>
        <N8AO aoRadius={0.006} distanceFalloff={1} intensity={2.5} halfRes quality="performance" color="#2b221c" />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>
      <Gestures onGesture={onGesture} />
      <Picking specimen={specimen} pointedRef={pointedRef} />
      <CalloutAnchor specimen={specimen} pointedRef={pointedRef} callout={callout} />
      <FirstFrame onReady={onReady} />
    </Canvas>
  );
}

function dress(specimen: Specimen, structures: ExplorerView["structures"]) {
  for (const [id, meshes] of specimen.parts) {
    const { look } = structures[id];
    // Porcelain cortex keeps the frost until X-ray has faded back out.
    const fadingOut = look === "porcelain" && layerOf(id) === "cortex" && specimen.xray.value > 0;
    for (const mesh of meshes) mesh.material = specimen.materials[fadingOut ? "frost" : look];
  }
}

/** Steps X-ray's cross-fade toward `target`; true once it has faded back out to porcelain. */
function fadeXray(specimen: Specimen, target: 0 | 1, step: number): boolean {
  const fade = specimen.xray;
  fade.value = target > fade.value ? Math.min(target, fade.value + step) : Math.max(target, fade.value - step);
  return fade.value === 0;
}

/**
 * Dresses each Structure-side in the look `deriveView` gives it, and
 * cross-fades X-ray's frost over `xrayMs` (a cut under reduced motion).
 */
function Looks({ specimen, xrayMs }: { specimen: Specimen; xrayMs: number }) {
  const { structures } = useExplorerView();
  const xray = useExplorer((state) => state.xray);
  useLayoutEffect(() => dress(specimen, structures), [specimen, structures]);
  useFrame((_, delta) => {
    const target = xray ? 1 : 0;
    if (specimen.xray.value === target) return;
    if (fadeXray(specimen, target, xrayMs === 0 ? 1 : (delta * 1000) / xrayMs)) dress(specimen, structures);
  });
  return null;
}

const SIGN: Readonly<Record<Side, 1 | -1>> = { left: 1, right: -1 };

/** How far the left half sits along X at Split's `progress`, in metres; the right half mirrors it. */
function splitOffset(progress: number): number {
  return SPLIT_M * easeInOut(progress);
}

/** Steps Split's slide toward `target` and places the halves; true while they're still moving. */
function slide(specimen: Specimen, target: 0 | 1, step: number): boolean {
  const progress = specimen.split;
  if (progress.value === target) return false;
  progress.value = target > progress.value ? Math.min(target, progress.value + step) : Math.max(target, progress.value - step);
  const offset = splitOffset(progress.value);
  for (const side of SIDES) specimen.halves[side].position.x = SIGN[side] * offset;
  return progress.value !== target;
}

/**
 * Slides the halves apart along X over `ms` (`--dur-camera`, a cut under
 * reduced motion) and back. Reports when a slide starts and when it settles.
 */
function SplitHalves({ specimen, ms, onSliding }: { specimen: Specimen; ms: number; onSliding: (sliding: boolean) => void }) {
  const split = useExplorer((state) => state.split);
  const sliding = useRef(false);
  useFrame((_, delta) => {
    const moving = slide(specimen, split ? 1 : 0, ms === 0 ? 1 : (delta * 1000) / ms);
    if (moving === sliding.current) return;
    sliding.current = moving;
    onSliding(moving);
  });
  return null;
}

/** World bounds of `meshes` where they sit once the halves settle (`split` or whole), even mid-slide. */
function settledBox(specimen: Specimen, meshes: Iterable<THREE.Mesh>, split: boolean): THREE.Box3 {
  const box = new THREE.Box3();
  const part = new THREE.Box3();
  const shift = new THREE.Vector3();
  const still = splitOffset(split ? 1 : 0) - splitOffset(specimen.split.value);
  for (const mesh of meshes) {
    shift.set(SIGN[mesh.userData.side as Side] * still, 0, 0);
    box.union(part.setFromObject(mesh).translate(shift));
  }
  return box;
}

/**
 * Orbit and clamped zoom around the specimen. The home view and the zoom limits
 * fit the stage; on resize the Visitor's view keeps its direction and relative zoom.
 */
function Orbit({ size, idle }: { size: Size; idle: boolean }) {
  const get = useThree((state) => state.get);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const home = homeDistance(size, aspect);
  const previous = useRef<number | null>(null);

  useLayoutEffect(() => {
    const { camera, controls } = get();
    if (previous.current === null) camera.position.set(...HOME_DIRECTION).setLength(home);
    else {
      // Scale the distance to the orbit target, which a framed Structure may have moved off the origin.
      const target = (controls as OrbitControlsImpl | null)?.target ?? new THREE.Vector3();
      camera.position.sub(target).multiplyScalar(home / previous.current).add(target);
    }
    previous.current = home;
  }, [get, home]);

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableDamping
      autoRotate={idle}
      autoRotateSpeed={0.6}
      minDistance={home * ZOOM_IN}
      maxDistance={home * ZOOM_OUT}
    />
  );
}

type Tween = {
  from: THREE.Vector3;
  to: THREE.Vector3;
  fromDistance: number;
  toDistance: number;
  /** From the orbit target to the camera, at the start. */
  direction: THREE.Vector3;
  /** How far the viewing angle turns by the end: none for `frame`, back to the home angle for `home`. */
  turn: THREE.Quaternion;
  ms: number;
  start: number | null;
};

const NO_TURN = new THREE.Quaternion();
const turnStep = new THREE.Quaternion();
const viewDirection = new THREE.Vector3();

/** easeInOutCubic, close to `--ease-in-out`. */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Carries out the camera intent (ADR 0003 "Camera") over `ms`: `--dur-camera`,
 * or a cut under reduced motion. Grabbing the specimen mid-move hands the
 * camera straight back.
 * - `frame` eases the orbit target to the focused Structure-sides, both halves
 *   in view, and the distance to fit them (never much closer than home). The
 *   Visitor's viewing angle is kept.
 * - `home` (Reset) eases back to the home view: centred, at the home distance
 *   and angle.
 * - `medial` (Split on) turns to look through the gap at the far half's medial
 *   surface, from the side the camera is on, at the home distance.
 *
 * `frame` and `medial` aim where the halves settle, so a move that starts
 * mid-slide still lands on them.
 */
function CameraRig({ specimen, ms, insetRight }: { specimen: Specimen; ms: number; insetRight: number }) {
  const { camera: request } = useExplorerView();
  const store = useExplorerStore();
  const get = useThree((state) => state.get);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const tween = useRef<Tween | null>(null);
  const handled = useRef(0);

  useEffect(() => {
    if (!controls || request.seq === handled.current) return;
    handled.current = request.seq;
    const { camera, size } = get();
    const offset = camera.position.clone().sub(controls.target);
    const from = { from: controls.target.clone(), fromDistance: offset.length(), direction: offset.normalize(), ms, start: null };

    if (request.intent === "home") {
      const home = new THREE.Vector3(...HOME_DIRECTION).normalize();
      tween.current = {
        ...from,
        to: new THREE.Vector3(),
        toDistance: homeDistance(specimen.size, size.width / size.height),
        turn: new THREE.Quaternion().setFromUnitVectors(from.direction, home),
      };
      return;
    }
    // Fit the part of the stage the panel leaves uncovered.
    const aspect = (size.width - insetRight) / size.height;
    const { split } = store.getState();

    if (request.intent === "medial") {
      const near: Side = from.direction.x >= 0 ? "left" : "right";
      const far = [...specimen.parts.values()].flat().filter((mesh) => mesh.userData.side !== near);
      const center = settledBox(specimen, far, split).getCenter(new THREE.Vector3());
      tween.current = {
        ...from,
        // Halfway between the far half's centre and the midline, so the near half stays in view too.
        to: center.setX(center.x / 2),
        toDistance: homeDistance(specimen.size, aspect),
        turn: new THREE.Quaternion().setFromUnitVectors(from.direction, new THREE.Vector3(...medialDirection(near))),
      };
      return;
    }
    if (request.frame.length === 0) return;
    const framed = request.frame.flatMap((id) => specimen.parts.get(id) ?? []);
    const sphere = settledBox(specimen, framed, split).getBoundingSphere(new THREE.Sphere());
    tween.current = {
      ...from,
      to: sphere.center,
      toDistance: frameDistance(sphere.radius, aspect, homeDistance(specimen.size, aspect)),
      turn: NO_TURN,
    };
  }, [controls, get, store, request, specimen, ms, insetRight]);

  useEffect(() => {
    if (!controls) return;
    const release = () => (tween.current = null);
    controls.addEventListener("start", release);
    return () => controls.removeEventListener("start", release);
  }, [controls]);

  // After OrbitControls' own update (priority -1), before the composer renders.
  useFrame(({ camera }) => {
    const move = tween.current;
    if (!move || !controls) return;
    const now = performance.now();
    move.start ??= now;
    const t = move.ms === 0 ? 1 : Math.min(1, (now - move.start) / move.ms);
    const eased = easeInOut(t);
    controls.target.lerpVectors(move.from, move.to, eased);
    const distance = THREE.MathUtils.lerp(move.fromDistance, move.toDistance, eased);
    viewDirection.copy(move.direction).applyQuaternion(turnStep.slerpQuaternions(NO_TURN, move.turn, eased));
    camera.position.copy(controls.target).addScaledVector(viewDirection, distance);
    camera.lookAt(controls.target);
    if (t === 1) tween.current = null;
  });

  return null;
}

/** How long the view takes to recentre beside the panel: `--dur-base`, the panel's own slide. */
const INSET_MS = 400;

/**
 * Shifts the projection so the scene centres in the part of the stage the
 * Structure panel leaves uncovered, easing along with the panel's slide (a cut
 * under reduced motion). The callout projects through the same camera, so it follows.
 */
function ViewInset({ right, ms }: { right: number; ms: number }) {
  const shift = useRef(0);
  const clock = useRef<number | null>(null);
  useFrame(({ camera, size }) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const target = right / 2;
    if (shift.current === target) clock.current = null;
    else {
      const now = performance.now();
      const elapsed = now - (clock.current ?? now);
      clock.current = now;
      // The whole shift takes INSET_MS, either way.
      const step = ms === 0 ? Infinity : (elapsed / INSET_MS) * Math.max(target, shift.current);
      shift.current = target > shift.current ? Math.min(target, shift.current + step) : Math.max(target, shift.current - step);
    }
    // Set every frame: a resize resets the projection to the new size.
    if (shift.current !== 0) camera.setViewOffset(size.width, size.height, shift.current, 0, size.width, size.height);
    else if (camera.view?.enabled) camera.clearViewOffset();
  });
  return null;
}

/**
 * Reports orbit drags and zooms for `touched`. At a zoom limit the wheel is
 * handed back to the page, so scrolling past the Explorer never gets stuck.
 */
function Gestures({ onGesture }: { onGesture: (gesture: Gesture) => void }) {
  const canvas = useThree((state) => state.gl.domElement);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const report = useEffectEvent(onGesture);

  useEffect(() => {
    const host = canvas.parentElement;
    if (!host || !controls) return;
    const pointers = new Map<number, { x: number; y: number }>();

    // Capture on the host runs before OrbitControls' listener on the canvas.
    const onWheel = (event: WheelEvent) => {
      const distance = controls.getDistance();
      const atLimit = event.deltaY > 0 ? distance >= controls.maxDistance - 1e-6 : distance <= controls.minDistance + 1e-6;
      if (event.deltaY === 0 || atLimit) {
        event.stopPropagation();
        return;
      }
      report("zoom");
    };
    const onPointerDown = (event: PointerEvent) => pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const onPointerMove = (event: PointerEvent) => {
      const start = pointers.get(event.pointerId);
      if (!start) return;
      if (pointers.size > 1) report("zoom");
      else if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_PX) report("orbit");
    };
    const onPointerEnd = (event: PointerEvent) => pointers.delete(event.pointerId);

    host.addEventListener("wheel", onWheel, { capture: true, passive: true });
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerEnd);
    canvas.addEventListener("pointercancel", onPointerEnd);
    return () => {
      host.removeEventListener("wheel", onWheel, { capture: true });
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [canvas, controls]);

  return null;
}

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

/** The front-most pickable Structure under a client point. */
function pick(
  canvas: HTMLCanvasElement,
  camera: THREE.Camera,
  targets: readonly THREE.Mesh[],
  clientX: number,
  clientY: number,
): SurfacePoint | null {
  const rect = canvas.getBoundingClientRect();
  ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const [hit] = raycaster.intersectObjects(targets as THREE.Mesh[], false);
  if (!hit) return null;
  const mesh = hit.object as THREE.Mesh;
  return { id: (mesh.userData as StructureMeshExtras).structure, mesh, local: mesh.worldToLocal(hit.point.clone()) };
}

/**
 * Canvas picking. A press released within DRAG_PX of where it started selects
 * the whole Structure under it; a drag, on or off the brain, and a click on
 * empty background do nothing. A mouse or pen hovering a Structure feeds the
 * callout; touch has no hover, so a tap simply selects.
 */
function Picking({ specimen, pointedRef }: { specimen: Specimen; pointedRef: RefObject<SurfacePoint | null> }) {
  const canvas = useThree((state) => state.gl.domElement);
  const camera = useThree((state) => state.camera);
  const { structures } = useExplorerView();
  const dispatch = useExplorerDispatch();
  const targets = useMemo(
    () => [...specimen.parts].flatMap(([id, meshes]) => (structures[id].pickable ? meshes : [])),
    [specimen, structures],
  );
  const targetsRef = useRef(targets);
  useLayoutEffect(() => {
    targetsRef.current = targets;
  }, [targets]);
  /** The latest hover position, raycast once per frame. */
  const pending = useRef<{ x: number; y: number } | null>(null);

  const point = useCallback(
    (next: SurfacePoint | null) => {
      const previous = pointedRef.current;
      pointedRef.current = next;
      canvas.style.setProperty("cursor", next ? "pointer" : "");
      if (previous?.id === next?.id) return;
      if (previous) dispatch({ type: "unhover", id: previous.id });
      if (next) dispatch({ type: "hover", id: next.id });
    },
    [canvas, dispatch, pointedRef],
  );

  useEffect(() => {
    const presses = new Map<number, { x: number; y: number }>();
    let multiTouch = false;

    const onPointerDown = (event: PointerEvent) => {
      if (presses.size === 0) multiTouch = false;
      presses.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (presses.size > 1) multiTouch = true;
    };
    const onPointerUp = (event: PointerEvent) => {
      const start = presses.get(event.pointerId);
      presses.delete(event.pointerId);
      if (!start || multiTouch || event.button !== 0) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_PX) return;
      const hit = pick(canvas, camera, targetsRef.current, event.clientX, event.clientY);
      if (hit) dispatch({ type: "select", id: hit.id });
    };
    const onPointerCancel = (event: PointerEvent) => presses.delete(event.pointerId);
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.buttons !== 0) return;
      pending.current = { x: event.clientX, y: event.clientY };
    };
    const onPointerLeave = () => {
      pending.current = null;
      point(null);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.style.removeProperty("cursor");
    };
  }, [canvas, camera, dispatch, point]);

  useFrame(() => {
    const at = pending.current;
    if (!at) return;
    pending.current = null;
    point(pick(canvas, camera, targetsRef.current, at.x, at.y));
  });

  return null;
}

/**
 * A surface point to anchor the callout when the hover comes from the
 * Structure index: where a ray from the camera to the nearer side's centre
 * first meets that side, or the centre itself.
 */
function anchorFor(specimen: Specimen, id: StructureId, camera: THREE.Camera): SurfacePoint | null {
  const box = new THREE.Box3();
  let nearest: { mesh: THREE.Mesh; center: THREE.Vector3; distance: number } | null = null;
  for (const mesh of specimen.parts.get(id) ?? []) {
    const center = box.setFromObject(mesh).getCenter(new THREE.Vector3());
    const distance = center.distanceTo(camera.position);
    if (!nearest || distance < nearest.distance) nearest = { mesh, center, distance };
  }
  if (!nearest) return null;
  const { mesh, center } = nearest;
  raycaster.set(camera.position, center.clone().sub(camera.position).normalize());
  const [hit] = raycaster.intersectObject(mesh, false);
  return { id, mesh, local: mesh.worldToLocal((hit?.point ?? center).clone()) };
}

/** Projects the hovered Structure's surface point onto the stage every frame, for the callout. */
function CalloutAnchor({
  specimen,
  pointedRef,
  callout,
}: {
  specimen: Specimen;
  pointedRef: RefObject<SurfacePoint | null>;
  callout: RefObject<CalloutHandle | null>;
}) {
  const store = useExplorerStore();
  const anchor = useRef<SurfacePoint | null>(null);
  const shown = useRef(false);
  const world = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const handle = callout.current;
    return () => handle?.place(null);
  }, [callout]);

  useFrame(({ camera, size }) => {
    // A ghost never gets a callout, even from the Structure index.
    const hovered = calloutStructure(store.getState());
    // The pointer's own surface point while it's on the hovered Structure; otherwise one found for it.
    const live = pointedRef.current?.id === hovered ? pointedRef.current : null;
    if (anchor.current?.id !== hovered) anchor.current = hovered ? (live ?? anchorFor(specimen, hovered, camera)) : null;
    const point = live ?? anchor.current;
    if (point) {
      world.copy(point.local).applyMatrix4(point.mesh.matrixWorld).project(camera);
      if (world.z < 1) {
        callout.current?.place({ x: ((world.x + 1) / 2) * size.width, y: ((1 - world.y) / 2) * size.height });
        shown.current = true;
        return;
      }
    }
    if (shown.current) callout.current?.place(null);
    shown.current = false;
  });

  return null;
}

function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    // useFrame runs before the render; the frame is on screen by the next one.
    requestAnimationFrame(() => onReady());
  });
  return null;
}
