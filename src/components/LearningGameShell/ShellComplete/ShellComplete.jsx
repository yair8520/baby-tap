import { useEffect, useRef } from "react";
import { useT } from "../../../i18n";
import { DEFAULT_SHELL_COMPLETE_PROPS } from "./ShellComplete.props.js";
import "./ShellComplete.css";

/** Celebration overlay shown when a stage is finished. */
export function ShellComplete({
  starCount = DEFAULT_SHELL_COMPLETE_PROPS.starCount,
  maxStars = DEFAULT_SHELL_COMPLETE_PROPS.maxStars,
  isLastLevel = DEFAULT_SHELL_COMPLETE_PROPS.isLastLevel,
  onNextLevel,
  onReplay,
}) {
  const t = useT();
  const stop = (e) => e.stopPropagation();
  const advance = isLastLevel ? onReplay : onNextLevel;
  const advanceRef = useRef(advance);

  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  useEffect(() => {
    const timer = window.setTimeout(() => advanceRef.current?.(), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="lgs-complete"
      role="dialog"
      aria-modal="true"
      aria-labelledby="learning-complete-title"
      aria-live="polite"
      onPointerDown={stop}
      onPointerUp={stop}
    >
      <div className="lgs-complete-card">
        <span className="lgs-complete-emoji" aria-hidden="true">
          🎉
        </span>
        <div id="learning-complete-title" className="lgs-complete-title">
          {t("learning.greatJob")}
        </div>
        <div className="lgs-complete-stars" aria-hidden="true">
          {Array.from({ length: maxStars }, (_, i) => (
            <span key={i} className={`lgs-cstar${i < starCount ? " on" : ""}`}>
              ⭐
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
