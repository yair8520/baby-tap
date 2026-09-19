import { useT } from "../../../i18n";
import { DEFAULT_SHELL_HEADER_PROPS } from "./ShellHeader.props.js";
import "./ShellHeader.css";

/** Exit button, stage badge and the running star row. */
export function ShellHeader({
  levelNum = DEFAULT_SHELL_HEADER_PROPS.levelNum,
  starCount = DEFAULT_SHELL_HEADER_PROPS.starCount,
  maxStars = DEFAULT_SHELL_HEADER_PROPS.maxStars,
  onExit,
}) {
  const t = useT();

  return (
    <div className="lgs-header">
      <button
        type="button"
        className="lgs-btn-exit"
        onClick={onExit}
        aria-label={t("common.exit")}
      >
        ✕
      </button>
      <span className="lgs-level-label">{t("shell.level", { level: levelNum })}</span>
      <span className="lgs-hdr-stars" aria-label={t("shell.stars", { count: starCount })}>
        {Array.from({ length: maxStars }, (_, i) => (
          <span
            key={i}
            className={`lgs-hdr-star${i < starCount ? " lgs-hdr-star--on" : ""}`}
          >
            ⭐
          </span>
        ))}
      </span>
    </div>
  );
}
