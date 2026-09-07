"use client";
import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollImmediately } from "@/lib/scroll";
import { PHASES, phaseAt, STORY_SCROLL } from "./phases";
import { updateStoryState, type StoryState } from "./story-state";
gsap.registerPlugin(ScrollTrigger);
export function useBallisticTimeline({
  root,
  enabled,
  state,
  update,
  invalidate,
}: {
  root: RefObject<HTMLElement | null>;
  enabled: boolean;
  state: StoryState;
  update: (index: number, phase: string) => void;
  invalidate: RefObject<() => void>;
}) {
  useLayoutEffect(() => {
    if (!enabled || !root.current) return;
    const context = gsap.context(() => {
      const driver = { progress: 0 };
      const bar = root.current?.querySelector(".story-progress-fill");
      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "ballistic-story",
          trigger: root.current,
          start: "top top",
          end: `+=${STORY_SCROLL.distance}`,
          pin: root.current?.querySelector(".story-frame"),
          scrub: STORY_SCROLL.scrub,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          updateStoryState(state, driver.progress);
          const phase = phaseAt(driver.progress);
          update(phase.stage, phase.id);
          if (bar) gsap.set(bar, { scaleX: driver.progress });
          if (!document.hidden) invalidate.current();
        },
      });
      PHASES.forEach((phase) => timeline.addLabel(phase.id, phase.start));
      timeline.to(driver, { progress: 1, duration: 1, ease: "none" }, 0);
    }, root);
    let alive = true;
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    const savedScroll: unknown = history.state?.redlineStoryScroll;
    const saveScroll = () => {
      history.replaceState({ ...history.state, redlineStoryScroll: window.scrollY }, "");
    };
    window.addEventListener("pagehide", saveScroll);
    window.addEventListener("scrollend", saveScroll);
    document.fonts.ready.then(() => {
      if (!alive) return;
      ScrollTrigger.refresh();
      // The shorter server-rendered reading flow can clamp native restoration before pinning exists.
      if (
        navigation?.type === "reload" &&
        typeof savedScroll === "number" &&
        Number.isFinite(savedScroll)
      ) {
        scrollImmediately(savedScroll);
        ScrollTrigger.update();
      }
    });
    const visible = () => {
      if (!document.hidden) invalidate.current();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      alive = false;
      context.revert();
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("pagehide", saveScroll);
      window.removeEventListener("scrollend", saveScroll);
    };
  }, [enabled, root, state, update, invalidate]);
}
