"use client";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { BusSeat } from "@/features/ballistic-story/scene/BusSeat";
import { TestEnvironment } from "@/features/ballistic-story/scene/TestEnvironment";
import {
  createStoryState,
  updateStoryState,
} from "@/features/ballistic-story/timeline/story-state";
type ViewerProps = {
  part: string;
  rotation: number;
  exploded: boolean;
  immediate?: boolean;
  onFailure: () => void;
};
function Seat({ part, rotation, exploded, immediate, onFailure }: ViewerProps) {
  const [state] = useState(() => {
    const s = createStoryState();
    updateStoryState(s, 1);
    s.seatTurn = rotation;
    s.exploded = exploded ? 1 : 0;
    return s;
  });
  const { invalidate, gl, camera } = useThree();
  useLayoutEffect(() => {
    const tween = gsap.to(state, {
      seatTurn: rotation,
      exploded: exploded ? 1 : 0,
      duration: immediate ? 0 : 0.25,
      ease: "power2.out",
      overwrite: true,
      onUpdate: invalidate,
    });
    const move = gsap.to(camera.position, {
      x: exploded ? 6.8 : 5,
      y: exploded ? 3.1 : 2.7,
      z: exploded ? 8 : 5.8,
      duration: immediate ? 0 : 0.25,
      ease: "power2.out",
      onUpdate: () => {
        camera.lookAt(0, 0.2, -2.5);
        invalidate();
      },
    });
    invalidate();
    return () => {
      tween.kill();
      move.kill();
    };
  }, [state, rotation, exploded, immediate, invalidate, camera]);
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  useFrame(({ gl: renderer }) => {
    renderer.domElement.dataset.selectedPart = part;
    renderer.domElement.dataset.rotation = state.seatTurn.toFixed(4);
    renderer.domElement.dataset.exploded = state.exploded.toFixed(4);
    renderer.domElement.dataset.renderFrame = String(renderer.info.render.frame);
  });
  return (
    <>
      <TestEnvironment state={state} />
      <BusSeat state={state} standalone selected={part} />
    </>
  );
}
export default function ProductViewer(props: ViewerProps) {
  const onCreated = useCallback(
    ({ camera }: { camera: import("three").Camera }) => camera.lookAt(0, 0.2, -2.5),
    [],
  );
  return (
    <Canvas
      shadows="percentage"
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [5, 2.7, 5.8], fov: 37 }}
      onCreated={onCreated}
    >
      <Seat {...props} />
    </Canvas>
  );
}
