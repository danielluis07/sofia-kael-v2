import { describe, expect, test } from "bun:test";
import { parseFocus, serializeFocus } from "./explorer-url";

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
