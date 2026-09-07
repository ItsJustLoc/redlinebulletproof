"use client";
import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import type { StoryState } from "../timeline/story-state";
import { TestEnvironment } from "./TestEnvironment";
import { FirearmRig } from "./FirearmRig";
import { Projectile } from "./Projectile";
import { GlassLayer } from "./GlassLayer";
import { StandardFabricLayer } from "./StandardFabricLayer";
import { ProtectiveFabricLayer } from "./ProtectiveFabricLayer";
import { SceneEffects } from "./SceneEffects";
import { ExplodedSeat } from "./ExplodedSeat";
export type SceneProps = {
  state: StoryState;
  phase?: string;
  effects?: boolean;
  onReady: (invalidate: () => void) => void;
  onFailure: () => void;
};
function SceneController({ state, onReady, onFailure, effects }: SceneProps) {
  const { invalidate, gl } = useThree();
  const ready = useRef(false);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [invalidate, onReady, onFailure, gl]);
  useFrame(({ camera, gl }) => {
    if (!ready.current) {
      ready.current = true;
      requestAnimationFrame(() => onReady(() => invalidate(2)));
    }
    gl.domElement.dataset.renderFrame = String(gl.info.render.frame);
    gl.domElement.dataset.drawCalls = String(gl.info.render.calls);
    gl.domElement.dataset.triangles = String(gl.info.render.triangles);
    gl.domElement.dataset.effects = effects === false ? "off" : "on";
    gl.domElement.dataset.progress = state.progress.toFixed(5);
    gl.domElement.dataset.projectileZ = state.projectileZ.toFixed(5);
    gl.domElement.dataset.impact = state.impact.toFixed(5);
    gl.domElement.dataset.flash = state.flash.toFixed(5);
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
      shadows="percentage"
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [2, 2, 12.8], fov: 42, near: 0.05, far: 80 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      fallback={<span>3D unavailable. Read the illustrated story below.</span>}
    >
      <Suspense fallback={null}>
        <SceneController {...props} />
        <TestEnvironment state={props.state} />
        <FirearmRig state={props.state} />
        <Projectile state={props.state} />
        <GlassLayer state={props.state} />
        <StandardFabricLayer state={props.state} />
        <ProtectiveFabricLayer state={props.state} />
        <ExplodedSeat state={props.state} annotations={props.phase === "EXPLODED_VIEW"} />
        {props.effects !== false && (props.phase === "TEST_READY" || props.phase === "FIRE") && (
          <SceneEffects />
        )}
      </Suspense>
    </Canvas>
  );
}
