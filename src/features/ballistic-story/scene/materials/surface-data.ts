export type SurfaceKind = "protective" | "ordinary" | "upholstery" | "floor";
const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
// Authored appearance maps only. Yarn appearance does not describe product composition.
export function createSurfaceData(kind: SurfaceKind) {
  const size = 512,
    heights = new Float32Array(size * size);
  const color = new Uint8Array(size * size * 4),
    normal = color.slice(),
    rough = color.slice();
  const cells = kind === "protective" ? 28 : 26;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = (x / size) * cells,
        v = (y / size) * cells;
      const row = Math.floor(v),
        col = Math.floor(u);
      const warp = kind === "protective" ? (col + row) % 4 < 2 : (col + row) % 2 === 0;
      const strand = warp ? u % 1 : v % 1;
      const along = warp ? v : u;
      const width = 0.84 + 0.07 * noise(warp ? col : row, 3);
      const crown = Math.pow(Math.max(0, Math.cos(((strand - 0.5) * Math.PI) / width)), 1.8);
      const fiber = Math.sin(strand * 55 + Math.sin(along * 2) * 0.6) * 0.023;
      let h = crown * (0.76 + 0.13 * Math.sin(along * Math.PI)) + fiber + noise(x, y) * 0.028;
      if (kind === "upholstery")
        h = noise(x, y) * 0.22 + Math.sin(x * 0.21 + Math.sin(y * 0.18)) * 0.035;
      if (kind === "floor")
        h = noise(Math.floor(x / 8), Math.floor(y / 8)) * 0.09 + noise(x, y) * 0.02;
      heights[y * size + x] = h;
      const i = (y * size + x) * 4;
      const shade =
        kind === "protective"
          ? 140 + h * 44 + noise(warp ? col : row, 7) * 18 + Math.sin(strand * 55 + along * 0.8) * 9
          : kind === "ordinary"
            ? 151 + h * 48
            : 213 + h * 28;
      color[i] = shade;
      color[i + 1] = shade;
      color[i + 2] = shade;
      color[i + 3] = 255;
      const r =
        kind === "protective"
          ? 172 + (1 - h) * 42
          : kind === "ordinary"
            ? 207 + noise(x, y) * 25
            : 185 + noise(x, y) * 30;
      rough[i] = rough[i + 1] = rough[i + 2] = r;
      rough[i + 3] = 255;
    }
  const strength = kind === "upholstery" ? 0.9 : kind === "floor" ? 0.25 : 3.5;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx =
        (heights[y * size + ((x + 1) % size)] - heights[y * size + ((x + size - 1) % size)]) *
        strength;
      const dy =
        (heights[((y + 1) % size) * size + x] - heights[((y + size - 1) % size) * size + x]) *
        strength;
      const length = Math.hypot(dx, dy, 1),
        i = (y * size + x) * 4;
      normal[i] = ((-dx / length) * 0.5 + 0.5) * 255;
      normal[i + 1] = ((-dy / length) * 0.5 + 0.5) * 255;
      normal[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      normal[i + 3] = 255;
    }
  return { color, normal, rough, size };
}
