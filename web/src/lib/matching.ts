/** Cosine similarity between two equal-length vectors, returned as 0-100. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  const sim = dot / (Math.sqrt(magA) * Math.sqrt(magB));
  return Math.round(Math.max(0, Math.min(1, sim)) * 100);
}

/**
 * Headline match percentage shown throughout the product.
 *
 * Plain cosine similarity on raw 0-100 competence scores is a poor fit here: with six
 * positive values all sitting in the 40-95 range, the required and verified vectors
 * always point in nearly the same direction regardless of the actual gap between them,
 * so every candidate reads as ~100%. Instead this scores per-competence fulfillment
 * (verified / required, capped at 1 — exceeding a requirement doesn't earn extra credit)
 * and averages it, which stays anchored to the real gap the rest of the UI shows.
 */
export function matchScore(required: number[], verified: number[]): number {
  if (required.length !== verified.length || required.length === 0) return 0;
  const fulfillment = required.map((r, i) => (r <= 0 ? 1 : Math.min((verified[i] ?? 0) / r, 1)));
  const avg = fulfillment.reduce((sum, f) => sum + f, 0) / fulfillment.length;
  return Math.round(avg * 100);
}

export interface CompetenceGap {
  index: number;
  required: number;
  verified: number;
  gap: number;
}

/** Per-competence gap, sorted largest gap first. */
export function competenceGaps(required: number[], verified: number[]): CompetenceGap[] {
  return required
    .map((required, index) => ({
      index,
      required,
      verified: verified[index] ?? 0,
      gap: required - (verified[index] ?? 0),
    }))
    .sort((a, b) => b.gap - a.gap);
}
