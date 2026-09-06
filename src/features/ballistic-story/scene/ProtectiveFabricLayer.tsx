import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { StoryState } from "../timeline/story-state";
import { modelAssets } from "../data/assets";
import { AssetModel } from "./AssetModel";
import { Textile } from "./Textile";
export function ProtectiveFabricLayer({ state }: { state: StoryState }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (group.current) {
      group.current.visible = state.progress > 0.395 && state.progress < 0.8;
      group.current.scale.setScalar(1 - state.assembly * 0.035);
    }
  });
  return (
    <group ref={group} position={[0, 1, -3]}>
      {modelAssets.protectiveFabric ? (
        <AssetModel url={modelAssets.protectiveFabric} />
      ) : (
        <>
          <Textile state={state} protective offset={-0.32} />
          <Textile state={state} protective />
        </>
      )}
      <mesh position={[0, -1.25, 0.02]}>
        <boxGeometry args={[3.1, 0.015, 0.02]} />
        <meshStandardMaterial
          color="#d22630"
          emissive="#951c24"
          emissiveIntensity={0.25}
          roughness={0.65}
        />
      </mesh>
    </group>
  );
}
