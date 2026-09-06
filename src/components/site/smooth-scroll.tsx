"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
export function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 60rem) and (prefers-reduced-motion: no-preference) and (pointer: fine)",
      () => {
        const lenis = new Lenis({
          duration: 1,
          smoothWheel: true,
          syncTouch: false,
          anchors: false,
        });
        // Resolve anchors after layout settles; keyboard navigation never waits for a tween.
        let anchorFrame = 0;
        const anchor = (event: MouseEvent) => {
          if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          const link =
            event.target instanceof Element
              ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
              : null;
          if (!link) return;
          const href = link.getAttribute("href");
          const target = href ? document.getElementById(href.slice(1)) : null;
          if (!target || !href) return;
          event.preventDefault();
          cancelAnimationFrame(anchorFrame);
          anchorFrame = requestAnimationFrame(() => {
            ScrollTrigger.refresh();
            lenis.resize();
            if (window.location.hash !== href) history.pushState(null, "", href);
            lenis.scrollTo(target, {
              immediate: event.detail === 0,
              offset: href === "#story" ? 0 : -24,
            });
            if (event.detail === 0) {
              target.setAttribute("tabindex", "-1");
              target.focus({ preventScroll: true });
            }
          });
        };
        document.addEventListener("click", anchor);
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        return () => {
          cancelAnimationFrame(anchorFrame);
          document.removeEventListener("click", anchor);
          gsap.ticker.remove(tick);
          lenis.destroy();
          gsap.ticker.lagSmoothing(500, 33);
        };
      },
    );
    return () => media.revert();
  }, []);
  return null;
}
