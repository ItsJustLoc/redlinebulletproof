import { Html, Line, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { StoryState } from "../timeline/story-state";
import { modelAssets, seatPartAssets } from "../data/assets";
import { AssetModel, AssetSlot } from "./AssetModel";
import { UpholsteredCushion } from "./UpholsteredCushion";
import { ProtectivePanel } from "./ProtectiveFabricLayer";

function PartLabel({
  name,
  anchor,
  end,
}: {
  name: string;
  anchor: [number, number, number];
  end: [number, number, number];
}) {
  return (
    <group>
      <Line points={[anchor, end]} color="#a6adb3" lineWidth={1} transparent opacity={0.75} />
      <mesh position={anchor}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshBasicMaterial color="#f2f0ea" />
      </mesh>
      <Html position={end} style={{ pointerEvents: "none" }}>
        <span className="seat-part-label">{name}</span>
      </Html>
    </group>
  );
}
function SeatFrame({ selected }: { selected: boolean }) {
  const rail = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          [
            new THREE.Vector3(0, 0.07, 1.36),
            new THREE.Vector3(0, 0.12, 1.32),
            new THREE.Vector3(0, 0.64, 1.21),
            new THREE.Vector3(0, 0.71, 0.2),
            new THREE.Vector3(0, 0.94, -0.37),
            new THREE.Vector3(0, 2.9, -0.47),
          ],
          false,
          "centripetal",
        ),
        48,
        0.066,
        12,
        false,
      ),
    [],
  );
  useEffect(() => () => rail.dispose(), [rail]);
  const metal = selected ? "#b1bdc4" : "#536069";
  return (
    <group>
      {[-1.18, 1.18].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh geometry={rail} castShadow>
            <meshStandardMaterial
              color={metal}
              metalness={0.8}
              roughness={0.34}
              emissive={selected ? "#496271" : "#000000"}
              emissiveIntensity={0.4}
            />
          </mesh>
          <mesh position={[0, 0.37, 0.16]}>
            <cylinderGeometry args={[0.059, 0.069, 0.62, 16]} />
            <meshStandardMaterial color={metal} metalness={0.75} roughness={0.38} />
          </mesh>
          <RoundedBox
            args={[0.26, 0.075, 1.64]}
            radius={0.027}
            position={[0, 0.04, 0.71]}
            castShadow
          >
            <meshStandardMaterial
              color={selected ? "#9aaab5" : "#303b43"}
              roughness={0.47}
              metalness={0.65}
            />
          </RoundedBox>
          {[0.02, 1.4].map((z) => (
            <group key={z} position={[0, 0.092, z]}>
              <mesh>
                <cylinderGeometry args={[0.067, 0.067, 0.014, 20]} />
                <meshStandardMaterial color="#30383f" metalness={0.65} roughness={0.45} />
              </mesh>
              <mesh position={[0, 0.018, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.028, 6]} />
                <meshStandardMaterial color="#9eabb5" metalness={0.9} roughness={0.3} />
              </mesh>
            </group>
          ))}
          {[0.62, 1.18].map((y) => (
            <group key={y} position={[0, y, -0.34]}>
              <RoundedBox args={[0.23, 0.18, 0.15]} radius={0.018}>
                <meshStandardMaterial color={metal} metalness={0.7} roughness={0.42} />
              </RoundedBox>
              <mesh position={[0.125, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.039, 0.039, 0.03, 6]} />
                <meshStandardMaterial color="#a6adb3" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {[0.2, 1.21].map((z) => (
        <mesh key={z} position={[0, 0.59, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 2.4, 16]} />
          <meshStandardMaterial color={metal} roughness={0.36} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
export function BusSeat({
  state,
  standalone = false,
  selected = null,
  annotations = false,
}: {
  state: StoryState;
  standalone?: boolean;
  selected?: string | null;
  annotations?: boolean;
}) {
  const root = useRef<THREE.Group>(null),
    upholstery = useRef<THREE.Group>(null),
    comfort = useRef<THREE.Group>(null),
    protective = useRef<THREE.Group>(null),
    shell = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!root.current) return;
    root.current.visible = standalone || state.progress < 0.12 || state.progress > 0.675;
    root.current.rotation.y = state.seatTurn;
    const arriving = standalone || state.progress < 0.12 ? 0 : 1 - state.assembly,
      spread = state.exploded;
    upholstery.current?.position.set(
      -spread * 0.75,
      arriving * 1.4,
      arriving * 4.7 + spread * 2.65,
    );
    comfort.current?.position.set(-spread * 0.2, arriving * 0.25, arriving * 2.5 + spread * 1.3);
    if (protective.current) {
      protective.current.visible = standalone || state.progress < 0.12 || state.progress >= 0.74;
      protective.current.position.set(spread * 0.35, 0, spread * 0.08);
    }
    shell.current?.position.set(spread * 0.9, 0, -arriving * 2.7 - spread * 0.95);
  });
  return (
    <group ref={root} position={[0, -1.6, -3.15]} name="seat-root" userData={{ selected }}>
      {modelAssets.seat ? (
        <AssetModel url={modelAssets.seat} />
      ) : (
        <>
          <group ref={upholstery} name="seat-upholstery">
            <AssetSlot url={seatPartAssets.upholstery}>
              <group position={[0, 2.48, 0.06]}>
                <UpholsteredCushion selected={selected === "upholstery"} />
              </group>
              <group position={[0, 1.035, 0.86]} rotation={[-Math.PI / 2, 0, 0]}>
                <UpholsteredCushion height={1.76} seat selected={selected === "upholstery"} />
              </group>
              <RoundedBox args={[2.95, 0.11, 0.13]} radius={0.05} position={[0, 1.33, 0.19]}>
                <meshStandardMaterial color="#383d3e" roughness={0.8} />
              </RoundedBox>
              <mesh position={[1.29, 1.52, 0.252]}>
                <boxGeometry args={[0.11, 0.21, 0.018]} />
                <meshStandardMaterial color="#b52631" roughness={0.8} />
              </mesh>
              <mesh position={[1.29, 1.53, 0.263]}>
                <boxGeometry args={[0.055, 0.009, 0.008]} />
                <meshStandardMaterial color="#d6dadf" />
              </mesh>
            </AssetSlot>
            {annotations && (
              <PartLabel name="Upholstery" anchor={[1.55, 3.28, 0.12]} end={[1.75, 4.18, 0.15]} />
            )}
          </group>
          <group ref={comfort} name="seat-comfort">
            <AssetSlot url={seatPartAssets.comfort}>
              <RoundedBox
                args={[3.02, 2.41, 0.2]}
                radius={0.09}
                position={[0, 2.47, -0.18]}
                castShadow
              >
                <meshStandardMaterial color="#b9b29d" roughness={1} />
              </RoundedBox>
              <RoundedBox
                args={[3.02, 0.18, 1.61]}
                radius={0.075}
                position={[0, 0.8, 0.8]}
                castShadow
              >
                <meshStandardMaterial color="#b9b29d" roughness={1} />
              </RoundedBox>
            </AssetSlot>
            {annotations && (
              <PartLabel
                name="Comfort layer"
                anchor={[1.5, 2.95, -0.08]}
                end={[1.82, 3.67, -0.1]}
              />
            )}
          </group>
          <group ref={protective} name="seat-protective">
            <AssetSlot url={seatPartAssets.protective}>
              <group position={[0, 2.47, -0.31]} scale={[0.987, 0.972, 1]}>
                <ProtectivePanel state={state} integrated highlight={selected === "protective"} />
              </group>
            </AssetSlot>
            {annotations && (
              <PartLabel
                name="Protective layer"
                anchor={[1.5, 2.7, -0.3]}
                end={[2.05, 3.2, -0.3]}
              />
            )}
          </group>
          <group ref={shell} name="seat-structure">
            <AssetSlot url={seatPartAssets.structure}>
              <RoundedBox
                args={[3.17, 2.54, 0.12]}
                radius={0.12}
                position={[0, 2.45, -0.44]}
                castShadow
              >
                <meshStandardMaterial
                  color={selected === "structure" ? "#768690" : "#252e34"}
                  roughness={0.52}
                  metalness={0.12}
                />
              </RoundedBox>
              <RoundedBox
                args={[3.05, 0.09, 1.59]}
                radius={0.035}
                position={[0, 0.65, 0.76]}
                castShadow
              >
                <meshStandardMaterial
                  color={selected === "structure" ? "#768690" : "#252e34"}
                  roughness={0.55}
                />
              </RoundedBox>
              <SeatFrame selected={selected === "structure"} />
            </AssetSlot>
            {annotations && (
              <PartLabel name="Seat structure" anchor={[1.18, 0.6, 1.21]} end={[2.2, 1.2, 1.21]} />
            )}
          </group>
        </>
      )}
    </group>
  );
}
