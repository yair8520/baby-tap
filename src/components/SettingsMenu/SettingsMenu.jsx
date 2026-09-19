import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { useLang, useT } from "../../i18n";
import { STORAGE_KEYS } from "../../storage/keys.js";
import { PLAY, LEARNING, gamesByCategory } from "../../games/registry.js";
import { ResetProgressControl } from "../ResetProgressControl/index.js";
import "./SettingsMenu.css";

const GAME_MODES = gamesByCategory(PLAY).map((g) => ({
  id: g.id,
  emoji: g.emoji,
  key: g.i18nKey,
}));

const LEARNING_MODES = gamesByCategory(LEARNING).map((g) => ({
  id: g.id,
  emoji: g.emoji,
  key: g.i18nKey,
}));

const TABS = [
  { id: "games", key: "menu.tabGames" },
  { id: "learning", key: "menu.tabLearning" },
  { id: "audio", key: "menu.tabAudio" },
  { id: "display", key: "menu.tabDisplay" },
];
const TAB_IDS = TABS.map((tab) => tab.id);

/** In-game settings drawer (modes, audio, display). */
export function SettingsMenu({
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
  onResetProgress,
  onClose,
}) {
  const { lang, dir } = useLang();
  const t = useT();
  const [activeTab, setActiveTab] = useLocalStorage(
    STORAGE_KEYS.settingsTab,
    "games",
    TAB_IDS,
  );

  const stopPointerPropagation = (event) => event.stopPropagation();

  return (
    <div
      id="settings-menu"
      className="sm-panel"
      dir={dir}
      onPointerDown={stopPointerPropagation}
      onPointerUp={stopPointerPropagation}
    >
      <div className="sm-header">
        <span className="sm-title">{t("menu.title")}</span>
        <button
          type="button"
          className="sm-close"
          onClick={onClose}
          aria-label={t("menu.close")}
        >
          ✕
        </button>
      </div>

      <div className="sm-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`settings-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`settings-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`sm-tab${activeTab === tab.id ? " sm-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {t(tab.key)}
          </button>
        ))}
      </div>

      <div className="sm-body">
        {activeTab === "games" && (
          <section
            id="settings-panel-games"
            className="sm-section"
            role="tabpanel"
            aria-labelledby="settings-tab-games"
            tabIndex={0}
          >
            <h3 className="sm-section-label">{t("games.label")}</h3>
            <div className="sm-mode-grid">
              {GAME_MODES.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className={`sm-mode-btn${gameMode === m.id ? " sm-mode-btn--active" : ""}`}
                  aria-pressed={gameMode === m.id}
                  onClick={() => {
                    onGameModeChange(m.id);
                    onClose();
                  }}
                >
                  <span className="sm-mode-emoji">{m.emoji}</span>
                  <span className="sm-mode-label">{t(m.key)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeTab === "learning" && (
          <section
            id="settings-panel-learning"
            className="sm-section"
            role="tabpanel"
            aria-labelledby="settings-tab-learning"
            tabIndex={0}
          >
            <h3 className="sm-section-label">{t("learning.label")}</h3>
            <p className="sm-section-desc">{t("learning.description")}</p>
            <div className="sm-mode-grid">
              {LEARNING_MODES.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className={`sm-mode-btn${gameMode === m.id ? " sm-mode-btn--active" : ""}`}
                  aria-pressed={gameMode === m.id}
                  onClick={() => {
                    onGameModeChange(m.id);
                    onClose();
                  }}
                >
                  <span className="sm-mode-emoji">{m.emoji}</span>
                  <span className="sm-mode-label">{t(m.key)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeTab === "audio" && (
          <section
            id="settings-panel-audio"
            className="sm-section"
            role="tabpanel"
            aria-labelledby="settings-tab-audio"
            tabIndex={0}
          >
            <h3 className="sm-section-label">{t("audio.label")}</h3>

            <div className="sm-toggle-row">
              <span className="sm-toggle-label">
                <span className="sm-toggle-icon">{muteOn ? "🔇" : "🔊"}</span>
                {t("audio.sound")}
              </span>
              <button
                type="button"
                className={`sm-toggle${muteOn ? "" : " sm-toggle--on"}`}
                onClick={() => onMuteChange(!muteOn)}
                aria-pressed={!muteOn}
                aria-label={t("menu.soundToggle")}
              />
            </div>

            <div className="sm-toggle-row">
              <span className="sm-toggle-label">
                <span className="sm-toggle-icon">{vibrateOn ? "📳" : "🔕"}</span>
                {t("audio.vibrate")}
              </span>
              <button
                type="button"
                className={`sm-toggle${vibrateOn ? " sm-toggle--on" : ""}`}
                onClick={() => onVibrateChange(!vibrateOn)}
                aria-pressed={vibrateOn}
                aria-label={t("menu.vibrateToggle")}
              />
            </div>
          </section>
        )}

        {activeTab === "display" && (
          <section
            id="settings-panel-display"
            className="sm-section"
            role="tabpanel"
            aria-labelledby="settings-tab-display"
            tabIndex={0}
          >
            <h3 className="sm-section-label">{t("display.language")}</h3>
            <div className="sm-mode-grid sm-mode-grid--2">
              {[
                { id: "he", emoji: "🇮🇱", label: "עברית" },
                { id: "en", emoji: "🇬🇧", label: "English" },
              ].map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={`sm-mode-btn${lang === option.id ? " sm-mode-btn--active" : ""}`}
                  aria-pressed={lang === option.id}
                  onClick={() => onLangChange(option.id)}
                >
                  <span className="sm-mode-emoji">{option.emoji}</span>
                  <span className="sm-mode-label">{option.label}</span>
                </button>
              ))}
            </div>

            <h3 className="sm-section-label">{t("display.theme")}</h3>
            <div className="sm-mode-grid sm-mode-grid--4">
              {Object.values(themePresets).map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  className={`sm-mode-btn${theme === preset.id ? " sm-mode-btn--active" : ""}`}
                  aria-pressed={theme === preset.id}
                  onClick={() => onThemeChange(preset.id)}
                >
                  <span className="sm-mode-emoji">{preset.emoji}</span>
                  <span className="sm-mode-label">{preset.label[lang]}</span>
                </button>
              ))}
            </div>

            <ResetProgressControl onReset={onResetProgress} />
          </section>
        )}
      </div>
    </div>
  );
}
