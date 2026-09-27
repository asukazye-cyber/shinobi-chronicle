export const nextRandom = (state: number): [number, number] => {
  let t = (state + 0x6D2B79F5) | 0;
  let x = Math.imul(t ^ (t >>> 15), t | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return [((x ^ (x >>> 14)) >>> 0) / 4294967296, t >>> 0];
};
export const roll = (state: number, max: number): [number, number] => { const [r, next] = nextRandom(state); return [Math.floor(r * max), next]; };
