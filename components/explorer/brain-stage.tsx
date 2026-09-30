"use client";

// The 3D chunk (ADR 0006): three, R3F, drei and postprocessing load only through
// `next/dynamic` from ExplorerStage. The scene renders; it holds no rules (ADR 0003).
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { FOV, HOME_DIRECTION, ZOOM_IN, ZOOM_OUT, homeDistance } from "@/lib/brain/framing";
import { DRACO_DECODER_PATH, SPECIMEN_URL, loadingPercent } from "@/lib/brain/specimen";

export type Gesture = "orbit" | "zoom";

export type BrainStageProps = {
  /** False while the section is off screen: the frame loop stops. */
  active: boolean;
  /** The slow idle rotation, until the first interaction (and never under reduced motion). */
  idle: boolean;
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
/** Pointer travel, in CSS pixels, before a press counts as an orbit drag rather than a click. */
const DRAG_PX = 4;

type Size = readonly [number, number, number];
type Specimen = { root: THREE.Group; size: Size; floorY: number; dispose: () => void };

/** The slice of OrbitControls the scene drives. */
type OrbitLimits = { getDistance: () => number; minDistance: number; maxDistance: number };

/** A 3D material colour from DESIGN.md §2, read from its CSS token. */
function token(name: string): THREE.Color {
  return new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
}

async function loadSpecimen(onProgress: (percent: number) => void): Promise<Specimen> {
  const draco = new DRACOLoader().setDecoderPath(DRACO_DECODER_PATH).setDecoderConfig({ type: "wasm" });
  const loader = new GLTFLoader().setDRACOLoader(draco);
  try {
    const gltf = await loader.loadAsync(SPECIMEN_URL, (event) =>
      onProgress(loadingPercent(event.loaded, event.lengthComputable ? event.total : 0)),
    );
    const porcelain = new THREE.MeshStandardMaterial({ color: token("--porcelain"), roughness: ROUGHNESS, metalness: 0 });
    const geometries: THREE.BufferGeometry[] = [];
    const bounds = new THREE.Box3();
    gltf.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.material = porcelain;
      geometries.push(object.geometry);
      // White matter is context for Slice only (ADR 0002).
      if (object.userData.context) object.visible = false;
      else bounds.expandByObject(object);
    });
    return {
      root: gltf.scene,
      size: bounds.getSize(new THREE.Vector3()).toArray(),
      floorY: bounds.min.y,
      dispose() {
        porcelain.dispose();
        for (const geometry of geometries) geometry.dispose();
      },
    };
  } finally {
    draco.dispose();
  }
}

export default function BrainStage({ active, idle, onProgress, onReady, onFail, onGesture }: BrainStageProps) {
  const [specimen, setSpecimen] = useState<Specimen | null>(null);
  const progress = useEffectEvent(onProgress);
  const fail = useEffectEvent(onFail);

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
      {/* Baked once: the idle rotation moves the camera, not the brain. */}
      <ContactShadows
        frames={1}
        position={[0, specimen.floorY - 0.004, 0]}
        scale={0.42}
        far={0.09}
        blur={2.6}
        opacity={0.42}
        resolution={512}
        color="#3b2f27"
      />
      <Orbit size={specimen.size} idle={idle} />
      <EffectComposer multisampling={0} stencilBuffer>
        <N8AO aoRadius={0.006} distanceFalloff={1} intensity={2.5} halfRes quality="performance" color="#2b221c" />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>
      <Gestures onGesture={onGesture} />
      <FirstFrame onReady={onReady} />
    </Canvas>
  );
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
    const { camera } = get();
    if (previous.current === null) camera.position.set(...HOME_DIRECTION).setLength(home);
    else camera.position.multiplyScalar(home / previous.current);
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

/**
 * Reports orbit drags and zooms for `touched`. At a zoom limit the wheel is
 * handed back to the page, so scrolling past the Explorer never gets stuck.
 */
function Gestures({ onGesture }: { onGesture: (gesture: Gesture) => void }) {
  const canvas = useThree((state) => state.gl.domElement);
  const controls = useThree((state) => state.controls) as OrbitLimits | null;
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
