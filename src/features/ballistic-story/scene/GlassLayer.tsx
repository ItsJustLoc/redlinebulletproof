import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { modelAssets } from "../data/assets";
import { AssetModel } from "./AssetModel";
import type { StoryState } from "../timeline/story-state";
export function GlassLayer({ state }: { state: StoryState }) {
  const group = useRef<THREE.Group>(null),
    fragments = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const pieces: THREE.BufferGeometry[] = [];
    const perimeter = [
      [-1.55, -1.25],
      [0, -1.25],
      [1.55, -1.25],
      [1.55, 0],
      [1.55, 1.25],
      [0, 1.25],
      [-1.55, 1.25],
      [-1.55, 0],
    ];
    perimeter.forEach((a, i) => {
      const b = perimeter[(i + 1) % perimeter.length];
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, ...a, 0, ...b, 0], 3));
      g.computeVertexNormals();
      pieces.push(g);
    });
    return pieces;
  }, []);
  useEffect(() => () => geometry.forEach((g) => g.dispose()), [geometry]);
  useFrame(() => {
    if (group.current) group.current.visible = state.progress < 0.345;
    fragments.current?.children.forEach((piece, i) => {
      const a = (i * Math.PI) / 4;
      const t = state.glassBreak;
      piece.position.set(
        Math.sin(a) * t * 0.8,
        -t * t * (0.5 + i * 0.18),
        -t * (0.3 + (i % 3) * 0.25),
      );
      piece.rotation.set(t * 0.5 * Math.sin(a), t * 0.7 * Math.cos(a), t * 0.3);
    });
  });
  return (
    <group ref={group} position={[0, 1, 3]}>
      {modelAssets.glass ? (
        <AssetModel url={modelAssets.glass} />
      ) : (
        <>
          <group ref={fragments}>
            {geometry.map((g, i) => (
              <mesh key={i} geometry={g}>
                <meshPhysicalMaterial
                  color="#b1c8d1"
                  transparent
                  opacity={0.38}
                  transmission={0.72}
                  thickness={0.07}
                  roughness={0.12}
                  metalness={0.12}
                  side={THREE.DoubleSide}
                />
              </mesh>
            ))}
          </group>
          {[-1.6, 1.6].map((x) => (
            <mesh key={x} position={[x, -0.55, 0]}>
              <boxGeometry args={[0.04, 3.5, 0.07]} />
              <meshStandardMaterial color="#687681" metalness={0.8} roughness={0.4} />
            </mesh>
          ))}
          {[-1.3, 1.3].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <boxGeometry args={[3.25, 0.035, 0.04]} />
              <meshStandardMaterial color="#acb7bf" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}
