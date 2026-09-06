"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCinematicMode } from "../hooks/use-experience-mode";
import { useBallisticTimeline } from "../timeline/use-ballistic-timeline";
import { createStoryState } from "../timeline/story-state";
import { STAGE_STOPS } from "../timeline/phases";
import { StoryOverlay } from "../overlays/story-overlay";
import { StoryProgress } from "../overlays/story-progress";
import { StoryFallback } from "./story-fallback";
import { SceneErrorBoundary } from "./scene-error-boundary";
const Scene = dynamic(() => import("../scene/BallisticScene"), { ssr: false });
export function BallisticStory() {
  const root = useRef<HTMLElement>(null),
    invalidate = useRef(() => {});
  const [state] = useState(createStoryState);
  const [stage, setStage] = useState(0),
    [phase, setPhase] = useState("TEST_READY");
  const [near, setNear] = useState(false),
    [failed, setFailed] = useState(false),
    [ready, setReady] = useState(false);
  const cinematic = useCinematicMode() && !failed;
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  const update = useCallback((index: number, id: string) => {
    setStage(index);
    setPhase(id);
  }, []);
  useBallisticTimeline({ root, enabled: cinematic, state, update, invalidate });
  const onReady = useCallback((render: () => void) => {
    invalidate.current = render;
    setReady(true);
    render();
  }, []);
  const onFailure = useCallback(() => {
    setFailed(true);
  }, []);
  function select(index: number) {
    const trigger = ScrollTrigger.getById("ballistic-story");
    if (trigger)
      window.scrollTo({
        top: trigger.start + STAGE_STOPS[index] * (trigger.end - trigger.start) + 1,
        behavior: "instant",
      });
  }
  return (
    <section
      id="story"
      ref={root}
      className={cinematic ? "ballistic-story cinematic" : "ballistic-story"}
      aria-label="The Redline material story"
      data-stage={stage}
      data-phase={phase}
    >
      {/* Keep the pinned node mounted so ScrollTrigger can unwrap it before React removes it. */}
      <div className="story-frame" hidden={!cinematic}>
        <div className="scene-canvas" aria-hidden="true">
          {cinematic && near && (
            <SceneErrorBoundary onError={onFailure}>
              <Scene state={state} onReady={onReady} onFailure={onFailure} />
            </SceneErrorBoundary>
          )}
        </div>
        {!ready && (
          <div className="scene-loading">
            <span className="eyebrow">Preparing the material study</span>
            <button className="text-action" onClick={onFailure}>
              Read the illustrated story
            </button>
          </div>
        )}
        <StoryOverlay stage={stage} phase={phase} />
        <StoryProgress stage={stage} onSelect={select} />
      </div>
      <div className={cinematic ? "sr-only" : undefined}>
        <StoryFallback />
      </div>
    </section>
  );
}
