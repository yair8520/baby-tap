import { useState } from "react";
import "./SettingsMenu.css";

const GAME_MODES = [
  { id: "classic",  emoji: "🎮", he: "קלאסי",   en: "Classic" },
  { id: "balloons", emoji: "🎈", he: "בלונים",   en: "Balloons" },
  { id: "drums",    emoji: "🥁", he: "תופים",    en: "Drums" },
  { id: "targets",  emoji: "🎯", he: "מטרות",    en: "Targets" },
  { id: "autoshow", emoji: "🌙", he: "שינה",     en: "Sleep" },
];

const LEARNING_MODES = [
  { id: "piano",  emoji: "🎹", he: "פסנתר",  en: "Piano" },
  { id: "memory", emoji: "🧠", he: "זיכרון", en: "Memory" },
  { id: "shapes", emoji: "🎨", he: "צורות",  en: "Shapes" },
];

const TABS = [
  { id: "games",    he: "🎮 משחקים", en: "🎮 Games" },
  { id: "learning", he: "📚 למידה",  en: "📚 Learning" },
  { id: "audio",    he: "🔊 שמע",    en: "🔊 Audio" },
  { id: "display",  he: "🎨 תצוגה",  en: "🎨 Display" },
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
  const [activeTab, setActiveTab] = useState("games");

  const L = (he, en) => (isHe ? he : en);

  /** Unified touch+mouse handler to avoid duplicate fires */
  const press = (fn) => ({
    onTouchEnd: (e) => { e.preventDefault(); e.stopPropagation(); fn(); },
    onMouseUp:  (e) => { e.stopPropagation(); fn(); },
  });

  return (
    <div className="sm-panel" dir={isHe ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="sm-header">
        <span className="sm-title">{L("הגדרות", "Settings")}</span>
        <button className="sm-close" {...press(onClose)} aria-label="close">✕</button>
      </div>

      {/* Tab bar */}
      <div className="sm-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`sm-tab${activeTab === tab.id ? " sm-tab--active" : ""}`}
            {...press(() => setActiveTab(tab.id))}
          >
            {isHe ? tab.he : tab.en}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="sm-body">

        {/* ── GAMES tab ── */}
        {activeTab === "games" && (
          <section className="sm-section">
            <h3 className="sm-section-label">{L("בחר מצב משחק", "Choose Game Mode")}</h3>
            <div className="sm-mode-grid">
              {GAME_MODES.map((m) => (
                <button
                  key={m.id}
                  className={`sm-mode-btn${gameMode === m.id ? " sm-mode-btn--active" : ""}`}
                  {...press(() => { onGameModeChange(m.id); onClose(); })}
                >
                  <span className="sm-mode-emoji">{m.emoji}</span>
                  <span className="sm-mode-label">{isHe ? m.he : m.en}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── LEARNING tab ── */}
        {activeTab === "learning" && (
          <section className="sm-section">
            <h3 className="sm-section-label">{L("מצבי למידה", "Learning Modes")}</h3>
            <p className="sm-section-desc">
              {L("משחקי חשיבה ולמידה לילדים", "Educational games for kids")}
            </p>
            <div className="sm-mode-grid">
              {LEARNING_MODES.map((m) => (
                <button
                  key={m.id}
                  className={`sm-mode-btn${gameMode === m.id ? " sm-mode-btn--active" : ""}`}
                  {...press(() => { onGameModeChange(m.id); onClose(); })}
                >
                  <span className="sm-mode-emoji">{m.emoji}</span>
                  <span className="sm-mode-label">{isHe ? m.he : m.en}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── AUDIO tab ── */}
        {activeTab === "audio" && (
          <section className="sm-section">
            <h3 className="sm-section-label">{L("הגדרות שמע", "Audio Settings")}</h3>

            <div className="sm-toggle-row">
              <span className="sm-toggle-label">
                <span className="sm-toggle-icon">{muteOn ? "🔇" : "🔊"}</span>
                {L("צליל", "Sound")}
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
                {L("רטט", "Vibrate")}
              </span>
              <button
                className={`sm-toggle${vibrateOn ? " sm-toggle--on" : ""}`}
                {...press(() => onVibrateChange(!vibrateOn))}
                aria-pressed={vibrateOn}
              />
            </div>
          </section>
        )}

        {/* ── DISPLAY tab ── */}
        {activeTab === "display" && (
          <section className="sm-section">
            <h3 className="sm-section-label">{L("שפה", "Language")}</h3>
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

            <h3 className="sm-section-label">{L("ערכת נושא", "Theme")}</h3>
            <div className="sm-mode-grid sm-mode-grid--4">
              {Object.values(themePresets).map((t) => (
                <button
                  key={t.id}
                  className={`sm-mode-btn${theme === t.id ? " sm-mode-btn--active" : ""}`}
                  {...press(() => onThemeChange(t.id))}
                >
                  <span className="sm-mode-emoji">{t.emoji}</span>
                  <span className="sm-mode-label">{t.label[lang]}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
