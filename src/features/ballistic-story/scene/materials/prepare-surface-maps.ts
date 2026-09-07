import type { SurfaceKind, createSurfaceData } from "./surface-data";
type SurfaceData = ReturnType<typeof createSurfaceData>;
let surfaceData: Record<SurfaceKind, SurfaceData>;
let preparation: Promise<void> | undefined;

// Transfer the original, full-resolution procedural pixels once; no image decoding or lossy compression.
export function prepareSurfaceMaps() {
  return (preparation ??= new Promise<void>((resolve, reject) => {
    const worker = new Worker(new URL("./surface-worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<Record<SurfaceKind, SurfaceData>>) => {
      surfaceData = event.data;
      worker.terminate();
      resolve();
    };
    worker.onerror = () => {
      worker.terminate();
      preparation = undefined;
      reject(new Error("Unable to prepare the material study"));
    };
  }));
}

export function getSurfaceData(kind: SurfaceKind) {
  return surfaceData[kind];
}
