import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { StoryState } from "../timeline/story-state";

function weaveTexture() {
  const size = 128,
    pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const warp = Math.floor(x / 8) % 2 === Math.floor(y / 8) % 2;
      const thread = warp ? y % 8 : x % 8;
      const brightness = 70 + Math.sin((thread / 8) * Math.PI) * 145 + ((x * 13 + y * 7) % 11);
      const i = (y * size + x) * 4;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = brightness;
      pixels[i + 3] = 255;
    }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
export function Textile({
  state,
  protective = false,
  offset = 0,
}: {
  state: StoryState;
  protective?: boolean;
  offset?: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const lastResponse = useRef(-1);
  const texture = useMemo(() => weaveTexture(), []);
  const geometry = useMemo(() => new THREE.PlaneGeometry(3.1, 2.5, 56, 48), []);
  useEffect(
    () => () => {
      texture.dispose();
      geometry.dispose();
    },
    [texture, geometry],
  );
  useFrame(() => {
    if (!mesh.current) return;
    const liveGeometry = mesh.current.geometry;
    const position = liveGeometry.attributes.position;
    const response = protective ? state.impact * (1 - state.assembly) : state.fabricBreak;
    mesh.current.position.z = offset * (1 - state.assembly);
    if (lastResponse.current === response) return;
    lastResponse.current = response;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i),
        y = position.getY(i),
        radius = Math.hypot(x, y);
      const base = Math.sin(x * 3 + y * 1.5) * 0.025;
      const dent = -Math.exp(-radius * radius * 5) * response * (protective ? 0.34 : 0.7);
      const wave = protective
        ? Math.sin(radius * 9 - response * 11) *
          Math.exp(-radius * 1.2) *
          Math.sin(response * Math.PI) *
          0.13
        : 0;
      position.setZ(i, base + dent + wave);
    }
    position.needsUpdate = true;
    liveGeometry.computeVertexNormals();
  });
  return (
    <mesh ref={mesh} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={protective ? "#737c84" : "#8d8272"}
        roughness={0.9}
        metalness={protective ? 0.18 : 0}
        map={texture}
        bumpMap={texture}
        bumpScale={0.022}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
