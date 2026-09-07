import { createSurfaceData, type SurfaceKind } from "./surface-data";
const kinds: SurfaceKind[] = ["floor", "ordinary", "protective", "upholstery"];
const maps = Object.fromEntries(kinds.map((kind) => [kind, createSurfaceData(kind)]));
postMessage(maps, {
  transfer: Object.values(maps).flatMap(({ color, normal, rough }) => [
    color.buffer,
    normal.buffer,
    rough.buffer,
  ]),
});
