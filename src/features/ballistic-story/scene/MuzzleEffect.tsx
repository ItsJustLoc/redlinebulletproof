import { Billboard } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { StoryState } from "../timeline/story-state";
export function MuzzleEffect({ state }: { state: StoryState }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null),
    light = useRef<THREE.PointLight>(null);
  const uniforms = useMemo(() => ({ strength: { value: 0 } }), []);
  useFrame(() => {
    if (group.current) group.current.visible = state.flash > 0;
    if (material.current) material.current.uniforms.strength.value = state.flash;
    if (light.current) light.current.intensity = state.flash * 5;
  });
  return (
    <group ref={group} position={[0, 0.01, -0.72]} visible={false}>
      <Billboard>
        <mesh>
          <planeGeometry args={[0.8, 0.8]} />
          <shaderMaterial
            ref={material}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            vertexShader={
              "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }"
            }
            fragmentShader={
              "varying vec2 vUv;uniform float strength;void main(){vec2 p=(vUv-.5)*2.;float a=atan(p.y,p.x);float r=length(p);float irregular=1.+.16*sin(a*5.)+.08*cos(a*9.);float halo=pow(max(0.,1.-r*irregular),5.);float core=exp(-r*r*100.);float rays=pow(max(0.,cos(a*3.+.3)),12.)*exp(-r*9.);vec3 color=mix(vec3(2.5,1.05,.32),vec3(5.,4.4,3.5),core);gl_FragColor=vec4(color,(halo*.38+core*.85+rays*.14)*strength); }"
            }
          />
        </mesh>
      </Billboard>
      <pointLight ref={light} color="#ffd5a0" distance={3} decay={2} />
    </group>
  );
}
