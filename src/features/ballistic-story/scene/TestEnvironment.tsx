import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { StoryState } from "../timeline/story-state";
export function TestEnvironment({ state }: { state: StoryState }) {
  const rig = useRef<Group>(null);
  useFrame(() => {
    if (rig.current) rig.current.visible = state.progress < 0.67;
  });
  return (
    <>
      <color attach="background" args={["#080a0c"]} />
      <fog attach="fog" args={["#080a0c", 12, 33]} />
      <hemisphereLight args={["#b7c7d9", "#191517", 1.25]} />
      <directionalLight
        position={[2, 7, 6]}
        intensity={3.5}
        color="#e1e6eb"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-4, 3, -5]} intensity={3} color="#b6c8d6" />
      <pointLight position={[4, 1, -4]} intensity={13} color="#d22630" distance={9} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.65, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#0b0f12" roughness={0.82} metalness={0.12} />
      </mesh>
      <group ref={rig}>
        {[-4, 4].map((x) => (
          <group key={x}>
            <mesh position={[x, 2, -3]}>
              <boxGeometry args={[0.08, 7, 36]} />
              <meshStandardMaterial color="#141b21" roughness={0.7} />
            </mesh>
            <mesh position={[x, 4.2, 2]}>
              <boxGeometry args={[0.04, 0.035, 22]} />
              <meshBasicMaterial color="#aeb8c3" />
            </mesh>
            <mesh position={[x * 0.68, -1.63, 2]}>
              <boxGeometry args={[0.015, 0.012, 23]} />
              <meshBasicMaterial color="#751b23" />
            </mesh>
          </group>
        ))}
        {[0, 4, 8, 12].map((z) => (
          <mesh key={z} position={[0, 5, -z]}>
            <boxGeometry args={[8, 0.055, 0.05]} />
            <meshBasicMaterial color="#626a70" />
          </mesh>
        ))}
        <mesh position={[0, 1, -10]}>
          <boxGeometry args={[8, 5, 0.25]} />
          <meshStandardMaterial color="#1e252b" roughness={1} />
        </mesh>
        {[-3, -2, -1, 0, 1, 2, 3].map((x) => (
          <mesh key={x} position={[x, 1, -9.83]}>
            <boxGeometry args={[0.025, 4, 0.01]} />
            <meshStandardMaterial color="#465058" />
          </mesh>
        ))}
      </group>
    </>
  );
}
