import type { StoryState } from "../timeline/story-state";
import { BusSeat } from "./BusSeat";
// Part separation is owned by BusSeat; the timeline owns the amount of separation.
export function ExplodedSeat({
  state,
  annotations = false,
}: {
  state: StoryState;
  annotations?: boolean;
}) {
  return <BusSeat state={state} annotations={annotations} />;
}
