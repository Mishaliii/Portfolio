import { useEffect, useRef, useState } from "react";
import { ui } from "@/content";
import { Checkbox } from "@/components/ui/checkbox";
import { perfLayers, performanceLayers, setPerformanceLayer } from "@/lib/performance";

export function PerformancePanel() {
  const [enabled, setEnabled] = useState(false);
  const readout = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEnabled(typeof window !== "undefined" && new URLSearchParams(window.location.search).get("perf") === "1");
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0, previous = performance.now(), started = previous, count = 0, sum = 0, longest = 0, tasks = 0;
    let observer: PerformanceObserver | undefined;
    if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
      observer = new PerformanceObserver((list) => { tasks += list.getEntries().length; });
      observer.observe({ type: "longtask", buffered: false });
    }
    const tick = (now: number) => {
      const dt = now - previous; previous = now; count++; sum += dt; longest = Math.max(longest, dt);
      if (now - started >= 1000) {
        const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
        if (readout.current) readout.current.textContent = `${ui.performance.fps}: ${(1000 * count / sum).toFixed(1)} · ${ui.performance.frame}: ${(sum / count).toFixed(1)} ms\n${ui.performance.longest}: ${longest.toFixed(1)} ms · ${ui.performance.tasks}: ${tasks}\n${ui.performance.heap}: ${memory ? `${(memory.usedJSHeapSize / 1048576).toFixed(1)} MB` : ui.performance.unavailable}`;
        count = 0; sum = 0; longest = 0; started = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <aside className="performance-panel" aria-label={ui.performance.title} data-perf-panel>
      <strong>{ui.performance.title}</strong>
      <div ref={readout} className="performance-readout" />
      {perfLayers.map((layer) => (
        <label key={layer} className="performance-option">
          <Checkbox
            defaultChecked={performanceLayers[layer]}
            aria-label={ui.performance.layers[layer]}
            onCheckedChange={(checked) => setPerformanceLayer(layer, checked === true)}
          />
          {ui.performance.layers[layer]}
        </label>
      ))}
    </aside>
  );
}
