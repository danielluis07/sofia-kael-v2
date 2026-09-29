"use client";
/* eslint-disable react-hooks/immutability -- throwaway: mutates three.js objects imperatively, as R3F scenes do */

// PROTOTYPE (issue #6): does the porcelain specimen look right on the real model?
// Throwaway. Runtime grouping stands in for ADR 0002's curated GLB.
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import { EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { CAP_ORDER, CORTEX, partFor, type NodeExtras, type PartId, type StructureId } from "./structures";
import { probe, type Axis, type Settings } from "./settings";

const GLB = "/prototype/brain.glb";
const DRACO = "/prototype/draco/";
const PORCELAIN = "#EFEBE4";
const PORCELAIN_CUT = "#B9AFA3";
const WHITE_CUT = "#D9D2C8";
const OXBLOOD = "#6E1F24";
const OXBLOOD_DEEP = "#56171B";
const PAPER_2 = "#ECE8E1";
const OVERLAY = 1; // layer for caps/stencil/frame, so ContactShadows ignores them

type Part = { key: string; id: PartId; geometry: THREE.BufferGeometry; cortex: boolean };

function buildParts(root: THREE.Object3D, cortexTol: number) {
  root.updateMatrixWorld(true);
  const buckets = new Map<string, { id: PartId; geoms: THREE.BufferGeometry[] }>();
  const push = (id: PartId, side: string, g: THREE.BufferGeometry) => {
    const key = `${id}.${side}`;
    if (!buckets.has(key)) buckets.set(key, { id, geoms: [] });
    buckets.get(key)!.geoms.push(g);
  };

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const ud = (mesh.userData.bx_label ? mesh.userData : (mesh.parent?.userData ?? {})) as NodeExtras;
    const id = partFor(ud);
    if (!id) return;
    const side = ud.bx_side === "left" ? "l" : ud.bx_side === "right" ? "r" : "m";
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", mesh.geometry.getAttribute("position").clone());
    const index = mesh.geometry.index;
    g.setIndex(index ? index.clone() : [...Array(g.attributes.position.count).keys()]);
    g.applyMatrix4(mesh.matrixWorld);
    push(id, side, g);
    // Upstream has no right medulla; mirror the left (ADR 0002).
    if (ud.bx_label?.trim() === "Medulla oblongata") {
      const m = g.clone().applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
      const idx = m.index!;
      for (let i = 0; i < idx.count; i += 3) {
        const b = idx.getX(i + 1);
        idx.setX(i + 1, idx.getX(i + 2));
        idx.setX(i + 2, b);
      }
      push(id, "r", m);
    }
  });

  const parts: Part[] = [];
  for (const [key, { id, geoms }] of buckets) {
    const merged = mergeGeometries(geoms, false);
    const cortex = CORTEX.has(id);
    const welded = mergeVertices(merged, cortex ? cortexTol : 1e-5);
    welded.computeVertexNormals();
    parts.push({ key, id, geometry: welded, cortex });
  }

  const bounds = new THREE.Box3();
  for (const p of parts) {
    p.geometry.computeBoundingBox();
    bounds.union(p.geometry.boundingBox!);
  }
  const center = bounds.getCenter(new THREE.Vector3());
  for (const p of parts) {
    p.geometry.translate(-center.x, -center.y, -center.z);
    p.geometry.computeBoundingSphere();
  }
  bounds.translate(center.negate());
  return { parts, bounds };
}

// Keep the half away from the three-quarter-left-front camera: the cut faces it.
function planeFor(axis: Axis, mm: number) {
  const n =
    axis === "sagittal" ? new THREE.Vector3(-1, 0, 0) : axis === "coronal" ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, -1, 0);
  return { normal: n, constant: mm / 1000 };
}

