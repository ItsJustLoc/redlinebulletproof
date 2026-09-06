import { ArrowDown, ArrowUpRight } from "lucide-react";
import { storyContent } from "../data/story-content";
export function StoryOverlay({ stage, phase }: { stage: number; phase: string }) {
  const content = storyContent[stage];
  const impact = phase === "REDLINE_IMPACT";
  return (
    <div className="story-overlay">
      <div className="stage-copy" key={content.id}>
        <p className="eyebrow">
          <span className="signal-dot" />
          {content.label}
        </p>
        <h2>
          {impact ? (
            <>
              THE MOMENT
              <br />
              THAT MATTERS.
            </>
          ) : (
            content.title.split("\n").map((line, i) => <span key={i}>{line}</span>)
          )}
        </h2>
        <p className="stage-body">
          {impact
            ? "The fabric deforms. The movement disperses. The scene becomes still. A conceptual expression of the protective intent."
            : content.body}
        </p>
        <p className="stage-detail">{content.detail}</p>
        {stage === 4 && (
          <a className="text-action" href="#product">
            Explore the application <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        )}
      </div>
      {phase === "EXPLODED_VIEW" && (
        <div className="exploded-labels">
          <span>Upholstery</span>
          <span>Comfort layer</span>
          <span>Protective layer</span>
          <span>Seat structure</span>
        </div>
      )}
      <div className="scene-topline">
        <span>Redline / Material study</span>
        <a href="#product">
          Skip to product <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </div>
      <div className="scene-footnote">
        <span>
          Conceptual visualization
          <br />
          <small>Performance claims require verified test data.</small>
        </span>
        <span className="scroll-cue">
          Scroll to continue <ArrowDown size={13} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
