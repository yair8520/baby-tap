import { useT } from "../../../i18n";
import { DEFAULT_LEVEL_DOTS_PROPS } from "./LevelDots.props.js";
import "./LevelDots.css";

/**
 * Stage strip. Dots past `maxUnlocked` render locked and are not selectable,
 * so a toddler cannot skip ahead by tapping.
 */
export function LevelDots({
  total = DEFAULT_LEVEL_DOTS_PROPS.total,
  currentIndex = DEFAULT_LEVEL_DOTS_PROPS.currentIndex,
  maxUnlocked,
  onSelect,
}) {
  const t = useT();
  if (total <= 1) return null;

  const unlockedThrough = maxUnlocked ?? currentIndex;
  const selectable = typeof onSelect === "function";

  return (
    <div className="lgs-dots">
      {Array.from({ length: total }, (_, i) => {
        const locked = i > unlockedThrough;
        const className = [
          "lgs-dot",
          i === currentIndex ? "lgs-dot--active" : "",
          locked ? "lgs-dot--locked" : "lgs-dot--done",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={i}
            type="button"
            className={className}
            disabled={locked || !selectable}
            aria-current={i === currentIndex}
            aria-label={t("shell.levelAria", { level: i + 1 })}
            onClick={selectable && !locked ? () => onSelect(i) : undefined}
          />
        );
      })}
    </div>
  );
}
