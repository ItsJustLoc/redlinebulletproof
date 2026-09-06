"use client";
import { useCallback, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { BusSeat } from "@/features/ballistic-story/scene/BusSeat";
import { TestEnvironment } from "@/features/ballistic-story/scene/TestEnvironment";
import {
  createStoryState,
  updateStoryState,
} from "@/features/ballistic-story/timeline/story-state";
function Seat({
  part,
  rotation,
  exploded,
  onFailure,
}: {
  part: string;
  rotation: number;
  exploded: boolean;
  onFailure: () => void;
}) {
  const state = useMemo(() => {
    const next = createStoryState();
    updateStoryState(next, 1);
    next.exploded = exploded ? 1 : 0;
    next.seatTurn = rotation;
    return next;
  }, [exploded, rotation]);
  const { invalidate, gl } = useThree();
  useEffect(() => {
    invalidate();
  }, [state, invalidate]);
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  return (
    <>
      <TestEnvironment state={state} />
      <BusSeat state={state} standalone selected={part} />
    </>
  );
}
export default function ProductViewer({
  part,
  rotation,
  exploded,
  onFailure,
}: {
  part: string;
  rotation: number;
  exploded: boolean;
  onFailure: () => void;
}) {
  const onCreated = useCallback(
    ({ camera }: { camera: import("three").Camera }) => camera.lookAt(0, 0.2, -2.5),
    [],
  );
  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [5, 2.7, 5.8], fov: 37 }}
      onCreated={onCreated}
    >
      <Seat part={part} rotation={rotation} exploded={exploded} onFailure={onFailure} />
    </Canvas>
  );
}
