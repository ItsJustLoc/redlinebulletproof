export const PHASES = [
  { id: "TEST_READY", start: 0, end: 0.08, stage: 0 },
  { id: "FIRE", start: 0.08, end: 0.115, stage: 0 },
  { id: "PROJECTILE_TRACK", start: 0.115, end: 0.21, stage: 0 },
  { id: "GLASS", start: 0.21, end: 0.32, stage: 1 },
  { id: "STANDARD_FABRIC", start: 0.32, end: 0.43, stage: 2 },
  { id: "REDLINE_MATERIAL", start: 0.43, end: 0.53, stage: 3 },
  { id: "REDLINE_IMPACT", start: 0.53, end: 0.67, stage: 3 },
  { id: "SEAT_ASSEMBLY", start: 0.67, end: 0.8, stage: 4 },
  { id: "EXPLODED_VIEW", start: 0.8, end: 0.93, stage: 4 },
  { id: "PRODUCT_REVEAL", start: 0.93, end: 1, stage: 4 },
] as const;
export const STORY_SCROLL = { distance: 7800, scrub: 0.65 } as const;
export const EVENTS = {
  fire: 0.085,
  glassImpact: 0.262,
  fabricImpact: 0.37,
  redlineImpact: 0.55,
  assembly: 0.67,
  explosion: 0.8,
} as const;
export const STAGE_STOPS = [0, 0.23, 0.335, 0.465, 0.84] as const;
export const clamp = (value: number) => Math.min(1, Math.max(0, value));
export const range = (value: number, from: number, to: number) =>
  clamp((value - from) / (to - from));
export function phaseAt(progress: number) {
  return PHASES.find((phase) => progress < phase.end) ?? PHASES[PHASES.length - 1];
}
