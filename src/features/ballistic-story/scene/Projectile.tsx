import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { StoryState } from "../timeline/story-state";
import { range } from "../timeline/phases";
import { modelAssets } from "../data/assets";
import { AssetModel } from "./AssetModel";
export function Projectile({ state }: { state: StoryState }) {
  const ref = useRef<THREE.Group>(null),
    trail = useRef<THREE.Mesh>(null);
  const geometry = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0, -0.19],
          [0.062, -0.19],
          [0.078, -0.177],
          [0.081, -0.145],
          [0.081, 0.015],
          [0.076, 0.08],
          [0.062, 0.145],
          [0.04, 0.205],
          [0.016, 0.251],
          [0, 0.27],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        40,
      ),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (ref.current) {
      ref.current.visible = state.progress > 0.085 && state.progress < 0.68;
      ref.current.position.set(0, 1, state.projectileZ);
    }
    if (trail.current) {
      const visibility =
        range(state.progress, 0.11, 0.14) * (1 - range(state.progress, 0.51, 0.55));
      trail.current.scale.y = visibility;
      trail.current.visible = visibility > 0;
    }
  });
  return (
    <group ref={ref} rotation={[-Math.PI / 2, 0, 0]} name="projectile">
      {modelAssets.projectile ? (
        <AssetModel url={modelAssets.projectile} />
      ) : (
        <mesh geometry={geometry} castShadow>
          <meshStandardMaterial color="#b7b0a0" metalness={0.92} roughness={0.26} />
        </mesh>
      )}
      <mesh ref={trail} position={[0, -0.45, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.032, 0.48, 12]} />
        <meshBasicMaterial color="#a6adb3" transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  );
}
