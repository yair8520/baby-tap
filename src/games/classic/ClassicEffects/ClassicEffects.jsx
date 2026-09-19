import { getClassicLevelConfig } from "../levels.js";
import "./ClassicEffects.css";

/** Visual layer for classic mode: combo, trail, emoji bursts, particles. */
export function ClassicEffects({
  ultraFlash,
  showCombo,
  combo,
  comboLabels,
  showSongName,
  songName,
  showIdle,
  keyFlash,
  trail,
  emojis,
  particles,
}) {
  let comboNode = null;
  if (showCombo && combo >= 2) {
    const { hot, fire, ultra } = getClassicLevelConfig(combo).comboThresholds;
    const tier =
      combo >= ultra
        ? "ultra"
        : combo >= fire
          ? "fire"
          : combo >= hot
            ? "hot"
            : "base";
    comboNode = (
      <div
        key={combo}
        className={`combo-display ${tier === "ultra" ? "combo-ultra" : tier === "fire" ? "combo-fire" : tier === "hot" ? "combo-hot" : ""}`}
      >
        {tier === "ultra"
          ? comboLabels.ultra
          : tier === "fire"
            ? comboLabels.fire
            : tier === "hot"
              ? "⚡ ×"
              : "✨ ×"}
        {combo}
      </div>
    );
  }

  return (
    <>
      {ultraFlash && <div className="ultra-flash" />}
      {comboNode}
      {showSongName && <div className="song-banner">{songName}</div>}
      {showIdle && (
        <div className="idle-hint">
          <span>👆</span>
        </div>
      )}
      {keyFlash && (
        <div key={keyFlash.id} className="key-flash">
          {keyFlash.emoji}
        </div>
      )}
      {trail.map((t) => (
        <div
          key={t.id}
          className={`trail-dot${t.swipe ? " swipe-trail" : ""}`}
          style={{
            left: t.x,
            top: t.y,
            background: t.swipe
              ? t.color
              : `radial-gradient(circle at 35% 35%, white, ${t.color})`,
            width: t.size,
            height: t.size,
            boxShadow: `0 0 ${t.size * 0.6}px ${t.color}, 0 0 ${t.size * 1.4}px ${t.color}88, 0 0 ${t.size * 2.5}px ${t.color}33`,
          }}
        >
          {t.sparkle && (
            <span
              style={{
                fontSize: t.size * 0.7,
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              ✨
            </span>
          )}
        </div>
      ))}
      {emojis.map((item) => (
        <div
          key={item.id}
          className="emoji-item"
          style={{
            left: item.x,
            top: item.y,
            fontSize: item.size,
            "--dx": `${item.dx}px`,
            "--dy": `${item.dy}px`,
            "--rot": `${item.rotation}deg`,
            "--dur": `${item.duration}ms`,
          }}
        >
          {item.emoji}
        </div>
      ))}
      {particles.map((p) => (
        <div
          key={p.id}
          className={`particle ${p.shape}`}
          style={{
            left: p.x,
            top: p.y,
            background: p.color,
            width: p.size,
            height: p.size,
            "--px": `${p.px}px`,
            "--py": `${p.py}px`,
          }}
        />
      ))}
    </>
  );
}
