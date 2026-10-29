export type ReferenceCase = { id: string; image: string; label?: string; note?: string };
export type RetrievalSample = { id: string; label: string; image: string; placeholder?: boolean; matches: { referenceId: string; similarity?: number }[] };

/** Supplied precomputed matches only; absent scores stay absent, never inferred. */
export function retrieveSample(sample: RetrievalSample, references: ReferenceCase[], k = 3) {
  if (sample.placeholder) return [];
  return sample.matches.flatMap((match) => {
    const reference = references.find((r) => r.id === match.referenceId);
    const validScore = match.similarity === undefined || (Number.isFinite(match.similarity) && match.similarity >= 0 && match.similarity <= 1);
    return reference && validScore
      ? [{ reference, similarity: match.similarity }] : [];
  }).sort((a, b) => (b.similarity ?? -1) - (a.similarity ?? -1)).slice(0, Math.max(0, k));
}