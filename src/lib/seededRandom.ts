/**
 * Simple seeded PRNG for reproducible randomness in diagrams.
 * Returns a value in [0, 1) for a given integer seed.
 *
 * Usage:
 *   const r = seededRandom(42); // always the same value
 *   const values = Array.from({ length: 10 }, (_, i) => seededRandom(i));
 */
export function seededRandom(seed: number): number {
  let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
