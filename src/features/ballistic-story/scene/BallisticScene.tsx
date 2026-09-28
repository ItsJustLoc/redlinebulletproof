"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping, NoToneMapping, PerspectiveCamera, type Object3D } from "three";
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
  onReady: (invalidate: () => void) => (() => void) | void;
  onFailure: () => void;
};
function SceneController({
  state,
  onReady,
  onFailure,
  effects,
  onPrepared,
}: SceneProps & { onPrepared: () => void }) {
  const { invalidate, gl, scene, camera, size } = useThree();
  const ready = useRef(false);
  useEffect(() => {
    let alive = true;
    let frame = 0;
    // Let the environment and composer attach before preparing both authored render paths.
    frame = requestAnimationFrame(async () => {
      const toneMapping = gl.toneMapping;
      const visibility: [Object3D, boolean, boolean][] = [];
      const hiddenLights: Object3D[] = [];
      scene.traverse((object) => {
        visibility.push([object, object.visible, object.frustumCulled]);
        if ("isLight" in object) {
          for (let parent: Object3D | null = object; parent; parent = parent.parent) {
            if (!parent.visible) {
              hiddenLights.push(object);
              break;
            }
          }
        }
      });
      // Warm off-camera surfaces with the actual lighting variants, including the flash.
      visibility.forEach(([object]) => {
        object.visible = true;
        object.frustumCulled = false;
      });
      hiddenLights.forEach((light) => {
        light.visible = false;
      });
      try {
        performance.mark("story-shaders-start");
        for (const [mode, flash] of [
          [ACESFilmicToneMapping, false],
          [NoToneMapping, false],
          [NoToneMapping, true],
        ] as const) {
          gl.toneMapping = mode;
          hiddenLights.forEach((light) => {
            light.visible = flash;
          });
          await gl.compileAsync(scene, camera);
          if (!alive) return;
          gl.render(scene, camera);
        }
        performance.mark("story-shaders-ready");
        gl.info.autoReset = false;
        onPrepared();
      } catch {
        if (alive) onFailure();
      } finally {
        gl.toneMapping = toneMapping;
        visibility.forEach(([object, visible, culled]) => {
          object.visible = visible;
          object.frustumCulled = culled;
        });
      }
    });
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [gl, scene, camera, onPrepared, onFailure]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [invalidate, onReady, onFailure, gl]);
  useEffect(() => {
    let frame = 0;
    let sync: WebGLSync | null = null;
    let release: (() => void) | void;
    const context = gl.getContext() as WebGL2RenderingContext;
    const check = () => {
      if (!ready.current) {
        frame = requestAnimationFrame(check);
        return;
      }
      // This callback runs after the first complete frame, including bloom and GPU uploads.
      if (!sync) {
        sync = context.fenceSync(context.SYNC_GPU_COMMANDS_COMPLETE, 0);
        context.flush();
      }
      if (sync && context.clientWaitSync(sync, 0, 0) === context.TIMEOUT_EXPIRED) {
        frame = requestAnimationFrame(check);
        return;
      }
      if (sync) context.deleteSync(sync);
      sync = null;
      performance.mark("story-frame-ready");
      release = onReady(() => invalidate(2));
    };
    frame = requestAnimationFrame(check);
    return () => {
      cancelAnimationFrame(frame);
      if (sync) context.deleteSync(sync);
      release?.();
    };
  }, [gl, invalidate, onReady]);
  useFrame(({ camera, gl }) => {
    if (!ready.current) {
      ready.current = true;
    }
    gl.domElement.dataset.renderFrame = String(gl.info.render.frame);
    gl.domElement.dataset.drawCalls = String(gl.info.render.calls);
    gl.domElement.dataset.triangles = String(gl.info.render.triangles);
    gl.domElement.dataset.textures = String(gl.info.memory.textures);
    gl.domElement.dataset.geometries = String(gl.info.memory.geometries);
    gl.domElement.dataset.programs = String(gl.info.programs?.length);
    gl.domElement.dataset.dpr = String(gl.getPixelRatio());
    gl.domElement.dataset.effects = effects === false ? "off" : "on";
    gl.domElement.dataset.progress = state.progress.toFixed(5);
    gl.domElement.dataset.projectileZ = state.projectileZ.toFixed(5);
    gl.domElement.dataset.impact = state.impact.toFixed(5);
    gl.domElement.dataset.flash = state.flash.toFixed(5);
    camera.position.set(state.cameraX, state.cameraY, state.cameraZ);
    // The narrow mobile media area centers the subject; desktop keeps every authored coordinate.
    const portrait = size.width < 960 && size.width / size.height < 1.35;
    const zoom = portrait ? size.width / size.height / 1.35 : 1;
    camera.lookAt(portrait ? 0 : state.targetX, state.targetY, state.targetZ);
    if (camera instanceof PerspectiveCamera && (camera.fov !== state.fov || camera.zoom !== zoom)) {
      camera.fov = state.fov;
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
    gl.info.reset();
  });
  return null;
}
export default function BallisticScene(props: SceneProps) {
  const [prepared, setPrepared] = useState(false);
  const onPrepared = useCallback(() => setPrepared(true), []);
  return (
    <Canvas
      shadows="percentage"
      frameloop={prepared ? "demand" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [2, 2, 12.8], fov: 42, near: 0.05, far: 80 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      fallback={<span>3D unavailable. Read the illustrated story below.</span>}
    >
      <Suspense fallback={null}>
        <SceneController {...props} onPrepared={onPrepared} />
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
