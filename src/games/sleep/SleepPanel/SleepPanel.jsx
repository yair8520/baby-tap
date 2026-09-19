import { useT, useLang } from "../../../i18n";
import { NOISE_SOUNDS, MELODY_SOUNDS } from "../useSleepAudio.js";
import "./SleepPanel.css";

/** Settings panel for sleep ambience (play/pause, noise, melodies, volume). */
export function SleepPanel({
  open,
  sleepSoundMode,
  sleepVolume,
  sleepEnabled,
  melodiesOpen,
  onSoundModeChange,
  onVolumeChange,
  onEnabledChange,
  onMelodiesOpenChange,
  onClose,
  panelRef,
}) {
  const t = useT();
  const { dir } = useLang();
  if (!open) return null;

  return (
    <div className="sleep-panel" ref={panelRef} dir={dir}>
      <div className="sleep-title">{t("sleep.title")}</div>
      <div className="sleep-subtitle">{t("sleep.subtitle")}</div>

      <div className="sleep-control-row">
        <button
          type="button"
          className={`sleep-action-btn${sleepEnabled ? " active" : ""}`}
          onPointerUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEnabledChange((v) => !v);
          }}
        >
          {sleepEnabled ? t("sleep.pause") : t("sleep.play")}
        </button>
        <button
          type="button"
          className="sleep-action-btn"
          onPointerUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEnabledChange(false);
            onClose();
          }}
        >
          {t("sleep.off")}
        </button>
      </div>

      <div className="sleep-section-label">{t("sleep.whiteNoise")}</div>
      <div className="sleep-noise-grid">
        {NOISE_SOUNDS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`sleep-noise-btn${sleepSoundMode === s.id ? " active" : ""}`}
            onPointerUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSoundModeChange(s.id);
              onEnabledChange(true);
            }}
          >
            <span>{s.emoji}</span>
            <span>{t(s.i18nKey)}</span>
          </button>
        ))}
      </div>

      <div className="sleep-melodies-toggle-row">
        <button
          type="button"
          className="sleep-melodies-toggle"
          onPointerUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMelodiesOpenChange((v) => !v);
          }}
        >
          {melodiesOpen ? t("sleep.melodiesOpen") : t("sleep.melodies")}
        </button>
      </div>

      {melodiesOpen && (
        <div className="sleep-noise-grid sleep-melodies-grid">
          {MELODY_SOUNDS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`sleep-noise-btn${sleepSoundMode === s.id ? " active" : ""}`}
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSoundModeChange(s.id);
                onEnabledChange(true);
              }}
            >
              <span>{s.emoji}</span>
              <span>{t(s.i18nKey)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="sleep-volume-row">
        <span>{t("sleep.volume")}</span>
        <input
          type="range"
          min="0"
          max="0.9"
          step="0.05"
          value={sleepVolume}
          aria-label={t("sleep.volume")}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
