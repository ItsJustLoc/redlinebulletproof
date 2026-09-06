import Image from "next/image";
import { storyContent } from "../data/story-content";
export function StoryFallback() {
  return (
    <div className="story-fallback">
      <div className="fallback-intro">
        <p className="eyebrow">A story in layers</p>
        <p>
          A conceptual journey.
          <br />
          From impact to integration.
        </p>
        <span>Illustrations, not verified test results.</span>
      </div>
      {storyContent.map((stage, i) => (
        <article className="fallback-chapter" key={stage.id} id={`chapter-${stage.id}`}>
          <div className="fallback-visual">
            <Image
              src={stage.image}
              alt={`Conceptual illustration: ${stage.short.toLowerCase()} stage of the material study.`}
              fill
              sizes="(max-width: 960px) 100vw, 55vw"
            />
            <span className="fallback-number">0{i + 1}</span>
          </div>
          <div className="fallback-copy">
            <p className="eyebrow">{stage.label}</p>
            <h2>{stage.title.replace("\n", " ")}</h2>
            <p>{stage.body}</p>
            {stage.id === "redline" && (
              <p>
                The impact illustration shows deformation spreading through the textile and the
                projectile coming to rest. This is a design concept, not verified ballistic
                performance.
              </p>
            )}
            <small>{stage.detail}</small>
            {stage.id === "seat" && (
              <ul>
                <li>Upholstery</li>
                <li>Protective layer</li>
                <li>Comfort layer</li>
                <li>Seat structure</li>
              </ul>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
