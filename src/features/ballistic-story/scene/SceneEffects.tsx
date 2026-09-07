import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
// Only the intentional HDR flash clears this threshold. No emissive textile treatment.
export function SceneEffects() {
  return (
    <EffectComposer multisampling={2} enableNormalPass={false} resolutionScale={0.75}>
      <Bloom
        luminanceThreshold={1.6}
        luminanceSmoothing={0.2}
        intensity={0.2}
        mipmapBlur
        radius={0.35}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
