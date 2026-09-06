"use client";
import { Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import type { StoryState } from "../timeline/story-state";
import { TestEnvironment } from "./TestEnvironment";
import { FirearmRig } from "./FirearmRig";
import { Projectile } from "./Projectile";
import { GlassLayer } from "./GlassLayer";
import { StandardFabricLayer } from "./StandardFabricLayer";
import { ProtectiveFabricLayer } from "./ProtectiveFabricLayer";
import { ExplodedSeat } from "./ExplodedSeat";
export type SceneProps = {
  state: StoryState;
  onReady: (invalidate: () => void) => void;
  onFailure: () => void;
};
function SceneController({ state, onReady, onFailure }: SceneProps) {
  const { invalidate, gl } = useThree();
  useEffect(() => {
    onReady(invalidate);
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [invalidate, onReady, onFailure, gl]);
  useFrame(({ camera }) => {
    camera.position.set(state.cameraX, state.cameraY, state.cameraZ);
    camera.lookAt(state.targetX, state.targetY, state.targetZ);
    if (camera instanceof PerspectiveCamera && camera.fov !== state.fov) {
      camera.fov = state.fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}
export default function BallisticScene(props: SceneProps) {
  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [2, 2, 12.8], fov: 42, near: 0.05, far: 80 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      fallback={<span>3D unavailable. Read the illustrated story below.</span>}
    >
      <SceneController {...props} />
      <Suspense fallback={null}>
        <TestEnvironment state={props.state} />
        <FirearmRig state={props.state} />
        <Projectile state={props.state} />
        <GlassLayer state={props.state} />
        <StandardFabricLayer state={props.state} />
        <ProtectiveFabricLayer state={props.state} />
        <ExplodedSeat state={props.state} />
      </Suspense>
    </Canvas>
  );
}
