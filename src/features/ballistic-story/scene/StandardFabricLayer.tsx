import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import type { StoryState } from "../timeline/story-state";
import { modelAssets } from "../data/assets";
import { AssetModel } from "./AssetModel";
import { Textile } from "./Textile";
export function StandardFabricLayer({ state }: { state: StoryState }) {
  const group = useRef<Group>(null),
    hole = useRef<Mesh>(null),
    fibers = useRef<Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = state.progress > 0.26 && state.progress < 0.455;
    if (hole.current) hole.current.scale.setScalar(state.fabricBreak * 0.18);
    if (fibers.current) fibers.current.visible = state.fabricBreak > 0;
  });
  return (
    <group ref={group} position={[0, 1, 0]}>
      {modelAssets.standardFabric ? (
        <AssetModel url={modelAssets.standardFabric} />
      ) : (
        <Textile state={state} />
      )}
      <mesh ref={hole} position={[0, 0, 0.035]}>
        <circleGeometry args={[1, 9]} />
        <meshBasicMaterial color="#080a0c" />
      </mesh>
      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 1.32, 0]}>
          <boxGeometry args={[0.15, 0.14, 0.09]} />
          <meshStandardMaterial color="#85919a" metalness={0.75} roughness={0.3} />
        </mesh>
      ))}
      <group ref={fibers}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh
            key={i}
            position={[Math.sin(i * 2.4) * 0.13, Math.cos(i * 2.4) * 0.13, 0.05]}
            rotation={[0, 0, i]}
          >
            <boxGeometry args={[0.003, 0.17, 0.003]} />
            <meshStandardMaterial color="#a39c8f" />
          </mesh>
        ))}
      </group>
    </group>
  );
}
