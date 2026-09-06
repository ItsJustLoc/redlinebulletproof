import { useGLTF } from "@react-three/drei";
import { useMemo, type ReactNode } from "react";
export function AssetModel({ url }: { url: string }) {
  const { scene } = useGLTF(url, "/models/draco/", true);
  const model = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={model} />;
}

export function AssetSlot({ url, children }: { url: string | null; children: ReactNode }) {
  return url ? <AssetModel url={url} /> : children;
}
