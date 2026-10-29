import { useEffect, useState } from "react";
import { site } from "@/content";

/** Live IST clock string. Empty until the first tick so SSR and client match. */
export function useIST() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const f = () =>
      setNow(
        new Date().toLocaleTimeString("en-GB", {
          timeZone: site.timezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    f();
    const t = setInterval(f, 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/** Index that advances every `ms` while the tab is visible. */
export function useCycle(n: number, ms: number, active = true) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active || n < 2) return;
    let id = 0;
    const tick = () => {
      if (!document.hidden) setI((v) => (v + 1) % n);
      id = window.setTimeout(tick, ms);
    };
    id = window.setTimeout(tick, ms);
    return () => clearTimeout(id);
  }, [n, ms, active]);
  return i;
}
