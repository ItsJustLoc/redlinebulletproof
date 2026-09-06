import { RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { StoryState } from "../timeline/story-state";
import { modelAssets, seatPartAssets } from "../data/assets";
import { AssetModel, AssetSlot } from "./AssetModel";

export function BusSeat({
  state,
  standalone = false,
  selected = null,
}: {
  state: StoryState;
  standalone?: boolean;
  selected?: string | null;
}) {
  const root = useRef<Group>(null),
    upholstery = useRef<Group>(null),
    comfort = useRef<Group>(null),
    protective = useRef<Group>(null),
    shell = useRef<Group>(null);
  useFrame(() => {
    if (!root.current) return;
    root.current.visible = standalone || state.progress < 0.12 || state.progress > 0.675;
    root.current.rotation.y = state.seatTurn;
    const assembling = state.progress > 0.67 ? 1 - state.assembly : 0;
    const spread = state.exploded;
    if (upholstery.current)
      upholstery.current.position.set(0, assembling * 1.2, assembling * 3.3 + spread * 1.85);
    if (comfort.current) comfort.current.position.z = assembling * 1.8 + spread * 0.85;
    if (protective.current) protective.current.position.z = spread * 0.18;
    if (shell.current) shell.current.position.z = -assembling * 1.5 - spread * 0.6;
  });
  const upholsteryColor = selected === "upholstery" ? "#888279" : "#5d5a55";
  return (
    <group ref={root} position={[0, -1.6, -3.15]}>
      {modelAssets.seat ? (
        <AssetModel url={modelAssets.seat} />
      ) : (
        <>
          <group ref={upholstery}>
            <AssetSlot url={seatPartAssets.upholstery}>
              <RoundedBox
                castShadow
                receiveShadow
                args={[3.25, 2.6, 0.33]}
                radius={0.18}
                smoothness={4}
                position={[0, 2.48, 0.05]}
              >
                <meshStandardMaterial color={upholsteryColor} roughness={0.73} metalness={0.035} />
              </RoundedBox>
              <RoundedBox
                castShadow
                receiveShadow
                args={[3.25, 0.37, 1.75]}
                radius={0.16}
                smoothness={4}
                position={[0, 1.02, 0.86]}
              >
                <meshStandardMaterial color={upholsteryColor} roughness={0.76} />
              </RoundedBox>
              {/* Narrow seam rails and welt follow the upholstered silhouette. */}
              {[-1.47, 1.47].map((x) => (
                <RoundedBox
                  key={x}
                  args={[0.012, 2.2, 0.016]}
                  radius={0.005}
                  position={[x, 2.48, 0.218]}
                >
                  <meshStandardMaterial color="#aaa296" roughness={0.8} />
                </RoundedBox>
              ))}
              <RoundedBox
                castShadow
                receiveShadow
                args={[2.92, 0.018, 0.017]}
                radius={0.006}
                position={[0, 3.63, 0.204]}
              >
                <meshStandardMaterial color="#aaa296" roughness={0.8} />
              </RoundedBox>
              <RoundedBox
                castShadow
                receiveShadow
                args={[2.98, 0.022, 0.016]}
                radius={0.006}
                position={[0, 1.04, 1.739]}
              >
                <meshStandardMaterial color="#969086" roughness={0.8} />
              </RoundedBox>
              <mesh position={[1.25, 1.38, 0.225]}>
                <boxGeometry args={[0.12, 0.22, 0.014]} />
                <meshStandardMaterial color="#d22630" roughness={0.8} />
              </mesh>
              <mesh position={[1.25, 1.39, 0.235]}>
                <boxGeometry args={[0.055, 0.009, 0.006]} />
                <meshStandardMaterial color="#d6dadf" />
              </mesh>
            </AssetSlot>
          </group>
          <group ref={comfort}>
            <AssetSlot url={seatPartAssets.comfort}>
              <RoundedBox
                castShadow
                receiveShadow
                args={[3.02, 2.4, 0.2]}
                radius={0.14}
                position={[0, 2.47, -0.16]}
              >
                <meshStandardMaterial color="#b3ac96" roughness={1} />
              </RoundedBox>
              <RoundedBox
                castShadow
                receiveShadow
                args={[3.02, 0.19, 1.6]}
                radius={0.08}
                position={[0, 0.81, 0.81]}
              >
                <meshStandardMaterial color="#b3ac96" roughness={1} />
              </RoundedBox>
            </AssetSlot>
          </group>
          <group ref={protective}>
            <AssetSlot url={seatPartAssets.protective}>
              <RoundedBox
                castShadow
                receiveShadow
                args={[3.06, 2.43, 0.06]}
                radius={0.045}
                position={[0, 2.47, -0.31]}
              >
                <meshStandardMaterial
                  color={selected === "protective" ? "#9ca6b0" : "#3b444d"}
                  metalness={0.32}
                  roughness={0.68}
                />
              </RoundedBox>
              {Array.from({ length: 25 }, (_, i) => (
                <mesh key={i} position={[-1.42 + i * 0.119, 2.47, -0.274]}>
                  <boxGeometry args={[0.012, 2.25, 0.008]} />
                  <meshStandardMaterial color="#707a82" metalness={0.15} roughness={0.9} />
                </mesh>
              ))}
              <mesh position={[0, 1.28, -0.28]}>
                <boxGeometry args={[3.02, 0.02, 0.015]} />
                <meshStandardMaterial color="#d22630" roughness={0.7} />
              </mesh>
            </AssetSlot>
          </group>
          <group ref={shell}>
            <AssetSlot url={seatPartAssets.structure}>
              <RoundedBox
                castShadow
                receiveShadow
                args={[3.18, 2.54, 0.13]}
                radius={0.15}
                position={[0, 2.45, -0.42]}
              >
                <meshStandardMaterial color="#282e33" roughness={0.53} />
              </RoundedBox>
              <RoundedBox
                castShadow
                receiveShadow
                args={[3.07, 0.1, 1.6]}
                radius={0.04}
                position={[0, 0.66, 0.76]}
              >
                <meshStandardMaterial color="#272d33" roughness={0.53} />
              </RoundedBox>
            </AssetSlot>
          </group>
          {[-1.18, 1.18].map((x) => (
            <group key={x}>
              <mesh position={[x, 0.38, 0.18]}>
                <cylinderGeometry args={[0.065, 0.065, 0.72, 16]} />
                <meshStandardMaterial color="#48515a" roughness={0.32} metalness={0.8} />
              </mesh>
              <mesh position={[x, 0.38, 1.28]} rotation={[-0.1, 0, 0]}>
                <cylinderGeometry args={[0.065, 0.065, 0.72, 16]} />
                <meshStandardMaterial color="#48515a" roughness={0.32} metalness={0.8} />
              </mesh>
              <RoundedBox
                castShadow
                receiveShadow
                args={[0.2, 0.06, 1.56]}
                radius={0.02}
                position={[x, 0.04, 0.72]}
              >
                <meshStandardMaterial color="#313a42" roughness={0.5} metalness={0.65} />
              </RoundedBox>
              <mesh position={[x, 1.28, -0.38]}>
                <cylinderGeometry args={[0.055, 0.055, 2.5, 16]} />
                <meshStandardMaterial color="#4b555f" roughness={0.36} metalness={0.8} />
              </mesh>
              {[0.03, 1.42].map((z) => (
                <mesh key={z} position={[x, 0.08, z]}>
                  <cylinderGeometry args={[0.045, 0.045, 0.03, 6]} />
                  <meshStandardMaterial color="#a6adb3" roughness={0.3} metalness={0.85} />
                </mesh>
              ))}
            </group>
          ))}
          <mesh position={[0, 0.56, 0.7]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 2.7, 16]} />
            <meshStandardMaterial color="#52606c" roughness={0.34} metalness={0.8} />
          </mesh>
        </>
      )}
    </group>
  );
}
