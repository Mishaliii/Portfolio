import { works } from "@/content";

const c = works.caseStudy;
export const ddssThumbs: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("@/assets/ddss*-thumb.webp", { eager: true, import: "default" }),
  ).map(([path, asset]) => [(path.split("/").pop() ?? "").replace("-thumb.webp", ""), asset]),
);
export const ddssImages: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("@/assets/ddss*-screen.webp", { eager: true, import: "default" }),
  ).map(([path, asset]) => [(path.split("/").pop() ?? "").replace("-screen.webp", ""), asset]),
);
const images = ddssImages;

const prepared = new Map<string, Promise<void>>();
function prepareScreenshot(key: string, attempt = 0) {
  const url = `${images[key]}${attempt ? `?retry=${attempt}` : ""}`;
  const cached = prepared.get(url);
  if (cached) return cached;
  const ready = new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      image.decode().then(resolve, reject);
    };
    image.onerror = () => reject(new Error("Screenshot unavailable"));
    image.src = url;
  });
  prepared.set(url, ready);
  void ready.catch(() => prepared.delete(url));
  return ready;
}

/** Warm the browser image cache while the visitor reads Works, before opening the gallery. */
export function preloadScreenshots() {
  c.shots.forEach((shot) => {
    void prepareScreenshot(shot.k).catch(() => {});
  });
}
