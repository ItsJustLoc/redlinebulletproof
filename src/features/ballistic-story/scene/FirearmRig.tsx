import { RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { StoryState } from "../timeline/story-state";
import { EVENTS, range } from "../timeline/phases";
import { modelAssets } from "../data/assets";
import { AssetModel } from "./AssetModel";
export function FirearmRig({ state }: { state: StoryState }) {
  const rig = useRef<Group>(null),
    firearm = useRef<Group>(null),
    flash = useRef<Group>(null);
  useFrame(() => {
    if (rig.current) rig.current.visible = state.progress < 0.14;
    const recoil = Math.sin(range(state.progress, EVENTS.fire, 0.115) * Math.PI);
    if (firearm.current) {
      firearm.current.rotation.x = -recoil * 0.07;
      firearm.current.position.z = recoil * 0.08;
    }
    if (flash.current) flash.current.visible = state.progress > 0.085 && state.progress < 0.09;
  });
  return (
    <group ref={rig} position={[0, 1, 9]}>
      <group ref={firearm}>
        {modelAssets.firearm ? (
          <AssetModel url={modelAssets.firearm} />
        ) : (
          <>
            <RoundedBox args={[0.22, 0.23, 0.85]} radius={0.035}>
              <meshStandardMaterial color="#333a40" metalness={0.75} roughness={0.35} />
            </RoundedBox>
            <RoundedBox
              args={[0.18, 0.4, 0.22]}
              radius={0.03}
              position={[0, -0.27, 0.23]}
              rotation={[0.18, 0, 0]}
            >
              <meshStandardMaterial color="#191d21" roughness={0.85} />
            </RoundedBox>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.005, -0.435]}>
              <cylinderGeometry args={[0.055, 0.055, 0.03, 16]} />
              <meshStandardMaterial color="#080a0c" />
            </mesh>
          </>
        )}
      </group>
      {/* Cropped, anonymous test-operator silhouette; never a person behind the target. */}
      <group position={[-0.48, -0.5, 1.15]}>
        <mesh position={[0, -0.15, 0.1]} scale={[0.65, 0.85, 0.32]}>
          <sphereGeometry args={[0.55, 20, 16]} />
          <meshStandardMaterial color="#171c21" roughness={1} />
        </mesh>
        <mesh position={[0.05, 0.65, 0.2]} scale={[0.33, 0.43, 0.35]}>
          <sphereGeometry args={[0.65, 20, 16]} />
          <meshStandardMaterial color="#13181c" roughness={1} />
        </mesh>
        <mesh position={[0.26, 0.05, -0.49]} rotation={[0.8, -0.32, 0]}>
          <capsuleGeometry args={[0.095, 0.95, 4, 12]} />
          <meshStandardMaterial color="#20262c" roughness={1} />
        </mesh>
      </group>
      <group ref={flash} position={[0, 0, -0.54]} visible={false}>
        <mesh scale={[0.11, 0.11, 0.3]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color="#d88834" transparent opacity={0.8} />
        </mesh>
        <pointLight color="#d88834" intensity={2} distance={3} />
      </group>
    </group>
  );
}
