import { storyContent } from "../data/story-content";
export function StoryProgress({
  stage,
  onSelect,
}: {
  stage: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav className="story-progress" aria-label="Story chapters">
      <div className="story-progress-track">
        <span className="story-progress-fill" />
      </div>
      <ol>
        {storyContent.map((item, i) => (
          <li key={item.id}>
            <button onClick={() => onSelect(i)} aria-current={stage === i ? "step" : undefined}>
              <span className="stage-number">0{i + 1}</span>
              {item.short}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
