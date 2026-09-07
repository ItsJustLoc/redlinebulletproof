import { expect, it } from "vitest";
import { PHASES, phaseAt } from "../src/features/ballistic-story/timeline/phases";
import {
  createStoryState,
  updateStoryState,
} from "../src/features/ballistic-story/timeline/story-state";
it("covers the complete story without gaps", () => {
  expect(PHASES[0].start).toBe(0);
  expect(PHASES.at(-1)?.end).toBe(1);
  PHASES.slice(1).forEach((phase, i) => expect(phase.start).toBe(PHASES[i].end));
});
it("stops the projectile before the material and holds it", () => {
  const state = createStoryState();
  updateStoryState(state, 0.63);
  const stopped = state.projectileZ;
  updateStoryState(state, 0.65);
  expect(state.projectileZ).toBe(stopped);
  expect(stopped).toBeGreaterThan(-3.34);
});
it("reverses without retaining fracture or assembly state", () => {
  const state = createStoryState();
  updateStoryState(state, 0.88);
  expect(state.exploded).toBe(1);
  updateStoryState(state, 0);
  expect(state).toEqual(createStoryState());
});
it("returns to the complete seat at the end", () => {
  const state = createStoryState();
  updateStoryState(state, 1);
  expect(state.assembly).toBe(1);
  expect(state.exploded).toBe(0);
  expect(phaseAt(1).id).toBe("PRODUCT_REVEAL");
});

it("meets each surface without discontinuous contact movement", () => {
  const state = createStoryState();
  for (const progress of [0.262, 0.37, 0.55, 0.625, 0.65, 0.67, 0.74]) {
    updateStoryState(state, progress - 0.000001);
    const before = state.projectileZ;
    updateStoryState(state, progress + 0.000001);
    expect(Math.abs(state.projectileZ - before)).toBeLessThan(0.001);
  }
  updateStoryState(state, 0.55);
  expect(state.projectileZ - 0.27).toBeCloseTo(-3 + 0.008, 5);
  updateStoryState(state, 0.625);
  expect(state.projectileZ - 0.27).toBeCloseTo(-3 + 0.008 - 0.34, 5);
});

it("decelerates after contact and has a bounded, reversible flash", () => {
  const state = createStoryState();
  const positions = [0.55, 0.575, 0.6, 0.625].map((p) => {
    updateStoryState(state, p);
    return state.projectileZ;
  });
  expect(positions[0] - positions[1]).toBeGreaterThan(positions[1] - positions[2]);
  expect(positions[1] - positions[2]).toBeGreaterThan(positions[2] - positions[3]);
  for (const p of [0, 0.08, 0.12, 0.5, 1]) {
    updateStoryState(state, p);
    expect(state.flash).toBe(0);
  }
  updateStoryState(state, 0.092);
  expect(state.flash).toBe(1);
  updateStoryState(state, 0.5);
  updateStoryState(state, 0.092);
  expect(state.flash).toBe(1);
});

it("maintains continuous camera positions and finite derivatives at shot boundaries", async () => {
  const { CAMERA_SHOTS } = await import("../src/features/ballistic-story/timeline/story-state");
  const state = createStoryState(),
    h = 0.00001;
  for (const shot of CAMERA_SHOTS.slice(1, -1)) {
    const samples = [shot[0] - h, shot[0], shot[0] + h].map((p) => {
      updateStoryState(state, p);
      return [
        state.cameraX,
        state.cameraY,
        state.cameraZ,
        state.targetX,
        state.targetY,
        state.targetZ,
        state.fov,
      ];
    });
    for (let axis = 0; axis < 7; axis++) {
      expect(Math.abs(samples[2][axis] - samples[0][axis])).toBeLessThan(0.01);
      expect(
        Math.abs(
          (samples[1][axis] - samples[0][axis]) / h - (samples[2][axis] - samples[1][axis]) / h,
        ),
      ).toBeLessThan(1);
    }
  }
});
