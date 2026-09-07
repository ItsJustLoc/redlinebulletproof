import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { StoryState } from "../timeline/story-state";
import { range } from "../timeline/phases";
import { modelAssets } from "../data/assets";
import { AssetModel } from "./AssetModel";
import { Textile } from "./Textile";
export function ProtectivePanel({
  state,
  integrated = false,
  highlight = false,
}: {
  state: StoryState;
  integrated?: boolean;
  highlight?: boolean;
}) {
  return (
    <group>
      {modelAssets.protectiveFabric ? (
        <AssetModel url={modelAssets.protectiveFabric} />
      ) : (
        <Textile state={state} protective integrated={integrated} highlight={highlight} />
      )}
      <mesh position={[0, -1.247, 0]}>
        <boxGeometry args={[3.1, 0.014, 0.026]} />
        <meshStandardMaterial color="#951c24" roughness={0.8} />
      </mesh>
    </group>
  );
}
export function ProtectiveFabricLayer({ state }: { state: StoryState }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (group.current) {
      const t = range(state.progress, 0.67, 0.74);
      const smooth = t * t * (3 - 2 * t);
      group.current.visible = state.progress > 0.395 && state.progress < 0.74;
      group.current.position.set(0, 1 - 0.13 * smooth, -3 - 0.46 * smooth);
      group.current.scale.set(1 - 0.013 * smooth, 1 - 0.028 * smooth, 1);
    }
  });
  return (
    <group ref={group} position={[0, 1, -3]}>
      <ProtectivePanel state={state} />
    </group>
  );
}
