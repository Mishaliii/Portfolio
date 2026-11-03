import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollSpy } from "./useScrollSpy";

describe("useScrollSpy", () => {
  let container: HTMLDivElement;
  let sections: HTMLDivElement[];
  const sectionIds = ["sec-1", "sec-2", "sec-3", "sec-4"];

  beforeEach(() => {
    container = document.createElement("div");
    Object.defineProperty(container, "scrollTop", { value: 0, writable: true });
    Object.defineProperty(container, "clientHeight", { value: 600, writable: true });
    Object.defineProperty(container, "scrollHeight", { value: 2000, writable: true });
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      top: 100,
      bottom: 700,
      left: 0,
      right: 500,
      width: 500,
      height: 600,
      x: 0,
      y: 100,
      toJSON: () => {},
    });

    document.body.appendChild(container);

    // Mock sections at tops: 100, 400, 900, 1500 (container top is 100)
    // relative tops: 0, 300, 800, 1400
    const relativeTops = [0, 300, 800, 1400];
    sections = sectionIds.map((id, i) => {
      const el = document.createElement("div");
      el.id = id;
      el.scrollIntoView = vi.fn();
      vi.spyOn(el, "getBoundingClientRect").mockImplementation(() => ({
        top: 100 + relativeTops[i] - container.scrollTop,
        bottom: 100 + relativeTops[i] + 250 - container.scrollTop,
        left: 0,
        right: 500,
        width: 500,
        height: 250,
        x: 0,
        y: 100 + relativeTops[i] - container.scrollTop,
        toJSON: () => {},
      }));
      container.appendChild(el);
      return el;
    });
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it("activates the first section when scrollTop is 0", () => {
    const { result } = renderHook(() =>
      useScrollSpy({
        containerRef: { current: container },
        sectionIds,
      })
    );

    expect(result.current.activeSection).toBe("sec-1");
  });

  it("activates intermediate section whose top is at or above scrollTop + 24px", () => {
    const { result } = renderHook(() =>
      useScrollSpy({
        containerRef: { current: container },
        sectionIds,
      })
    );

    // Scroll to 320px -> sec-2 relativeTop is 300 - 320 = -20px <= 24px
    act(() => {
      container.scrollTop = 320;
      result.current.updateSpy();
    });

    expect(result.current.activeSection).toBe("sec-2");

    // Scroll to 850px -> sec-3 relativeTop is 800 - 850 = -50px <= 24px
    act(() => {
      container.scrollTop = 850;
      result.current.updateSpy();
    });

    expect(result.current.activeSection).toBe("sec-3");
  });

  it("activates the last section when scrollTop is within 8px of maxScroll", () => {
    const { result } = renderHook(() =>
      useScrollSpy({
        containerRef: { current: container },
        sectionIds,
      })
    );

    act(() => {
      // scrollHeight = 2000, clientHeight = 600 -> maxScroll = 1400.
      // Scroll to 1395px (within 8px of 1400px)
      container.scrollTop = 1395;
      result.current.updateSpy();
    });

    expect(result.current.activeSection).toBe("sec-4");
  });

  it("activates the last section when near bottom and last section is visible in container viewport", () => {
    const { result } = renderHook(() =>
      useScrollSpy({
        containerRef: { current: container },
        sectionIds,
      })
    );

    act(() => {
      // maxScroll is 1400. Scroll to 1365px (35px from bottom, within 48px).
      // sec-4 relativeTop is 1400 - 1365 = 35px <= clientHeight (600px).
      container.scrollTop = 1365;
      result.current.updateSpy();
    });

    expect(result.current.activeSection).toBe("sec-4");
  });

  it("accepts direct container element prop", () => {
    const { result } = renderHook(() =>
      useScrollSpy({
        container,
        sectionIds,
      })
    );

    expect(result.current.activeSection).toBe("sec-1");

    act(() => {
      container.scrollTop = 1400;
      result.current.updateSpy();
    });

    expect(result.current.activeSection).toBe("sec-4");
  });

  it("sets active immediately and scrolls when scrollTo is called", () => {
    const { result } = renderHook(() =>
      useScrollSpy({
        containerRef: { current: container },
        sectionIds,
      })
    );

    act(() => {
      result.current.scrollTo("sec-4");
    });

    expect(result.current.activeSection).toBe("sec-4");
    expect(sections[3].scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });
});
