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
};
// Artistic shot coordinates, not physical test measurements.
const shots = [
  [0, 2.0, 2.0, 12.8, -0.8, 0.7, 2, 42],
  [0.075, 1.7, 1.65, 11.5, -0.6, 1, 6, 40],
  [0.115, 2.4, 1.4, 8.8, -0.45, 1, 7.2, 37],
  [0.2, 3.8, 1.65, 5.8, -0.9, 1, 3.5, 40],
  [0.255, 3.1, 1.5, 6, -0.7, 1, 3, 38],
  [0.31, 3.8, 1.8, 3.7, -0.8, 1, 1.7, 42],
  [0.365, 2.8, 1.5, 2.8, -0.7, 1, 0, 39],
  [0.425, 3, 1.8, 0.5, -0.5, 1, -1, 42],
  [0.48, 2.1, 1.5, -0.5, -0.45, 1, -3, 43],
  [0.545, 2.3, 1.7, -0.15, -0.6, 1, -3, 42],
  [0.61, 3.0, 1.6, -1.3, -0.7, 1, -3, 42],
  [0.67, 5.0, 3.0, 6.4, -1.4, 0.3, -3, 40],
  [0.79, 5.0, 2.7, 4.7, -1.2, 0.25, -3, 37],
  [0.88, 5.8, 2.5, 5.8, -1.2, 0.3, -2.5, 40],
  [1, 4.3, 2.2, 4.4, -1, 0.1, -2.7, 38],
] as const;
const projectileKeys = [
  [0, 9],
  [0.085, 9],
  [0.115, 7.7],
  [0.21, 4.2],
  [0.262, 3],
  [0.32, 1.5],
  [0.37, 0],
  [0.43, -1.35],
  [0.53, -2.25],
  [0.56, -2.68],
  [1, -2.68],
] as const;
function sample(keys: readonly (readonly number[])[], p: number, column: number) {
  const index = Math.max(
    0,
    keys.findIndex((key, i) => i < keys.length - 1 && p <= keys[i + 1][0]),
  );
  const a = keys[index],
    b = keys[Math.min(index + 1, keys.length - 1)];
  const t = range(p, a[0], b[0]);
  return a[column] + (b[column] - a[column]) * t;
}
export function updateStoryState(state: StoryState, progress: number) {
  state.progress = progress;
  state.cameraX = sample(shots, progress, 1);
  state.cameraY = sample(shots, progress, 2);
  state.cameraZ = sample(shots, progress, 3);
  state.targetX = sample(shots, progress, 4);
  state.targetY = sample(shots, progress, 5);
  state.targetZ = sample(shots, progress, 6);
  state.fov = sample(shots, progress, 7);
  state.projectileZ = sample(projectileKeys, progress, 1);
  state.glassBreak = range(progress, EVENTS.glassImpact, 0.31);
  state.fabricBreak = range(progress, EVENTS.fabricImpact, 0.415);
  state.impact = range(progress, EVENTS.redlineImpact, 0.625);
  if (progress >= EVENTS.redlineImpact) state.projectileZ = -2.795 - 0.34 * state.impact;
  state.assembly = range(progress, EVENTS.assembly, 0.79);
  state.exploded = range(progress, 0.805, 0.85) * (1 - range(progress, 0.905, 0.975));
  state.seatTurn = range(progress, 0.93, 1) * -0.3;
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
    projectileZ: 9,
    glassBreak: 0,
    fabricBreak: 0,
    impact: 0,
    assembly: 0,
    exploded: 0,
    seatTurn: 0,
  };
  updateStoryState(state, 0);
  return state;
}
