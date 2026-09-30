import { describe, expect, test } from "bun:test";
import {
  conditionFocusHref,
  conditionRowHref,
  parseFocus,
  parseJump,
  readSnapshot,
  rowJumpUrl,
  serializeFocus,
  snapshotState,
} from "./explorer-url";

const ORIGIN = "https://kael.example";

describe("parseFocus", () => {
  test("no param: no Focus, nothing to drop", () => {
    expect(parseFocus("")).toEqual({ focus: { kind: "none" }, stale: false });
    expect(parseFocus("?utm_source=mail")).toEqual({ focus: { kind: "none" }, stale: false });
  });

  test("a known Structure id focuses it", () => {
    expect(parseFocus("?structure=hippocampus")).toEqual({ focus: { kind: "structure", id: "hippocampus" }, stale: false });
    expect(parseFocus("?a=1&structure=medulla-oblongata")).toEqual({
      focus: { kind: "structure", id: "medulla-oblongata" },
      stale: false,
    });
  });

  test("an unknown or empty id is ignored and marked for removal", () => {
    expect(parseFocus("?structure=spleen")).toEqual({ focus: { kind: "none" }, stale: true });
    expect(parseFocus("?structure=")).toEqual({ focus: { kind: "none" }, stale: true });
    expect(parseFocus("?structure=Pons")).toEqual({ focus: { kind: "none" }, stale: true });
  });

  test("a known Condition id focuses it", () => {
    expect(parseFocus("?condition=migraine")).toEqual({ focus: { kind: "condition", id: "migraine" }, stale: false });
  });

  test("`condition` wins over `structure`, which is dropped", () => {
    expect(parseFocus("?structure=pons&condition=vertigo")).toEqual({ focus: { kind: "condition", id: "vertigo" }, stale: true });
    expect(parseFocus("?condition=vertigo&structure=pons")).toEqual({ focus: { kind: "condition", id: "vertigo" }, stale: true });
  });

  test("an unknown Condition is dropped, leaving a valid Structure", () => {
    expect(parseFocus("?condition=gout")).toEqual({ focus: { kind: "none" }, stale: true });
    expect(parseFocus("?condition=gout&structure=pons")).toEqual({ focus: { kind: "structure", id: "pons" }, stale: true });
  });
});

describe("parseJump", () => {
  const here = `${ORIGIN}/?structure=pons#conditions`;

  test("a Condition focus link into the Explorer", () => {
    expect(parseJump(conditionFocusHref("ataxia"), here)).toEqual({ kind: "focus", focus: { kind: "condition", id: "ataxia" } });
    expect(parseJump(`${ORIGIN}/?structure=insula#brain-explorer`, here)).toEqual({
      kind: "focus",
      focus: { kind: "structure", id: "insula" },
    });
  });

  test("a Condition chip out to its row", () => {
    expect(parseJump(conditionRowHref("stroke"), here)).toEqual({ kind: "row", id: "stroke" });
  });

  test("anything else is left to the browser", () => {
    expect(parseJump("#condition-gout", here)).toBeNull();
    expect(parseJump("?condition=gout#brain-explorer", here)).toBeNull();
    expect(parseJump("?condition=ataxia#about", here)).toBeNull();
    expect(parseJump("#brain-explorer", `${ORIGIN}/#conditions`)).toBeNull();
    expect(parseJump("https://elsewhere.example/?condition=ataxia#brain-explorer", here)).toBeNull();
    expect(parseJump("/other?condition=ataxia#brain-explorer", here)).toBeNull();
  });
});

describe("rowJumpUrl", () => {
  test("keeps the path and the query, and lands on the row", () => {
    expect(rowJumpUrl(`${ORIGIN}/?structure=pons#brain-explorer`, "vertigo")).toBe("/?structure=pons#condition-vertigo");
    expect(rowJumpUrl(`${ORIGIN}/`, "vertigo")).toBe("/#condition-vertigo");
  });
});

describe("history snapshots", () => {
  test("round-trip, alongside whatever Next.js adds to the entry", () => {
    const snapshot = { focus: { kind: "structure", id: "pons", via: "vertigo" }, isolate: true } as const;
    expect(readSnapshot({ ...snapshotState(snapshot), __NA: true })).toEqual(snapshot);
    const condition = { focus: { kind: "condition", id: "migraine" }, isolate: false } as const;
    expect(readSnapshot(snapshotState(condition))).toEqual(condition);
  });

  test("carries nothing but the snapshot, so Next.js syncs its own state", () => {
    expect(Object.keys(snapshotState({ focus: { kind: "none" }, isolate: false }))).toEqual(["explorer"]);
  });

  test("an entry without one, or with one from an older build, reads as none", () => {
    expect(readSnapshot(null)).toBeNull();
    expect(readSnapshot({ __NA: true })).toBeNull();
    expect(readSnapshot({ explorer: { focus: { kind: "structure", id: "spleen" }, isolate: false } })).toBeNull();
    expect(readSnapshot({ explorer: { focus: { kind: "condition", id: "migraine" } } })).toBeNull();
  });

  test("an unknown `via` is dropped, keeping the Structure", () => {
    expect(readSnapshot({ explorer: { focus: { kind: "structure", id: "pons", via: "gout" }, isolate: false } })).toEqual({
      focus: { kind: "structure", id: "pons" },
      isolate: false,
    });
  });
});

describe("serializeFocus", () => {
  test("a Structure focus lands on the Explorer", () => {
    expect(serializeFocus(`${ORIGIN}/`, { kind: "structure", id: "pons" })).toBe("/?structure=pons#brain-explorer");
    expect(serializeFocus(`${ORIGIN}/#about`, { kind: "structure", id: "pons" })).toBe("/?structure=pons#brain-explorer");
  });

  test("replaces the previous Focus, including a Condition", () => {
    expect(serializeFocus(`${ORIGIN}/?structure=pons#brain-explorer`, { kind: "structure", id: "thalamus" })).toBe(
      "/?structure=thalamus#brain-explorer",
    );
    expect(serializeFocus(`${ORIGIN}/?condition=migraine`, { kind: "structure", id: "thalamus" })).toBe(
      "/?structure=thalamus#brain-explorer",
    );
  });

  test("never writes `via`", () => {
    expect(serializeFocus(`${ORIGIN}/`, { kind: "structure", id: "pons", via: "vertigo" })).toBe("/?structure=pons#brain-explorer");
  });

  test("a Condition focus writes `condition`", () => {
    expect(serializeFocus(`${ORIGIN}/?structure=pons`, { kind: "condition", id: "migraine" })).toBe(
      "/?condition=migraine#brain-explorer",
    );
  });

  test("clearing removes the params and keeps the hash and other params", () => {
    expect(serializeFocus(`${ORIGIN}/?structure=pons#brain-explorer`, { kind: "none" })).toBe("/#brain-explorer");
    expect(serializeFocus(`${ORIGIN}/?a=1&structure=spleen`, { kind: "none" })).toBe("/?a=1");
  });

  test("round-trips through parseFocus", () => {
    const focus = { kind: "structure", id: "basal-ganglia" } as const;
    const url = new URL(serializeFocus(`${ORIGIN}/`, focus), ORIGIN);
    expect(parseFocus(url.search)).toEqual({ focus, stale: false });
  });
});
