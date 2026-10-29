import { describe, expect, it } from "vitest";
import { retrieveSample } from "./retrieval";
import { works } from "@/content";
const references = [{ id: "ref-a", image: "a" }, { id: "ref-b", image: "b" }, { id: "ref-c", image: "c" }];

describe("replaceable sample retrieval", () => {
  it("returns three reference cases sorted by descending similarity", () => {
    const results = retrieveSample({ id: "query", label: "query", image: "query", matches: [{ referenceId: "ref-b", similarity: 0.734 }, { referenceId: "ref-a", similarity: 0.946 }, { referenceId: "ref-c", similarity: 0.618 }] }, references);
    expect(results.map((r) => r.reference.id)).toEqual(["ref-a", "ref-b", "ref-c"]);
    expect(results.map((r) => r.similarity)).toEqual([0.946, 0.734, 0.618]);
  });
  it("does not fabricate a score or condition metadata when absent", () => {
    const results = retrieveSample({ id: "query", label: "query", image: "query", matches: [{ referenceId: "ref-b" }, { referenceId: "ref-a" }] }, references);
    expect(results.map((r) => r.reference.id)).toEqual(["ref-b", "ref-a"]);
    expect(results[0]?.similarity).toBeUndefined();
    expect(results[0]?.reference.label).toBeUndefined();
  });
  it("never returns results for placeholder illustrations", () => {
    for (const sample of works.retrievalDemo.samples) expect(retrieveSample(sample, references)).toEqual([]);
    expect(retrieveSample({ id: "placeholder", label: "placeholder", image: "placeholder", placeholder: true, matches: [{ referenceId: "ref-a", similarity: 0.9 }] }, references)).toEqual([]);
  });
  it("omits missing references and invalid similarity values", () => {
    const results = retrieveSample({ id: "test", label: "test", image: "test", matches: [{ referenceId: "missing", similarity: 0.9 }, { referenceId: "ref-a", similarity: 1.1 }, { referenceId: "ref-b", similarity: 0.5 }] }, references);
    expect(results.map((r) => r.reference.id)).toEqual(["ref-b"]);
  });
});