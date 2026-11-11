// Global registry for loader gate readiness and single draw-loop assertions
export const headlineInstances = new Set<string>();
export const headlineReady = new Set<string>();
export const activeHeadlineDrawLoops = new Map<string, (t: number) => void>();

export function assertSingleDrawLoopPerHeadline(): {
  valid: boolean;
  activeLoops: number;
  totalInstances: number;
} {
  const activeLoops = activeHeadlineDrawLoops.size;
  const totalInstances = headlineInstances.size;
  const valid = activeLoops <= totalInstances;
  if (!valid) {
    console.error(
      `[HeadlineDissolve] Assertion failed: ${activeLoops} active draw loops for ${totalInstances} instances`,
    );
  }
  return { valid, activeLoops, totalInstances };
}
