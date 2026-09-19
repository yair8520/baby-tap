import { useT } from "../../../i18n";
import { DEFAULT_SHELL_COMPLETE_PROPS } from "./ShellComplete.props.js";
import "./ShellComplete.css";

/** Celebration overlay shown when a stage is finished. */
export function ShellComplete({
  starCount = DEFAULT_SHELL_COMPLETE_PROPS.starCount,
  maxStars = DEFAULT_SHELL_COMPLETE_PROPS.maxStars,
  totalStars,
  onNextLevel,
  onReplay,
}) {
  const t = useT();
  const stop = (e) => e.stopPropagation();

  return (
    <div className="lgs-complete" onPointerDown={stop} onPointerUp={stop}>
      <div className="lgs-complete-card">
        <span className="lgs-complete-emoji">🎉</span>
        <div className="lgs-complete-title">{t("shell.wellDone")}</div>
        <div className="lgs-complete-stars">
          {Array.from({ length: maxStars }, (_, i) => (
            <span key={i} className={`lgs-cstar${i < starCount ? " on" : ""}`}>
              ⭐
            </span>
          ))}
        </div>
        {totalStars != null && (
          <div className="lgs-total-score">
            {t("shell.totalStars", { stars: totalStars })}
          </div>
        )}
        <div className="lgs-actions">
          {onReplay && (
            <button type="button" className="lgs-btn-replay" onClick={onReplay}>
              {t("shell.replay")}
            </button>
          )}
          {onNextLevel && (
            <button type="button" className="lgs-btn-next" onClick={onNextLevel}>
              {t("shell.nextLevel")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
