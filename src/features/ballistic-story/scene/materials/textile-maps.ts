import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { SurfaceKind } from "./surface-data";
import { getSurfaceData } from "./prepare-surface-maps";
export type { SurfaceKind } from "./surface-data";

export function createSurfaceMaps(kind: SurfaceKind) {
  const { color, normal, rough, size } = getSurfaceData(kind);
  const make = (data: Uint8Array, srgb = false) => {
    const t = new THREE.DataTexture(data, size, size);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(
      kind === "protective" ? 5 : kind === "ordinary" ? 6 : 14,
      kind === "protective" ? 4 : kind === "ordinary" ? 5 : 14,
    );
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 4;
    t.needsUpdate = true;
    return t;
  };
  return { map: make(color, true), normalMap: make(normal), roughnessMap: make(rough) };
}
export function useSurfaceMaps(kind: SurfaceKind) {
  const maps = useMemo(() => createSurfaceMaps(kind), [kind]);
  useEffect(() => () => Object.values(maps).forEach((t) => t.dispose()), [maps]);
  return maps;
}
