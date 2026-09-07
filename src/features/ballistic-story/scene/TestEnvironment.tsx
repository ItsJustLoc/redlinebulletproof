import { Environment, Lightformer } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { StoryState } from "../timeline/story-state";
import { useSurfaceMaps } from "./materials/textile-maps";
export function TestEnvironment({ state }: { state: StoryState }) {
  const rig = useRef<Group>(null);
  const maps = useSurfaceMaps("floor");
  useFrame(() => {
    if (rig.current) rig.current.visible = state.progress < 0.665;
  });
  return (
    <>
      <color attach="background" args={["#080a0c"]} />
      <fog attach="fog" args={["#080a0c", 17, 42]} />
      <Environment resolution={256} frames={1} environmentIntensity={0.65}>
        <Lightformer
          intensity={3}
          color="#e0e7eb"
          position={[2, 7, 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[8, 5, 1]}
        />
        <Lightformer
          intensity={2.2}
          color="#c8d5dc"
          position={[-5, 3, -4]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[3, 7, 1]}
        />
        <Lightformer
          intensity={1.6}
          color="#f2f0ea"
          position={[5, 2, 6]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[2, 6, 1]}
        />
      </Environment>
      <hemisphereLight args={["#b9c6cf", "#1a1717", 0.3]} />
      <directionalLight
        position={[2, 7, 5]}
        intensity={2.2}
        color="#e5e9ec"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={35}
        shadow-normalBias={0.025}
        shadow-bias={-0.00015}
        shadow-radius={3}
      />
      <directionalLight position={[-4, 3, -5]} intensity={1.6} color="#bbcbd6" />
      <directionalLight position={[4, 1, 11]} intensity={0.65} color="#d6dadf" />
      <pointLight position={[4, 0.5, -5]} intensity={6} color="#b3232e" distance={7} decay={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.65, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial
          {...maps}
          color="#161c20"
          roughness={0.86}
          metalness={0.15}
          normalScale={[0.12, 0.12]}
        />
      </mesh>
      <group ref={rig}>
        {[-5.8, 5.8].map((x) => (
          <group key={x}>
            <mesh position={[x, 1.6, -1]}>
              <boxGeometry args={[0.18, 6.5, 33]} />
              <meshStandardMaterial
                {...maps}
                color="#1c252b"
                roughness={0.92}
                normalScale={[0.1, 0.1]}
              />
            </mesh>
            {[-6, 0, 6].map((z) => (
              <group key={z} position={[x * 0.98, 0, z]}>
                <mesh position={[0, 1, 0]}>
                  <boxGeometry args={[0.1, 5.5, 0.13]} />
                  <meshStandardMaterial color="#323e46" metalness={0.5} roughness={0.55} />
                </mesh>
                <mesh position={[0, 3.4, 1.1]}>
                  <boxGeometry args={[0.025, 0.05, 2.1]} />
                  <meshBasicMaterial color="#a3b1ba" />
                </mesh>
              </group>
            ))}
            <mesh position={[x * 0.53, -1.64, 1]}>
              <boxGeometry args={[0.018, 0.008, 22]} />
              <meshBasicMaterial color="#791e28" />
            </mesh>
          </group>
        ))}
        {[2, -4, -10].map((z) => (
          <group key={z} position={[0, 4.7, z]}>
            <mesh>
              <boxGeometry args={[10, 0.12, 0.3]} />
              <meshStandardMaterial color="#263239" metalness={0.4} roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.07, 0]}>
              <boxGeometry args={[3.2, 0.014, 0.24]} />
              <meshBasicMaterial color="#d0d8de" />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 1.1, -12]}>
          <boxGeometry args={[12, 6, 0.3]} />
          <meshStandardMaterial color="#20292f" roughness={0.9} />
        </mesh>
        {[-4, -2, 0, 2, 4].map((x) => (
          <mesh key={x} position={[x, 1.1, -11.82]}>
            <boxGeometry args={[0.02, 5.5, 0.035]} />
            <meshStandardMaterial color="#43515a" metalness={0.45} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </>
  );
}
