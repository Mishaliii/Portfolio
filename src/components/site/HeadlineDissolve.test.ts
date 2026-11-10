import { describe, expect, it } from "vitest";
import {
  headlineInstances,
  headlineReady,
  activeHeadlineDrawLoops,
  assertSingleDrawLoopPerHeadline,
} from "./HeadlineDissolve";

describe("HeadlineDissolve runtime draw loop and readiness assertions", () => {
  it("enforces at most one draw loop registered per headline instance", () => {
    // Reset test sets
    headlineInstances.clear();
    headlineReady.clear();
    activeHeadlineDrawLoops.clear();

    const id1 = "test-hero";
    const id2 = "test-about";

    headlineInstances.add(id1);
    headlineInstances.add(id2);

    expect(assertSingleDrawLoopPerHeadline().valid).toBe(true);

    const dummyLoop1 = () => {};
    const dummyLoop2 = () => {};

    activeHeadlineDrawLoops.set(id1, dummyLoop1);
    expect(assertSingleDrawLoopPerHeadline().valid).toBe(true);
    expect(assertSingleDrawLoopPerHeadline().activeLoops).toBe(1);

    activeHeadlineDrawLoops.set(id2, dummyLoop2);
    expect(assertSingleDrawLoopPerHeadline().valid).toBe(true);
    expect(assertSingleDrawLoopPerHeadline().activeLoops).toBe(2);

    // Unsubscribing removes the draw loop
    activeHeadlineDrawLoops.delete(id1);
    expect(activeHeadlineDrawLoops.size).toBe(1);
    expect(assertSingleDrawLoopPerHeadline().valid).toBe(true);

    activeHeadlineDrawLoops.delete(id2);
    expect(activeHeadlineDrawLoops.size).toBe(0);
    expect(assertSingleDrawLoopPerHeadline().valid).toBe(true);

    // Cleanup
    headlineInstances.clear();
    activeHeadlineDrawLoops.clear();
  });

  it("fails assertion when active loops exceed headline instance count", () => {
    headlineInstances.clear();
    activeHeadlineDrawLoops.clear();

    // No instances registered, but a loop somehow exists
    activeHeadlineDrawLoops.set("orphan", () => {});
    const check = assertSingleDrawLoopPerHeadline();
    expect(check.valid).toBe(false);
    expect(check.activeLoops).toBe(1);
    expect(check.totalInstances).toBe(0);

    activeHeadlineDrawLoops.clear();
  });

  it("handles headline readiness gate correctly across instances", () => {
    headlineInstances.clear();
    headlineReady.clear();

    headlineInstances.add("hero");
    headlineInstances.add("about");

    expect(headlineReady.size).toBe(0);
    expect(headlineReady.size >= headlineInstances.size).toBe(false);

    headlineReady.add("hero");
    expect(headlineReady.size >= headlineInstances.size).toBe(false);

    headlineReady.add("about");
    expect(headlineReady.size >= headlineInstances.size).toBe(true);

    headlineInstances.clear();
    headlineReady.clear();
  });
});