function xrayMaterial(u: { value: number }) {
  const m = new THREE.MeshStandardMaterial({
    color: PORCELAIN,
    roughness: 0.35,
    metalness: 0,
    transparent: true,
    depthWrite: false,
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uXray = u;
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform float uXray;\nvoid main() {")
      .replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
        float xt = uXray * uXray * (3.0 - 2.0 * uXray);
        float rim = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0), 0.25 * xt);
        gl_FragColor.a = mix(1.0, 0.025 + 0.35 * rim, xt);`,
      );
  };
  m.customProgramCacheKey = () => "xray-frost";
  return m;
}

function stencilMaterial(side: THREE.Side, op: THREE.StencilOp, planes: THREE.Plane[]) {
  return new THREE.MeshBasicMaterial({
    side,
    depthWrite: false,
    depthTest: false,
    colorWrite: false,
    stencilWrite: true,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilFail: op,
    stencilZFail: op,
    stencilZPass: op,
    clippingPlanes: planes,
  });
}

function capMaterial(color: string) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0,
    side: THREE.DoubleSide,
    stencilWrite: true,
    stencilRef: 0,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.ReplaceStencilOp,
    stencilZFail: THREE.ReplaceStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
  });
}

const noRaycast = () => null;

function Specimen({ s, onSelect }: { s: Settings; onSelect: (id: StructureId) => void }) {
  const gltf = useGLTF(GLB, DRACO);
  const { parts, bounds } = useMemo(
    () => buildParts(gltf.scene, s.cortexWeld === "0.1mm" ? 1e-4 : 1e-5),
    [gltf.scene, s.cortexWeld],
  );

  const plane = useMemo(() => new THREE.Plane(), []);
  const planes = useMemo(() => [plane], [plane]);
  const xrayU = useMemo(() => ({ value: 0 }), []);
  const mats = useMemo(
    () => ({
      porcelain: new THREE.MeshStandardMaterial({ color: PORCELAIN, metalness: 0 }),
      oxblood: new THREE.MeshStandardMaterial({ color: OXBLOOD, roughness: 0.7, metalness: 0 }),
      xray: xrayMaterial(xrayU),
      back: stencilMaterial(THREE.BackSide, THREE.IncrementWrapStencilOp, planes),
      front: stencilMaterial(THREE.FrontSide, THREE.DecrementWrapStencilOp, planes),
      cut: capMaterial(PORCELAIN_CUT),
      cutWhite: capMaterial(WHITE_CUT),
      cutOxblood: capMaterial(OXBLOOD_DEEP),
      frame: new THREE.LineBasicMaterial({ color: OXBLOOD }),
    }),
    [planes, xrayU],
  );

  const { normal, constant } = planeFor(s.axis, s.mm);
  plane.normal.copy(normal);
  plane.constant = constant;
  const clip = s.slice ? planes : null;
  mats.porcelain.roughness = s.roughness;
  mats.porcelain.clippingPlanes = clip;
  mats.oxblood.clippingPlanes = clip;
  mats.xray.clippingPlanes = clip;

  const capPose = useMemo(() => {
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().negate());
    return { position: normal.clone().multiplyScalar(-constant), quaternion: q };
  }, [normal, constant]);
  const capGeom = useMemo(() => new THREE.PlaneGeometry(0.4, 0.4), []);

  const frameGeom = useMemo(() => {
    const m = 0.008;
    const { min, max } = bounds;
    const c = s.mm / 1000;
    const pts =
      s.axis === "coronal"
        ? [[min.x - m, min.y - m, c], [max.x + m, min.y - m, c], [max.x + m, max.y + m, c], [min.x - m, max.y + m, c]]
        : s.axis === "sagittal"
          ? [[c, min.y - m, min.z - m], [c, min.y - m, max.z + m], [c, max.y + m, max.z + m], [c, max.y + m, min.z - m]]
          : [[min.x - m, c, min.z - m], [max.x + m, c, min.z - m], [max.x + m, c, max.z + m], [min.x - m, c, max.z + m]];
    return new THREE.BufferGeometry().setFromPoints(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  }, [bounds, s.axis, s.mm]);

  // X-ray cross-fade: cortex swaps to the frosted material while the fade is > 0.
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const target = s.xray ? 1 : 0;
    const step = dt / 0.7;
    xrayU.value = target > xrayU.value ? Math.min(1, xrayU.value + step) : Math.max(0, xrayU.value - step);
    group.current?.traverse((o) => {
      if (o.userData.fadeCortex) (o as THREE.Mesh).material = xrayU.value > 0.001 ? mats.xray : mats.porcelain;
    });
  });

  const click = (id: PartId) => (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 5 || id === "white-matter") return;
    e.stopPropagation();
    onSelect(id);
  };

  const cappedIds = new Set<PartId>();
  const meshes = parts.map((p) => {
    const focused = s.focus === p.id;
    const wm = p.id === "white-matter";
    const frosted = p.cortex && s.xray && !focused;
    const visible = wm ? s.slice && !s.xray : true;
    if (s.slice && visible && !frosted) cappedIds.add(p.id);
    const order = CAP_ORDER.indexOf(p.id);
    return (
      <group key={p.key}>
        <mesh
          geometry={p.geometry}
          material={focused ? mats.oxblood : mats.porcelain}
          userData={{ fadeCortex: p.cortex && !focused }}
          visible={visible}
          raycast={wm || frosted ? noRaycast : undefined}
          onClick={click(p.id)}
        />
        {cappedIds.has(p.id) && (
          <>
            <mesh geometry={p.geometry} material={mats.back} renderOrder={1 + order * 2} layers={OVERLAY} raycast={noRaycast} />
            <mesh geometry={p.geometry} material={mats.front} renderOrder={1 + order * 2} layers={OVERLAY} raycast={noRaycast} />
          </>
        )}
      </group>
    );
  });

  return (
    <group ref={group}>
      {meshes}
      {[...cappedIds].map((id) => (
        <mesh
          key={`cap-${id}`}
          geometry={capGeom}
          material={s.focus === id ? mats.cutOxblood : s.capTone === "layered" && id === "white-matter" ? mats.cutWhite : mats.cut}
          position={capPose.position}
          quaternion={capPose.quaternion}
          renderOrder={2 + CAP_ORDER.indexOf(id) * 2}
          layers={OVERLAY}
          raycast={noRaycast}
        />
      ))}
      {s.slice && <lineLoop geometry={frameGeom} material={mats.frame} layers={OVERLAY} />}
      <ContactShadows
        key={`${s.shadow}-${s.cortexWeld}`}
        visible={s.shadow !== "off"}
        frames={s.shadow === "live" ? Infinity : 1}
        position={[0, bounds.min.y - 0.004, 0]}
        scale={0.42}
        far={0.09}
        blur={2.6}
        opacity={s.shadow === "off" ? 0 : 0.42}
        resolution={512}
        color="#3b2f27"
      />
    </group>
  );
}

function Probe() {
  const { gl, camera, size } = useThree();
  useEffect(() => {
    camera.layers.enable(OVERLAY);
    gl.info.autoReset = false;
    const ctx = gl.getContext();
    const ext = ctx.getExtension("WEBGL_debug_renderer_info");
    probe.gpu = ext ? String(ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "unknown";
  }, [gl, camera]);
  useFrame((_, dt) => {
    probe.deltas.push(dt * 1000);
    if (probe.deltas.length > 600) probe.deltas.splice(0, probe.deltas.length - 600);
    probe.calls = gl.info.render.calls;
    probe.triangles = gl.info.render.triangles;
    probe.pixelRatio = gl.getPixelRatio();
    probe.canvas = `${Math.round(size.width * probe.pixelRatio)}×${Math.round(size.height * probe.pixelRatio)}`;
    gl.info.reset();
  }, -1);
  return null;
}

export default function SpecimenScene({ s, onSelect }: { s: Settings; onSelect: (id: StructureId) => void }) {
  return (
    <Canvas
      dpr={[1, s.dpr]}
      camera={{ fov: 30, near: 0.02, far: 3, position: [0.3, 0.07, 0.27] }}
      gl={{ stencil: true, antialias: true, localClippingEnabled: true } as never}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.toneMapping = THREE.NeutralToneMapping;
      }}>
      <color attach="background" args={[PAPER_2]} />
      <hemisphereLight args={["#ffffff", "#a89a8b", 1.5]} />
      <directionalLight position={[0.4, 0.8, 0.5]} intensity={1.1} />
      <directionalLight position={[-0.5, 0.2, -0.4]} intensity={0.3} />
      <Specimen s={s} onSelect={onSelect} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        autoRotate={s.autoRotate}
        autoRotateSpeed={0.6}
        minDistance={0.22}
        maxDistance={0.8}
      />
      {s.ao !== "off" && (
        <EffectComposer multisampling={s.msaa} stencilBuffer>
          <N8AO
            aoRadius={s.aoRadiusMm / 1000}
            distanceFalloff={1}
            intensity={s.aoIntensity}
            halfRes={s.ao === "half"}
            quality={s.ao === "half" ? "performance" : "medium"}
            color="#2b221c"
          />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        </EffectComposer>
      )}
      <Probe />
    </Canvas>
  );
}

useGLTF.preload(GLB, DRACO);
