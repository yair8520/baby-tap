import "./SettingsMenu.css";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { STORAGE_KEYS, resetAllProgress } from "../../storage/index.js";
import { getT } from "../../i18n/index.js";

const GAME_MODES = [
  { id: "classic", emoji: "🎮", key: "games.classic" },
  { id: "balloons", emoji: "🎈", key: "games.balloons" },
  { id: "drums", emoji: "🥁", key: "games.drums" },
  { id: "targets", emoji: "🎯", key: "games.targets" },
  { id: "autoshow", emoji: "🌙", key: "games.sleep" },
];

const LEARNING_MODES = [
  { id: "piano", emoji: "🎹", key: "learning.piano" },
  { id: "memory", emoji: "🧠", key: "learning.memory" },
  { id: "shapes", emoji: "🎨", key: "learning.shapes" },
  { id: "shapematch", emoji: "🔵", key: "learning.shapematch" },
  { id: "colormix", emoji: "🧪", key: "learning.colormix" },
  { id: "sizesort", emoji: "📏", key: "learning.sizesort" },
  { id: "shapememory", emoji: "🃏", key: "learning.shapememory" },
  { id: "pattern", emoji: "🔷", key: "learning.pattern" },
];

const TABS = [
  { id: "games", key: "menu.tabGames" },
  { id: "learning", key: "menu.tabLearning" },
  { id: "audio", key: "menu.tabAudio" },
  { id: "display", key: "menu.tabDisplay" },
];

export default function SettingsMenu({
  lang,
  gameMode,
  theme,
  muteOn,
  vibrateOn,
  themePresets,
  onGameModeChange,
  onLangChange,
  onThemeChange,
  onMuteChange,
  onVibrateChange,
  onClose,
}) {
  const isHe = lang === "he";
  const t = getT(lang);
  const [activeTab, setActiveTab] = useLocalStorage(
    STORAGE_KEYS.settingsTab,
    "games",
  );

  const press = (fn) => ({
    onTouchEnd: (e) => {
      e.preventDefault();
      e.stopPropagation();
      fn();
    },
    onMouseUp: (e) => {
      e.stopPropagation();
      fn();
    },
  });

  const handleResetProgress = () => {
    if (!window.confirm(t("display.resetConfirm"))) return;
    resetAllProgress();
    window.location.reload();
  };

  return (
    <div className="sm-panel" dir={isHe ? "rtl" : "ltr"}>
      <div className="sm-header">
        <span className="sm-title">{t("menu.title")}</span>
        <button className="sm-close" {...press(onClose)} aria-label="close">
          ✕
        </button>
      </div>

      <div className="sm-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`sm-tab${activeTab === tab.id ? " sm-tab--active" : ""}`}
            {...press(() => setActiveTab(tab.id))}
          >
            {t(tab.key)}
          </button>
        ))}
      </div>

      <div className="sm-body">
        {activeTab === "games" && (
          <section className="sm-section">
            <h3 className="sm-section-label">{t("games.label")}</h3>
            <div className="sm-mode-grid">
              {GAME_MODES.map((m) => (
                <button
                  key={m.id}
                  className={`sm-mode-btn${gameMode === m.id ? " sm-mode-btn--active" : ""}`}
                  {...press(() => {
                    onGameModeChange(m.id);
                    onClose();
                  })}
                >
                  <span className="sm-mode-emoji">{m.emoji}</span>
                  <span className="sm-mode-label">{t(m.key)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeTab === "learning" && (
          <section className="sm-section">
            <h3 className="sm-section-label">{t("learning.label")}</h3>
            <p className="sm-section-desc">{t("learning.description")}</p>
            <div className="sm-mode-grid">
              {LEARNING_MODES.map((m) => (
                <button
                  key={m.id}
                  className={`sm-mode-btn${gameMode === m.id ? " sm-mode-btn--active" : ""}`}
                  {...press(() => {
                    onGameModeChange(m.id);
                    onClose();
                  })}
                >
                  <span className="sm-mode-emoji">{m.emoji}</span>
                  <span className="sm-mode-label">{t(m.key)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeTab === "audio" && (
          <section className="sm-section">
            <h3 className="sm-section-label">{t("audio.label")}</h3>
            <div className="sm-toggle-row">
              <span className="sm-toggle-label">
                <span className="sm-toggle-icon">{muteOn ? "🔇" : "🔊"}</span>
                {t("audio.sound")}
              </span>
              <button
                className={`sm-toggle${muteOn ? "" : " sm-toggle--on"}`}
                {...press(() => onMuteChange(!muteOn))}
                aria-pressed={!muteOn}
              />
            </div>
            <div className="sm-toggle-row">
              <span className="sm-toggle-label">
                <span className="sm-toggle-icon">{vibrateOn ? "📳" : "🔕"}</span>
                {t("audio.vibrate")}
              </span>
              <button
                className={`sm-toggle${vibrateOn ? " sm-toggle--on" : ""}`}
                {...press(() => onVibrateChange(!vibrateOn))}
                aria-pressed={vibrateOn}
              />
            </div>
          </section>
        )}

        {activeTab === "display" && (
          <section className="sm-section">
            <h3 className="sm-section-label">{t("display.language")}</h3>
            <div className="sm-mode-grid sm-mode-grid--2">
              {[
                { id: "he", emoji: "🇮🇱", label: "עברית" },
                { id: "en", emoji: "🇬🇧", label: "English" },
              ].map((l) => (
                <button
                  key={l.id}
                  className={`sm-mode-btn${lang === l.id ? " sm-mode-btn--active" : ""}`}
                  {...press(() => onLangChange(l.id))}
                >
                  <span className="sm-mode-emoji">{l.emoji}</span>
                  <span className="sm-mode-label">{l.label}</span>
                </button>
              ))}
            </div>

            <h3 className="sm-section-label">{t("display.theme")}</h3>
            <div className="sm-mode-grid sm-mode-grid--4">
              {Object.values(themePresets).map((th) => (
                <button
                  key={th.id}
                  className={`sm-mode-btn${theme === th.id ? " sm-mode-btn--active" : ""}`}
                  {...press(() => onThemeChange(th.id))}
                >
                  <span className="sm-mode-emoji">{th.emoji}</span>
                  <span className="sm-mode-label">{th.label[lang]}</span>
                </button>
              ))}
            </div>

            <h3 className="sm-section-label">{t("display.progress")}</h3>
            <button
              type="button"
              className="sm-reset-btn"
              {...press(handleResetProgress)}
            >
              {t("display.resetProgress")}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
