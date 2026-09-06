import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { StoryState } from "../timeline/story-state";
import { modelAssets } from "../data/assets";
import { AssetModel } from "./AssetModel";
export function Projectile({ state }: { state: StoryState }) {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.visible = state.progress > 0.085 && state.progress < 0.69;
      ref.current.position.set(0, 1, state.projectileZ);
    }
  });
  return (
    <group ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      {modelAssets.projectile ? (
        <AssetModel url={modelAssets.projectile} />
      ) : (
        <>
          <mesh>
            <cylinderGeometry args={[0.085, 0.085, 0.24, 24]} />
            <meshStandardMaterial color="#aaa18f" metalness={0.88} roughness={0.23} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.085, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#b5ae9d" metalness={0.85} roughness={0.26} />
          </mesh>
        </>
      )}
    </group>
  );
}
