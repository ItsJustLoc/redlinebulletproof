import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { modelAssets } from "../data/assets";
import { AssetModel } from "./AssetModel";
import type { StoryState } from "../timeline/story-state";
type Point = [number, number];
function fractureCells() {
  const seeds: Point[] = [
    [0.01, 0.015],
    [-0.065, 0.03],
    [0.065, -0.04],
  ];
  for (let i = 0; i < 13; i++) {
    const a = i * 2.399;
    const r = 0.17 + (i % 4) * 0.15;
    seeds.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 5; x++)
      seeds.push([
        -1.4 + x * 0.68 + Math.sin(x * 4 + y) * 0.12,
        -1.13 + y * 0.73 + Math.sin(y * 3 + x) * 0.1,
      ]);
  return seeds.map((seed, index) => {
    let polygon: Point[] = [
      [-1.55, -1.25],
      [1.55, -1.25],
      [1.55, 1.25],
      [-1.55, 1.25],
    ];
    seeds.forEach((other, j) => {
      if (j === index) return;
      const nx = other[0] - seed[0],
        ny = other[1] - seed[1],
        limit = (other[0] ** 2 + other[1] ** 2 - seed[0] ** 2 - seed[1] ** 2) / 2;
      const next: Point[] = [];
      polygon.forEach((a, i) => {
        const b = polygon[(i + 1) % polygon.length],
          da = a[0] * nx + a[1] * ny - limit,
          db = b[0] * nx + b[1] * ny - limit;
        if (da <= 0) next.push(a);
        if (da <= 0 !== db <= 0) {
          const t = da / (da - db);
          next.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        }
      });
      polygon = next;
    });
    const shape = new THREE.Shape(
      polygon.map(([x, y]) => new THREE.Vector2(x - seed[0], y - seed[1])),
    );
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.027, bevelEnabled: false });
    geometry.translate(0, 0, -0.0135);
    return { geometry, seed };
  });
}
export function GlassLayer({ state }: { state: StoryState }) {
  const group = useRef<THREE.Group>(null),
    fragments = useRef<THREE.Group>(null),
    intact = useRef<THREE.Mesh>(null);
  const cells = useMemo(() => fractureCells(), []);
  useEffect(() => () => cells.forEach((c) => c.geometry.dispose()), [cells]);
  useFrame(() => {
    if (group.current) group.current.visible = state.progress < 0.345;
    if (intact.current) intact.current.visible = state.glassBreak === 0;
    if (fragments.current) {
      fragments.current.visible = state.glassBreak > 0;
      fragments.current.children.forEach((piece, i) => {
        const [x, y] = cells[i].seed,
          t = state.glassBreak,
          near = Math.exp(-(x * x + y * y) * 2.3);
        piece.position.set(
          x + x * t * 0.11,
          y - t * t * (0.14 + near * 0.5),
          -t * (0.12 + near * 0.64),
        );
        piece.rotation.set(
          t * (0.13 + near * 0.5) * Math.sin(i * 3),
          t * (0.2 + near * 0.7) * Math.cos(i * 5),
          t * 0.13 * Math.sin(i),
        );
      });
    }
  });
  return (
    <group ref={group} position={[0, 1, 3]}>
      {modelAssets.glass ? (
        <AssetModel url={modelAssets.glass} />
      ) : (
        <>
          <mesh ref={intact}>
            <boxGeometry args={[3.1, 2.5, 0.027]} />
            <meshPhysicalMaterial
              color="#d9e6e9"
              opacity={1}
              transmission={0.94}
              thickness={0.027}
              ior={1.5}
              roughness={0.055}
              metalness={0}
              envMapIntensity={1.3}
            />
          </mesh>
          <group ref={fragments} visible={false}>
            {cells.map(({ geometry, seed }, i) => (
              <group key={i} position={[...seed, 0]}>
                <mesh geometry={geometry}>
                  <meshPhysicalMaterial
                    color="#d5e1e5"
                    opacity={1}
                    transmission={0.87}
                    thickness={0.027}
                    ior={1.5}
                    roughness={0.075}
                    metalness={0}
                  />
                </mesh>
                <lineSegments>
                  <edgesGeometry args={[geometry, 30]} />
                  <lineBasicMaterial color="#b7cbd6" transparent opacity={0.38} />
                </lineSegments>
              </group>
            ))}
          </group>
          {[-1.61, 1.61].map((x) => (
            <group key={x}>
              <mesh position={[x, -0.55, 0]}>
                <boxGeometry args={[0.045, 3.5, 0.075]} />
                <meshStandardMaterial color="#6b7a85" metalness={0.8} roughness={0.33} />
              </mesh>
              {[-1.16, 1.16].map((y) => (
                <mesh key={y} position={[x * 0.94, y, 0]}>
                  <boxGeometry args={[0.18, 0.11, 0.1]} />
                  <meshStandardMaterial color="#85959f" metalness={0.8} roughness={0.32} />
                </mesh>
              ))}
            </group>
          ))}
        </>
      )}
    </group>
  );
}
