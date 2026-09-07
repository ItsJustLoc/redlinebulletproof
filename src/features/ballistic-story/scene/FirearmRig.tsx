import { RoundedBox } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { StoryState } from "../timeline/story-state";
import { range } from "../timeline/phases";
import { modelAssets } from "../data/assets";
import { AssetModel } from "./AssetModel";
import { MuzzleEffect } from "./MuzzleEffect";
function ArmSegment({
  a,
  b,
  radius,
}: {
  a: [number, number, number];
  b: [number, number, number];
  radius: number;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const av = new THREE.Vector3(...a),
      bv = new THREE.Vector3(...b),
      d = bv.clone().sub(av);
    return {
      position: av.add(bv).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        d.clone().normalize(),
      ),
      length: d.length(),
    };
  }, [a, b]);
  return (
    <mesh position={position} quaternion={quaternion} castShadow>
      <capsuleGeometry args={[radius, length - radius * 2, 6, 16]} />
      <meshStandardMaterial color="#222b32" roughness={0.88} />
    </mesh>
  );
}
export function FirearmRig({ state }: { state: StoryState }) {
  const operator = useRef<THREE.Group>(null);
  const rig = useRef<THREE.Group>(null),
    firearm = useRef<THREE.Group>(null);
  useFrame(() => {
    if (rig.current) rig.current.visible = state.progress < 0.14;
    if (operator.current) {
      operator.current.visible = state.progress < 0.108;
      operator.current.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) {
          object.material.transparent = true;
          object.material.opacity = 1 - range(state.progress, 0.098, 0.108);
        }
      });
    }
    const recoil = Math.sin(range(state.progress, 0.085, 0.12) * Math.PI);
    if (firearm.current) {
      firearm.current.rotation.x = -recoil * 0.06;
      firearm.current.position.z = recoil * 0.045;
    }
  });
  return (
    <group ref={rig} position={[0, 1, 9]}>
      <group ref={firearm}>
        {modelAssets.firearm ? (
          <AssetModel url={modelAssets.firearm} />
        ) : (
          <>
            <RoundedBox
              args={[0.21, 0.18, 0.86]}
              radius={0.022}
              position={[0, 0.035, 0]}
              castShadow
            >
              <meshStandardMaterial color="#53606b" metalness={0.85} roughness={0.31} />
            </RoundedBox>
            <RoundedBox args={[0.2, 0.08, 0.68]} radius={0.018} position={[0, -0.095, 0.075]}>
              <meshStandardMaterial color="#20282e" roughness={0.7} metalness={0.25} />
            </RoundedBox>
            <RoundedBox
              args={[0.17, 0.34, 0.23]}
              radius={0.032}
              position={[0, -0.27, 0.25]}
              rotation={[0.22, 0, 0]}
            >
              <meshStandardMaterial color="#282f34" roughness={0.83} />
            </RoundedBox>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, -0.441]}>
              <torusGeometry args={[0.045, 0.012, 8, 24]} />
              <meshStandardMaterial color="#414c54" metalness={0.8} roughness={0.28} />
            </mesh>
            <mesh position={[0, 0.02, -0.441]}>
              <circleGeometry args={[0.036, 24]} />
              <meshStandardMaterial color="#080a0c" />
            </mesh>
          </>
        )}
        <MuzzleEffect state={state} />
        <mesh position={[0, -0.2, 0.29]} scale={[0.135, 0.15, 0.13]}>
          <sphereGeometry args={[1, 20, 16]} />
          <meshStandardMaterial color="#252e35" roughness={0.9} />
        </mesh>
      </group>
      {/* The cropped operator remains behind the firearm, never beyond a target. */}
      <group ref={operator}>
        <mesh position={[-0.45, -0.55, 1.48]} scale={[0.6, 0.81, 0.36]} castShadow>
          <sphereGeometry args={[1, 24, 20]} />
          <meshStandardMaterial color="#182229" roughness={0.95} />
        </mesh>
        <mesh position={[-0.35, 0.48, 1.67]} scale={[0.27, 0.37, 0.29]}>
          <sphereGeometry args={[1, 24, 20]} />
          <meshStandardMaterial color="#202b32" roughness={0.95} />
        </mesh>
        <ArmSegment a={[-0.02, -0.15, 1.35]} b={[-0.28, -0.34, 0.72]} radius={0.13} />
        <ArmSegment a={[-0.28, -0.34, 0.72]} b={[0.02, -0.21, 0.26]} radius={0.1} />
      </group>
    </group>
  );
}
