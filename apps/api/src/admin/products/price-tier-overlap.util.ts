/**
 * Checks if two quantity ranges overlap.
 * A null maxQty is treated as Infinity (unlimited).
 * Ranges [a1, a2] and [b1, b2] overlap if a1 <= (b2 ?? Infinity) AND b1 <= (a2 ?? Infinity).
 */
export function rangesOverlap(
  a1: number,
  a2: number | null,
  b1: number,
  b2: number | null,
): boolean {
  const aMax = a2 ?? Infinity;
  const bMax = b2 ?? Infinity;
  return a1 <= bMax && b1 <= aMax;
}
