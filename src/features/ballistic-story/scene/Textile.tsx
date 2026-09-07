import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { StoryState } from "../timeline/story-state";
import { range } from "../timeline/phases";
import { useSurfaceMaps } from "./materials/textile-maps";

export function textileDepth(x: number, y: number, response: number, protective: boolean) {
  const r = Math.hypot(x, y);
  const drape = Math.sin(x * 2.8 + y * 0.8) * 0.017 + Math.cos(y * 3.2) * 0.008;
  const dent = -Math.exp(-r * r * 5) * response * (protective ? 0.34 : 0.48);
  const wave = protective
    ? Math.sin(r * 10 - response * 9) *
      Math.exp(-r * 1.9) *
      (1 - Math.exp(-r * r * 18)) *
      Math.sin(response * Math.PI) *
      0.07
    : 0;
  return drape + dent + wave;
}
function openingGeometry() {
  const g = new THREE.BufferGeometry(),
    positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const segments = 96,
    rings = 32;
  for (let row = 0; row <= rings; row++)
    for (let col = 0; col <= segments; col++) {
      const angle = (col / segments) * Math.PI * 2,
        c = Math.cos(angle),
        s = Math.sin(angle);
      const edge = Math.min(
        1.55 / Math.max(Math.abs(c), 0.0001),
        1.25 / Math.max(Math.abs(s), 0.0001),
      );
      const r = (edge * row) / rings;
      positions.push(c * r, s * r, 0);
      uvs.push((c * r) / 3.1 + 0.5, (s * r) / 2.5 + 0.5);
    }
  for (let row = 0; row < rings; row++)
    for (let col = 0; col < segments; col++) {
      const a = row * (segments + 1) + col,
        b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
export function Textile({
  state,
  protective = false,
  integrated = false,
  highlight = false,
}: {
  state: StoryState;
  protective?: boolean;
  integrated?: boolean;
  highlight?: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null),
    fibers = useRef<THREE.Group>(null),
    last = useRef(-1);
  const maps = useSurfaceMaps(protective ? "protective" : "ordinary");
  const geometry = useMemo(
    () => (protective ? new THREE.PlaneGeometry(3.1, 2.5, 80, 64) : openingGeometry()),
    [protective],
  );
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const response = integrated
      ? 0
      : protective
        ? state.impact * (1 - range(state.progress, 0.65, 0.73))
        : state.fabricBreak;
    if (last.current === response) return;
    last.current = response;
    if (!mesh.current) return;
    const liveGeometry = mesh.current.geometry;
    const position = liveGeometry.attributes.position,
      uv = liveGeometry.attributes.uv;
    for (let i = 0; i < position.count; i++) {
      let x = base[i * 3],
        y = base[i * 3 + 1];
      if (!protective) {
        const col = i % 97,
          row = Math.floor(i / 97),
          a = (col / 96) * Math.PI * 2;
        const tear =
          (0.145 + 0.028 * Math.sin(a * 7) + 0.014 * Math.sin(a * 13)) * range(response, 0, 0.34);
        x += Math.cos(a) * tear * (1 - row / 32);
        y += Math.sin(a) * tear * (1 - row / 32);
      }
      position.setXYZ(i, x, y, textileDepth(x, y, response, protective));
      uv.setXY(i, x / 3.1 + 0.5, y / 2.5 + 0.5);
    }
    position.needsUpdate = true;
    uv.needsUpdate = true;
    liveGeometry.computeVertexNormals();
    if (fibers.current) {
      fibers.current.visible = !protective && response > 0;
      fibers.current.children.forEach((fiber, i) => {
        const a = (i / 18) * Math.PI * 2,
          r =
            (0.145 + 0.028 * Math.sin(a * 7) + 0.014 * Math.sin(a * 13)) * range(response, 0, 0.34);
        const x = Math.cos(a) * r,
          y = Math.sin(a) * r;
        fiber.position.set(x, y, textileDepth(x, y, response, false));
        fiber.scale.setScalar(range(response, 0, 0.3));
      });
    }
  });
  return (
    <group>
      <mesh ref={mesh} geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          {...maps}
          color={protective ? "#68737c" : "#a99a85"}
          roughness={0.94}
          metalness={0}
          normalScale={[0.23, 0.23]}
          side={THREE.DoubleSide}
          sheen={protective ? 0.45 : 0.2}
          sheenRoughness={0.72}
          sheenColor={protective ? "#a8bbc6" : "#b7a58c"}
          emissive={highlight ? "#52697a" : "#000000"}
          emissiveIntensity={highlight ? 0.28 : 0}
        />
      </mesh>
      {protective && (
        <mesh position={[0, 0, -0.018]} geometry={geometry}>
          <meshStandardMaterial
            {...maps}
            color="#515c65"
            roughness={0.95}
            normalScale={[0.23, 0.23]}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {!protective && (
        <group ref={fibers} visible={false}>
          {Array.from({ length: 18 }, (_, i) => (
            <mesh key={i} rotation={[0.8 + Math.sin(i) * 0.4, 0, (i / 18) * Math.PI * 2]}>
              <cylinderGeometry args={[0.002, 0.001, 0.055 + (i % 4) * 0.015, 4]} />
              <meshStandardMaterial color="#b8ac9a" roughness={1} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
