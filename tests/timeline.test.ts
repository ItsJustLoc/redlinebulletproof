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
