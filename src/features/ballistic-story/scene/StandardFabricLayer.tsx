import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { StoryState } from "../timeline/story-state";
import { modelAssets } from "../data/assets";
import { AssetModel } from "./AssetModel";
import { Textile } from "./Textile";
export function StandardFabricLayer({ state }: { state: StoryState }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = state.progress > 0.26 && state.progress < 0.455;
  });
  return (
    <group ref={group} position={[0, 1, 0]}>
      {modelAssets.standardFabric ? (
        <AssetModel url={modelAssets.standardFabric} />
      ) : (
        <Textile state={state} />
      )}
      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 1.32, 0]}>
          <boxGeometry args={[0.15, 0.14, 0.09]} />
          <meshStandardMaterial color="#85919a" metalness={0.75} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
