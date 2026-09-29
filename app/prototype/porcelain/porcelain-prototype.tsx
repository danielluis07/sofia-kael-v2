"use client";

// PROTOTYPE (issue #6). One scene, not variants: the question is whether this one look
// holds up on the real GLB, so the panel exposes the knobs and a benchmark instead.
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BENCH, DEFAULTS, probe, type Axis, type Settings } from "./settings";
import { STRUCTURES, type StructureId } from "./structures";

const SpecimenScene = dynamic(() => import("./specimen-scene"), {
  ssr: false,
  loading: () => <p className="label absolute inset-0 grid place-items-center text-ink-soft">Loading specimen…</p>,
});

const RANGE: Record<Axis, [number, number]> = { sagittal: [-68, 68], coronal: [-90, 90], axial: [-80, 80] };
const READOUT: Record<Axis, (mm: number) => string> = {
  sagittal: (mm) => `Sagittal · x = ${-mm} mm`,
  coronal: (mm) => `Coronal · y = ${mm} mm`,
  axial: (mm) => `Axial · z = ${mm} mm`,
};

type Stats = { fps: number; avg: number; p95: number; calls: number; tris: number };

function stats(deltas: number[]): Pick<Stats, "fps" | "avg" | "p95"> {
  if (!deltas.length) return { fps: 0, avg: 0, p95: 0 };
  const sorted = [...deltas].sort((a, b) => a - b);
  const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  return { fps: 1000 / avg, avg, p95: sorted[Math.floor(sorted.length * 0.95)] };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function PorcelainPrototype() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const set = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));
  const [hud, setHud] = useState<Stats | null>(null);
  const [panel, setPanel] = useState(true);
  const [bench, setBench] = useState<string | null>(null);
  const [benching, setBenching] = useState(false);
  const benchRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setHud({ ...stats(probe.deltas.slice(-60)), calls: probe.calls, tris: probe.triangles });
    }, 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "h") setPanel((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function runBench() {
    if (benchRef.current) return;
    benchRef.current = true;
    setBenching(true);
    const start = s;
    const rows: string[] = [];
    for (const step of BENCH) {
      setS({ ...start, ...step.patch, autoRotate: true });
      await sleep(1500);
      probe.deltas.length = 0;
      await sleep(4000);
      const r = stats(probe.deltas);
      if (!probe.deltas.length) {
        rows.push(`| ${step.name} | no frames: tab hidden? | | | | |`);
        continue;
      }
      rows.push(
        `| ${step.name} | ${r.fps.toFixed(0)} | ${r.avg.toFixed(1)} | ${r.p95.toFixed(1)} | ${probe.calls} | ${(probe.triangles / 1000).toFixed(0)}k |`,
      );
    }
    setS(start);
    const header = [
      `Device: ${navigator.userAgent}`,
      `GPU: ${probe.gpu} · canvas ${probe.canvas} @ DPR ${probe.pixelRatio} (device ${window.devicePixelRatio})`,
      "",
      "| Config | fps | avg ms | p95 ms | draw calls | tris |",
      "|---|--:|--:|--:|--:|--:|",
    ];
    setBench([...header, ...rows].join("\n"));
    benchRef.current = false;
    setBenching(false);
  }

  return (
    <main className="fixed inset-0 bg-paper-2 text-ink">
      <SpecimenScene s={s} onSelect={(id) => set({ focus: id })} />

      <div className="pointer-events-none absolute top-4 left-4 flex flex-col gap-1">
        <span className="label bg-ink px-2 py-1 text-paper">Prototype · issue #6 · throwaway</span>
        {s.slice && <span className="label text-oxblood tabular-nums">{READOUT[s.axis](s.mm)}</span>}
        {s.focus && <span className="font-serif text-3xl">{STRUCTURES[s.focus]}</span>}
      </div>

      {hud && (
        <div className="label pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 bg-surface/90 px-2 py-1 whitespace-nowrap tabular-nums">
          {hud.fps.toFixed(0)} fps · {hud.avg.toFixed(1)} ms · p95 {hud.p95.toFixed(1)} · {hud.calls} calls ·{" "}
          {(hud.tris / 1000).toFixed(0)}k tris
        </div>
      )}

      <button
        className="label absolute top-4 right-4 z-10 border border-rule bg-surface px-3 py-2"
        onClick={() => setPanel((p) => !p)}>
        {panel ? "Hide panel (h)" : "Panel (h)"}
      </button>

      {panel && (
        <aside className="absolute top-14 right-4 bottom-12 flex w-[min(320px,calc(100vw-32px))] flex-col gap-4 overflow-y-auto border border-rule bg-surface p-4 text-body-s">
          <Group title="Focus">
            <select
              className="w-full border border-rule bg-paper px-2 py-1"
              value={s.focus ?? ""}
              onChange={(e) => set({ focus: (e.target.value || null) as StructureId | null })}>
              <option value="">None</option>
              {Object.entries(STRUCTURES).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <p className="text-ink-soft">Or click a Structure in the scene.</p>
          </Group>

          <Group title="Tools">
            <Toggle label="X-ray" on={s.xray} onChange={(xray) => set({ xray })} />
            <Toggle label="Slice" on={s.slice} onChange={(slice) => set({ slice })} />
            {s.slice && (
              <>
                <Segments
                  value={s.axis}
                  options={["sagittal", "coronal", "axial"] as const}
                  onChange={(axis) => set({ axis, mm: 0 })}
                />
                <input
                  type="range"
                  min={RANGE[s.axis][0]}
                  max={RANGE[s.axis][1]}
                  value={s.mm}
                  onChange={(e) => set({ mm: Number(e.target.value) })}
                  className="w-full accent-oxblood"
                />
                <Row label="Cap tone">
                  <Segments value={s.capTone} options={["uniform", "layered"] as const} onChange={(capTone) => set({ capTone })} />
                </Row>
                <Row label="Cortex weld">
                  <Segments
                    value={s.cortexWeld}
                    options={["0.1mm", "0.01mm"] as const}
                    onChange={(cortexWeld) => set({ cortexWeld })}
                  />
                </Row>
              </>
            )}
            <Toggle label="Idle rotation" on={s.autoRotate} onChange={(autoRotate) => set({ autoRotate })} />
          </Group>

          <Group title="Look">
            <Row label="AO">
              <Segments value={s.ao} options={["off", "half", "full"] as const} onChange={(ao) => set({ ao })} />
            </Row>
            <Slider label="AO intensity" min={0} max={6} step={0.1} value={s.aoIntensity} onChange={(aoIntensity) => set({ aoIntensity })} />
            <Slider label="AO radius mm" min={1} max={20} step={0.5} value={s.aoRadiusMm} onChange={(aoRadiusMm) => set({ aoRadiusMm })} />
            <Slider label="Roughness" min={0.2} max={1} step={0.01} value={s.roughness} onChange={(roughness) => set({ roughness })} />
            <Row label="Shadow">
              <Segments value={s.shadow} options={["off", "baked", "live"] as const} onChange={(shadow) => set({ shadow })} />
            </Row>
            <Row label="AO MSAA">
              <Segments value={s.msaa} options={[0, 4] as const} onChange={(msaa) => set({ msaa })} />
            </Row>
            <Row label="DPR cap">
              <Segments value={s.dpr} options={[1, 1.5, 2, 3] as const} onChange={(dpr) => set({ dpr })} />
            </Row>
          </Group>

          <Group title="Frame cost">
            <button
              className="rounded-full bg-oxblood px-4 py-2 font-medium text-paper disabled:opacity-50"
              disabled={benching}
              onClick={runBench}>
              {benching ? "Benchmarking… (~50 s)" : "Run benchmark"}
            </button>
            <p className="text-ink-soft">
              fps is capped by vsync, so 60 (or 120) means under budget. Keep the phone still and the tab in front.
            </p>
            {bench && (
              <>
                <pre className="overflow-x-auto bg-paper p-2 font-mono text-[10px] leading-snug">{bench}</pre>
                <button className="label underline" onClick={() => navigator.clipboard?.writeText(bench)}>
                  Copy results
                </button>
              </>
            )}
          </Group>
        </aside>
      )}
    </main>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-ink pt-2">
      <h2 className="label text-ink-soft">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      {children}
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row label={label}>
      <button
        aria-pressed={on}
        className={`label rounded-full border px-3 py-1 ${on ? "border-oxblood bg-oxblood text-paper" : "border-rule"}`}
        onClick={() => onChange(!on)}>
        {on ? "On" : "Off"}
      </button>
    </Row>
  );
}

function Segments<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex border border-rule">
      {options.map((o) => (
        <button
          key={String(o)}
          aria-pressed={o === value}
          className={`label px-2 py-1 ${o === value ? "bg-ink text-paper" : ""}`}
          onClick={() => onChange(o)}>
          {String(o)}
        </button>
      ))}
    </div>
  );
}

function Slider(props: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between">
        {props.label} <span className="font-mono tabular-nums">{props.value}</span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="w-full accent-oxblood"
      />
    </label>
  );
}
