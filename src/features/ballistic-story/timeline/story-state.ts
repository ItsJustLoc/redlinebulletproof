import { EVENTS, range } from "./phases";
export type StoryState = {
  progress: number;
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  fov: number;
  projectileZ: number;
  glassBreak: number;
  fabricBreak: number;
  impact: number;
  assembly: number;
  exploded: number;
  seatTurn: number;
  flash: number;
};
// Authored cinematic coordinates only, never physical test measurements.
export const CAMERA_SHOTS = [
  [0, -1.65, 2.05, 12.8, -1.6, 0.7, 2, 42],
  [0.075, -1.5, 1.8, 11.7, -1.3, 0.8, 4.8, 42],
  [0.105, -1.5, 1.8, 11.7, -1.3, 0.8, 4.8, 42],
  [0.14, 1.3, 1.7, 9.6, -1, 1, 6.7, 40],
  [0.2, 2.4, 1.65, 7.3, -0.9, 1, 4.1, 40],
  [0.255, 2.9, 1.6, 6.3, -0.95, 1, 3, 40],
  [0.31, 3.1, 1.75, 4.4, -0.9, 1, 1.9, 41],
  [0.365, 2.65, 1.55, 3.1, -0.8, 1, 0.1, 40],
  [0.425, 2.7, 1.7, 1, -0.7, 1, -1.25, 41],
  [0.48, 2.1, 1.65, -0.1, -0.7, 1, -3, 42],
  [0.55, 2.25, 1.6, -0.25, -0.72, 1, -3, 42],
  [0.625, 2.75, 1.65, -0.65, -0.7, 1, -3, 42],
  [0.65, 2.9, 1.72, -0.5, -0.75, 0.9, -3, 42],
  [0.7, 5.8, 3.1, 7.8, -1.55, 0.3, -2.7, 40],
  [0.79, 5.9, 2.7, 6.5, -1.45, 0.3, -2.7, 39],
  [0.85, 7.5, 3.4, 8, -1.6, 0.4, -2.2, 40],
  [0.905, 7.5, 3.4, 8, -1.6, 0.4, -2.2, 40],
  [1, 4.7, 2.4, 5.7, -1.25, 0.1, -2.7, 38],
] as const;
const projectileKeys = [
  [0, 8.8],
  [0.085, 8.8],
  [0.115, 7.7],
  [0.21, 4.4],
  [0.262, 3.27],
  [0.32, 1.55],
  [0.37, 0.27],
  [0.43, -1.22],
  [0.53, -2.45],
  [0.55, -2.722],
  [1, -2.722],
] as const;
// Shape-preserving cubic Hermite interpolation keeps shot direction changes smooth,
// while avoiding overshoot into the objects or past an authored hold.
export function samplePath(keys: readonly (readonly number[])[], p: number, column: number) {
  let index = keys.findIndex((key, i) => i < keys.length - 1 && p <= keys[i + 1][0]);
  if (index < 0) index = keys.length - 2;
  const a = keys[index],
    b = keys[index + 1],
    dt = b[0] - a[0],
    t = range(p, a[0], b[0]);
  const slope = (i: number) =>
    (keys[i + 1][column] - keys[i][column]) / (keys[i + 1][0] - keys[i][0]);
  const tangent = (i: number) => {
    if (i === 0) return slope(0);
    if (i === keys.length - 1) return slope(i - 1);
    const left = slope(i - 1),
      right = slope(i);
    return left * right <= 0 ? 0 : (2 * left * right) / (left + right);
  };
  return (
    (2 * t * t * t - 3 * t * t + 1) * a[column] +
    (t * t * t - 2 * t * t + t) * dt * tangent(index) +
    (-2 * t * t * t + 3 * t * t) * b[column] +
    (t * t * t - t * t) * dt * tangent(index + 1)
  );
}
const smooth = (t: number) => t * t * (3 - 2 * t);
export function updateStoryState(state: StoryState, progress: number) {
  state.progress = progress;
  [
    state.cameraX,
    state.cameraY,
    state.cameraZ,
    state.targetX,
    state.targetY,
    state.targetZ,
    state.fov,
  ] = [1, 2, 3, 4, 5, 6, 7].map((c) => samplePath(CAMERA_SHOTS, progress, c));
  state.projectileZ = samplePath(projectileKeys, progress, 1);
  state.glassBreak = smooth(range(progress, EVENTS.glassImpact, 0.31));
  state.fabricBreak = range(progress, EVENTS.fabricImpact, 0.415);
  state.impact = 1 - Math.pow(1 - range(progress, EVENTS.redlineImpact, 0.625), 3);
  if (progress >= EVENTS.redlineImpact) state.projectileZ = -2.722 - 0.34 * state.impact;
  state.assembly = smooth(range(progress, EVENTS.assembly, 0.79));
  state.exploded =
    smooth(range(progress, 0.805, 0.85)) * (1 - smooth(range(progress, 0.905, 0.975)));
  state.seatTurn = smooth(range(progress, 0.93, 1)) * -0.3;
  state.flash = smooth(range(progress, 0.085, 0.089)) * (1 - smooth(range(progress, 0.095, 0.112)));
}
export function createStoryState(): StoryState {
  const state = {
    progress: 0,
    cameraX: 0,
    cameraY: 0,
    cameraZ: 0,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    fov: 42,
    projectileZ: 8.8,
    glassBreak: 0,
    fabricBreak: 0,
    impact: 0,
    assembly: 0,
    exploded: 0,
    seatTurn: 0,
    flash: 0,
  };
  updateStoryState(state, 0);
  return state;
}
