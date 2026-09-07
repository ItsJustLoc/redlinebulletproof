"use client";
import dynamic from "next/dynamic";
import { prepareSurfaceMaps } from "@/features/ballistic-story/scene/materials/prepare-surface-maps";
import Image from "next/image";
import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Box, Plus, RotateCcw, RotateCw, X } from "lucide-react";
import { productParts, productValues } from "../data/product";
import { company } from "@/data/company";
import { useProductInspectionMode } from "@/features/ballistic-story/hooks/use-experience-mode";
import { SceneErrorBoundary } from "@/features/ballistic-story/components/scene-error-boundary";
const Viewer = dynamic(
  async () => {
    const [scene] = await Promise.all([import("./product-viewer"), prepareSurfaceMaps()]);
    return scene;
  },
  { ssr: false },
);
export function ProductSection() {
  const [part, setPart] = useState(0),
    [inspect, setInspect] = useState(false),
    [immediate, setImmediate] = useState(false),
    [rotation, setRotation] = useState(0),
    [exploded, setExploded] = useState(false),
    [failed, setFailed] = useState(false);
  const allow3d = useProductInspectionMode() && !failed;
  const reduce = useReducedMotion();
  const failure = useCallback(() => {
    setFailed(true);
    setInspect(false);
  }, []);
  return (
    <section id="product" className="product-section section-pad" aria-labelledby="product-heading">
      <div className="product-intro">
        <p className="eyebrow">
          <span className="signal-dot" /> From material to application
        </p>
        <div>
          <h2 id="product-heading" className="section-heading">
            PROTECTION,
            <br />
            <span>BUILT INTO THE PRODUCT.</span>
          </h2>
          <p>
            Redline Bulletproof is developing protective textile solutions for transportation
            seating, beginning with school-bus seats.
          </p>
        </div>
        <ArrowDownRight
          className="product-intro-arrow"
          size={42}
          strokeWidth={1}
          aria-hidden="true"
        />
      </div>
      <div className="product-values">
        {productValues.map((value) => (
          <article key={value.number}>
            <span>{value.number}</span>
            <div>
              <h3>{value.title}</h3>
              <p>{value.body}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="product-study">
        <div className="product-visual">
          <div className="product-image" aria-hidden={inspect && allow3d}>
            <Image
              src="/images/product/story-seat.webp"
              alt="Conceptual detached school-bus bench seat with high upholstered back and a steel support frame, on an empty studio floor."
              fill
              sizes="(max-width: 960px) 100vw, 65vw"
            />
          </div>
          {inspect && allow3d && (
            <div className="product-canvas" aria-hidden="true">
              <SceneErrorBoundary onError={failure}>
                <Viewer
                  part={productParts[part].id}
                  rotation={rotation}
                  exploded={exploded}
                  immediate={immediate}
                  onFailure={failure}
                />
              </SceneErrorBoundary>
            </div>
          )}
          <span className="product-visual-label">
            Seat integration study <span>Concept model</span>
          </span>
          {!(inspect && allow3d) && (
            <div className="material-hotspots">
              {productParts.map((item, i) => (
                <button
                  key={item.id}
                  className={`hotspot hotspot-${i}`}
                  aria-label={`Inspect ${item.title.toLowerCase()}`}
                  aria-pressed={part === i}
                  onClick={() => setPart(i)}
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
          {inspect && allow3d && (
            <span className="viewer-selection" aria-live="polite">
              {productParts[part].title} selected
            </span>
          )}
          <div className="viewer-controls">
            {allow3d && !inspect && (
              <button className="button button-secondary" onClick={() => setInspect(true)}>
                <Box size={16} aria-hidden="true" /> Inspect in 3D
              </button>
            )}
            {inspect && allow3d && (
              <>
                <button
                  className="icon-button"
                  aria-label="Rotate seat left"
                  onClick={(event) => {
                    setImmediate(event.detail === 0);
                    setRotation((value) => value - 0.3);
                  }}
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Rotate seat right"
                  onClick={(event) => {
                    setImmediate(event.detail === 0);
                    setRotation((value) => value + 0.3);
                  }}
                >
                  <RotateCw size={18} />
                </button>
                <button
                  className="button button-secondary"
                  onClick={(event) => {
                    setImmediate(event.detail === 0);
                    setExploded((value) => !value);
                  }}
                  aria-pressed={exploded}
                >
                  {exploded ? "Assemble seat" : "Explode seat"}
                </button>
                <button
                  className="icon-button"
                  aria-label="Close 3D inspection"
                  onClick={() => setInspect(false)}
                >
                  <X size={18} />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="product-details">
          <p className="eyebrow">The seating application</p>
          <h3>
            A familiar form.
            <br />A new consideration.
          </h3>
          <p>Protective material, considered from the inside out.</p>
          <div className="part-controls" aria-label="Seat material details">
            {productParts.map((item, i) => (
              <button
                key={item.id}
                aria-pressed={part === i}
                onClick={(event) => {
                  setImmediate(event.detail === 0);
                  setPart(i);
                  if (inspect && item.id === "protective") setExploded(true);
                }}
              >
                <span>0{i + 1}</span>
                {item.title}
                <Plus size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={part}
              className="part-description"
              initial={{ opacity: reduce ? 1 : 0.5 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: reduce ? 1 : 0.5 }}
              transition={{ duration: reduce ? 0 : 0.12 }}
            >
              {productParts[part].body}
            </motion.p>
          </AnimatePresence>
          <p className="technical-status">{company.technicalStatus}</p>
          <a className="text-action" href="#contact">
            Start a conversation <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
      <details className="technical-disclosure">
        <summary>
          About this visualization <Plus size={15} aria-hidden="true" />
        </summary>
        <p>
          All material behavior, glass fracture, upholstery response, projectile stopping, and seat
          construction shown here are conceptual illustrations. They do not establish performance,
          certification, material composition, or a verified layer count. No ballistic performance
          specification shown on the prototype should be treated as verified unless supplied by
          Redline Bulletproof and supported by appropriate test documentation.
        </p>
      </details>
    </section>
  );
}
