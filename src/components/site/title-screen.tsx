"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { ArrowDown, ArrowDownRight } from "lucide-react";
import gsap from "gsap";
export function TitleScreen() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from(".hero-image", { opacity: 0.6, scale: 1.04, duration: 1.5 })
          .from(".hero-reveal", { y: 18, opacity: 0.3, stagger: 0.07, duration: 0.85 }, 0.1)
          .from(".hero-signal", { scaleX: 0.05, transformOrigin: "left", duration: 1.1 }, 0.2);
      }, root);
      return () => context.revert();
    });
    return () => media.revert();
  }, []);
  return (
    <section id="top" className="title-screen" ref={root} aria-labelledby="hero-heading">
      <div className="hero-image">
        <Image
          src="/images/brand/material-study.webp"
          alt="Conceptual close-up of layered dark woven textile with a fine red edge."
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="hero-shade" />
      <div className="hero-body">
        <p className="eyebrow hero-reveal">
          <span className="signal-dot" /> Advanced protection. Woven in.
        </p>
        <h1 id="hero-heading" className="hero-reveal">
          REDLINE<span>BULLETPROOF</span>
        </h1>
        <div className="hero-signal" />
        <div className="hero-lower hero-reveal">
          <h2>
            ENGINEERED BETWEEN
            <br />
            IMPACT AND WHAT MATTERS.
          </h2>
          <p>
            Protective fabric systems.
            <br />A new layer of thinking for school-bus seating.
          </p>
        </div>
        <a className="button button-primary hero-reveal" href="#story">
          Enter the test <ArrowDownRight size={20} aria-hidden="true" />
        </a>
      </div>
      <div className="material-caption">
        <span className="caption-line" />
        <span>
          Material study / 001<small>Illustrative textile construction</small>
        </span>
      </div>
      <div className="hero-footer">
        <span>
          Purpose-built thinking.
          <br />
          <strong>School-bus seating.</strong>
        </span>
        <a href="#story">
          Scroll to explore <ArrowDown size={16} aria-hidden="true" />
        </a>
        <span className="hero-index">
          01 — 05
          <br />
          <strong>A story in layers</strong>
        </span>
      </div>
    </section>
  );
}
