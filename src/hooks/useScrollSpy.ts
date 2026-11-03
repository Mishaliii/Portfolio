import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export interface ScrollSpyOptions {
  containerRef?: React.RefObject<HTMLElement | null>;
  container?: HTMLElement | null;
  sectionIds: string[];
  offset?: number;
  enabled?: boolean;
}

/**
 * Robust scroll-based spy for drawer and scrollable containers.
 * - Auto-computes on mount, open, resize, and scroll.
 * - Default to first section when scrollTop is 0.
 * - Bottom rule: activates last section when at max scroll (within 8px) or near bottom with last section visible.
 * - Supports smooth click-to-scroll with immediate active highlight and spy lock until settled.
 */
export function useScrollSpy({
  containerRef,
  container: containerProp,
  sectionIds,
  offset = 24,
  enabled = true,
}: ScrollSpyOptions) {
  const [activeSection, setActiveSection] = useState<string>(sectionIds[0] ?? "");
  const programmaticScrollRef = useRef(false);
  const scrollEndTimerRef = useRef<number | null>(null);

  // Sync activeSection if sectionIds changes
  useEffect(() => {
    if (sectionIds.length > 0 && !sectionIds.includes(activeSection)) {
      setActiveSection(sectionIds[0]);
    }
  }, [sectionIds, activeSection]);

  const getContainer = useCallback((): HTMLElement | null => {
    return containerProp ?? containerRef?.current ?? null;
  }, [containerProp, containerRef]);

  const updateSpy = useCallback(() => {
    if (programmaticScrollRef.current) return;
    const container = getContainer();
    if (!container || sectionIds.length === 0) return;

    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;
    const maxScroll = Math.max(0, scrollHeight - clientHeight);

    // 1. At scrollTop <= 1px, first section is active
    if (scrollTop <= 1) {
      setActiveSection(sectionIds[0]);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const lastId = sectionIds[sectionIds.length - 1];
    const lastEl = document.getElementById(lastId);

    // 2. Bottom Rule:
    // - Within 8px of absolute max scrollTop
    // - OR near bottom (maxScroll - scrollTop <= 48px) and the last section is visible in the container viewport
    if (maxScroll > 0) {
      const isAtMax = maxScroll - scrollTop <= 8;
      if (isAtMax) {
        setActiveSection(lastId);
        return;
      }

      if (lastEl) {
        const lastRect = lastEl.getBoundingClientRect();
        const relativeTop = lastRect.top - containerRect.top;
        if (maxScroll - scrollTop <= 48 && relativeTop <= clientHeight) {
          setActiveSection(lastId);
          return;
        }
      }
    }

    // 3. Active section is the last section whose top is at or above scrollTop + offset
    let currentId = sectionIds[0];

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const elRect = el.getBoundingClientRect();
      const relativeTop = elRect.top - containerRect.top;
      if (relativeTop <= offset) {
        currentId = id;
      }
    }

    setActiveSection(currentId);
  }, [getContainer, sectionIds, offset]);

  // Run updateSpy immediately whenever enabled becomes true or container mounts
  useEffect(() => {
    if (!enabled || programmaticScrollRef.current) return;
    const container = getContainer();
    if (!container) return;

    updateSpy();

    // Double check after layout/paint
    const id = window.requestAnimationFrame(() => {
      if (!programmaticScrollRef.current) {
        updateSpy();
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [enabled, getContainer, updateSpy]);

  // Attach scroll, wheel, and ResizeObserver
  useEffect(() => {
    const container = getContainer();
    if (!enabled || !container) return;

    let rafId: number | null = null;

    const onScroll = () => {
      if (programmaticScrollRef.current) {
        if (scrollEndTimerRef.current !== null) {
          window.clearTimeout(scrollEndTimerRef.current);
        }
        scrollEndTimerRef.current = window.setTimeout(() => {
          programmaticScrollRef.current = false;
          updateSpy();
        }, 120);
        return;
      }

      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateSpy();
      });
    };

    const onManualInteraction = () => {
      programmaticScrollRef.current = false;
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
        scrollEndTimerRef.current = null;
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("wheel", onManualInteraction, { passive: true });
    container.addEventListener("touchmove", onManualInteraction, { passive: true });
    container.addEventListener("pointerdown", onManualInteraction, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        if (!programmaticScrollRef.current) {
          updateSpy();
        }
      });
      ro.observe(container);
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) ro.observe(el);
      }
    }

    return () => {
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("wheel", onManualInteraction);
      container.removeEventListener("touchmove", onManualInteraction);
      container.removeEventListener("pointerdown", onManualInteraction);
      ro?.disconnect();
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, [enabled, getContainer, sectionIds, updateSpy]);

  const scrollTo = useCallback(
    (id: string) => {
      setActiveSection(id);
      programmaticScrollRef.current = true;
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
      scrollEndTimerRef.current = window.setTimeout(() => {
        programmaticScrollRef.current = false;
        updateSpy();
      }, 500);

      const container = getContainer();
      const el = document.getElementById(id);
      if (!el) return;

      if (typeof container?.scrollTo === "function") {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const targetScrollTop = container.scrollTop + (elRect.top - containerRect.top) - (offset - 4);
        container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "smooth" });
      }
      if (typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [getContainer, offset, updateSpy]
  );

  return { activeSection, setActiveSection, scrollTo, updateSpy };
}
