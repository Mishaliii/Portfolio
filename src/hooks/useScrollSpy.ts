import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface ScrollSpyOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  sectionIds: string[];
  offset?: number;
  enabled?: boolean;
}

/**
 * Scroll-based spy for drawer and scrollable containers.
 * - Throttled via requestAnimationFrame on container scroll.
 * - Active section is the last section whose top is at or above scrollTop + 24px (relativeTop <= 24px).
 * - When scrollTop + clientHeight >= scrollHeight - 4, the last section is active.
 * - At scrollTop 0, the first section is active.
 * - Clicking an item scrolls smoothly and activates it immediately without intermediate flickers.
 */
export function useScrollSpy({
  containerRef,
  sectionIds,
  offset = 40,
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

  const updateSpy = useCallback(() => {
    const container = containerRef.current;
    if (!container || sectionIds.length === 0) return;

    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;

    // 1. At scrollTop 0 the first is active
    if (scrollTop <= 0) {
      setActiveSection(sectionIds[0]);
      return;
    }

    // 2. When near bottom of scroll container, highlight the section that is primarily in view
    if (scrollTop + clientHeight >= scrollHeight - 32) {
      const containerRect = container.getBoundingClientRect();
      let candidate = sectionIds[sectionIds.length - 1];
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (!el) continue;
        const elRect = el.getBoundingClientRect();
        if (elRect.top < containerRect.bottom - 40 && elRect.bottom > containerRect.top + 60) {
          candidate = id;
          break;
        }
      }
      setActiveSection(candidate);
      return;
    }

    // 3. Active section is the last section whose top is at or above scrollTop + 24px
    const containerRect = container.getBoundingClientRect();
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
  }, [containerRef, sectionIds, offset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    let rafId: number | null = null;

    const onScroll = () => {
      // If currently programmatic smooth scrolling, debounce spy update until scroll settles
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

    // User manual interaction (wheel, touch, drag) cancels programmatic lock immediately
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

    return () => {
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("wheel", onManualInteraction);
      container.removeEventListener("touchmove", onManualInteraction);
      container.removeEventListener("pointerdown", onManualInteraction);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, [enabled, containerRef, updateSpy]);

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
      }, 450);

      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [updateSpy]
  );

  return { activeSection, setActiveSection, scrollTo, updateSpy };
}
