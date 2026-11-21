// A tiny deterministic random generator (mulberry32) so both panels of a scene
// scatter their decoration identically and every screenshot is reproducible.
/** @returns a function that yields the next pseudo-random number in [0, 1). */
export function makeRng(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a value in [min, max) from a seeded generator. */
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

/** Pick one item from an array with a seeded generator. */
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}
