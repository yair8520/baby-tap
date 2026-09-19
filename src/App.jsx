import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "./App.css";

import {
  isHebrew as defaultHebrew,
  isWebView,
} from "./constants";

import { setGlobalMute, playSound } from "./audio.js";

import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { STORAGE_KEYS } from "./storage/keys.js";
import { clearStoredProgress } from "./storage/progress.js";
import { isBoolean } from "./storage/validation.js";
import SettingsMenu from "./components/SettingsMenu/index.jsx";
import { ActiveGame } from "./components/ActiveGame";
import { getT } from "./i18n/index.js";
import { LangProvider } from "./i18n/LangProvider.jsx";
import { buzz } from "./components/LearningGameShell/vibrate.js";
import {
  DEFAULT_GAME_ID,
  GAME_MODE_IDS,
  getGame,
} from "./games/registry.js";

const THEME_PRESETS = {
  space: {
    id: "space",
    label: { he: "חלל", en: "Space" },
    emoji: "🚀",
    heroRow: "🚀 🪐 🌙 ✨",
    emojis: ["🚀", "🛸", "🪐", "🌙", "☄️", "⭐", "🌟", "✨", "💫", "🌌", "👨‍🚀", "🛰️"],
    colors: ["#7B2FF7", "#3A86FF", "#00C2FF", "#B5179E", "#8338EC", "#5E60CE", "#4CC9F0"],
  },
  animals: {
    id: "animals",
    label: { he: "חיות", en: "Animals" },
    emoji: "🦁",
    heroRow: "🦁 🐼 🐶 🦋",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐸", "🦁", "🐮", "🐵", "🦋", "🐢", "🦄", "🌈", "⭐"],
    colors: ["#FF9AA2", "#FFB7B2", "#FFDAC1", "#E2F0CB", "#B5EAD7", "#C7CEEA", "#A0E7E5"],
  },
  ocean: {
    id: "ocean",
    label: { he: "ים", en: "Ocean" },
    emoji: "🐬",
    heroRow: "🐬 🐠 🌊 🫧",
    emojis: ["🐠", "🐟", "🐬", "🐳", "🐙", "🦀", "🐚", "🌊", "🫧", "⭐", "✨", "💧"],
    colors: ["#00B4D8", "#0077B6", "#48CAE4", "#90E0EF", "#0096C7", "#5E60CE", "#80ED99"],
  },
  farm: {
    id: "farm",
    label: { he: "חווה", en: "Farm" },
    emoji: "🐮",
    heroRow: "🐮 🚜 🌾 🐔",
    emojis: ["🐮", "🐷", "🐔", "🐥", "🐴", "🐑", "🦆", "🌾", "🚜", "🍎", "🍓", "🌻"],
    colors: ["#FFD166", "#EF476F", "#06D6A0", "#118AB2", "#8ECAE6", "#90BE6D", "#F3722C"],
  },
};

const LANGUAGE_IDS = ["he", "en"];
const THEME_IDS = Object.keys(THEME_PRESETS);

export default function App() {
  const [lang, setLang] = useLocalStorage(
    STORAGE_KEYS.lang,
    defaultHebrew ? "he" : "en",
    LANGUAGE_IDS,
  );
  const isHebrewUI = lang === "he";
  const t = useMemo(() => getT(lang), [lang]);
  const [theme, setTheme] = useLocalStorage(
    STORAGE_KEYS.theme,
    "space",
    THEME_IDS,
  );
  const activeTheme = THEME_PRESETS[theme] || THEME_PRESETS.space;
  const activeEmojis = activeTheme.emojis;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [vibrateOn, setVibrateOn] = useLocalStorage(
    STORAGE_KEYS.vibrateOn,
    true,
    isBoolean,
  );
  const [muteOn, setMuteOn] = useLocalStorage(
    STORAGE_KEYS.muteOn,
    false,
    isBoolean,
  );
  const [gameMode, setGameMode] = useLocalStorage(
    STORAGE_KEYS.gameMode,
    DEFAULT_GAME_ID,
    GAME_MODE_IDS,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSettingsHint, setShowSettingsHint] = useState(false);
  const [progressEpoch, setProgressEpoch] = useState(0);

  const containerRef = useRef(null);
  const holdStartRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const vibrateRef = useRef(true);
  const muteRef = useRef(false);
  const settingsRef = useRef(null);
  const timeoutIdsRef = useRef(new Set());

  const scheduleTimeout = useCallback((callback, delay) => {
    const id = setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      callback();
    }, delay);
    timeoutIdsRef.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    vibrateRef.current = vibrateOn;
  }, [vibrateOn]);
  useEffect(() => {
    muteRef.current = muteOn;
    setGlobalMute(muteOn);
  }, [muteOn]);
  useEffect(() => {
    document.title = t("common.title");
  }, [t]);

  const vibrate = useCallback((pattern) => {
    buzz(pattern, vibrateRef.current);
  }, []);

  const onSound = useCallback((type) => {
    if (muteRef.current) return;
    if (type === "match") playSound("match");
    else playSound("miss");
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      const resetTimer = scheduleTimeout(() => setShowSettingsHint(false), 0);
      return () => clearTimeout(resetTimer);
    }
    const hintTimer = setTimeout(() => setShowSettingsHint(true), 2000);
    const hideTimer = setTimeout(() => setShowSettingsHint(false), 7000);
    return () => {
      clearTimeout(hintTimer);
      clearTimeout(hideTimer);
    };
  }, [isFullscreen, scheduleTimeout]);

  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => {
      document.removeEventListener("pointerdown", handler);
    };
  }, [settingsOpen]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enterFullscreen = async () => {
    if (
      !isWebView &&
      typeof globalThis.DeviceMotionEvent?.requestPermission === "function"
    ) {
      const cached = sessionStorage.getItem("motionPermission");
      if (cached !== "granted") {
        try {
          const result = await globalThis.DeviceMotionEvent.requestPermission();
          sessionStorage.setItem("motionPermission", result);
        } catch {
          // Motion permission is optional; fullscreen can continue without it.
        }
      }
    }
    if (isWebView) {
      setIsFullscreen(true);
    } else {
      containerRef.current?.requestFullscreen?.();
    }
  };

  const exitFullscreen = () => {
    if (isWebView) {
      setIsFullscreen(false);
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "exit" }));
    } else {
      document.fullscreenElement && document.exitFullscreen();
    }
  };

  const handleCornerStart = (e) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    holdStartRef.current = Date.now();
    clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = setInterval(() => {
      const p = Math.min((Date.now() - holdStartRef.current) / 1000, 1);
      setHoldProgress(p);
      if (p >= 1) {
        clearInterval(holdIntervalRef.current);
        setHoldProgress(0);
        exitFullscreen();
      }
    }, 30);
  };

  const handleCornerEnd = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    clearInterval(holdIntervalRef.current);
    setHoldProgress(0);
  };

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      clearInterval(holdIntervalRef.current);
      timeoutIds.forEach(clearTimeout);
      timeoutIds.clear();
    };
  }, []);

  const resetProgress = useCallback(() => {
    try {
      clearStoredProgress(window.localStorage);
    } catch {
      // Preference storage may be unavailable; still reset live game state.
    }
    setProgressEpoch((epoch) => epoch + 1);
  }, []);

  const C = 2 * Math.PI * 22;
  const activeEntry = getGame(gameMode);
  const hideAppChrome = !!activeEntry.hideAppChrome;

  const gameCtx = {
    lang,
    t,
    activeEmojis,
    activeColors: activeTheme.colors,
    vibrateOn,
    muteOn,
    vibrate,
    onSound,
    comboLabels: { ultra: t("common.ultra"), fire: t("common.fire") },
    onExit: () => setGameMode(DEFAULT_GAME_ID),
  };

  return (
    <LangProvider lang={lang}>
      <div ref={containerRef} className={`app theme-${theme}`}>
        <div className="bg-base" />
        <div className="bg-aurora">
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
          <div className="aurora-blob aurora-blob-4" />
        </div>
        <div className="bg-stars" />
        <div className="bg-bubbles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`bubble bubble-${(i % 4) + 1}`}
              style={{
                left: `${(i * 5.2 + 2) % 100}%`,
                width: `${20 + ((i * 19) % 70)}px`,
                height: `${20 + ((i * 19) % 70)}px`,
                animationDuration: `${13 + ((i * 1.9) % 10)}s`,
                animationDelay: `-${(i * 2.8) % 16}s`,
              }}
            />
          ))}
        </div>
        <div className="theme-symbols">
          {Array.from({ length: 14 }).map((_, i) => {
            const sym = activeEmojis[i % activeEmojis.length];
            return (
              <span
                key={`${theme}-${i}-${sym}`}
                className="theme-symbol"
                style={{
                  left: `${(i * 7.1 + 3) % 100}%`,
                  animationDuration: `${11 + ((i * 1.7) % 10)}s`,
                  animationDelay: `-${(i * 2.1) % 12}s`,
                  fontSize: `${20 + ((i * 7) % 22)}px`,
                }}
              >
                {sym}
              </span>
            );
          })}
        </div>

        {!isFullscreen && (
          <div className="start-screen">
            <div className="start-card" dir={isHebrewUI ? "rtl" : "ltr"}>
              <div className="start-emoji-row">
                {activeTheme.heroRow || t("common.emojiRow")}
              </div>
              <h1 className="start-title">{t("common.title")}</h1>
              <p className="start-subtitle">
                {t("common.subtitle")
                  .split("\n")
                  .map((line, i) => (
                    <span key={i}>
                      {line}
                      {i === 0 && <br />}
                    </span>
                  ))}
              </p>
              <button
                type="button"
                className="start-btn"
                onClick={enterFullscreen}
              >
                {t("common.startFullscreen")}
              </button>
              <p className="start-hint">{t("common.exitHint")}</p>
              <a className="start-privacy-link" href="#privacy-policy">
                {t("common.privacyPolicy")}
              </a>
            </div>
          </div>
        )}

        {isFullscreen && (
          <>
            {!hideAppChrome && (
              <button
                type="button"
                className="corner-hold"
                aria-label={t("common.exitFullscreen")}
                onPointerDown={handleCornerStart}
                onPointerUp={handleCornerEnd}
                onPointerCancel={handleCornerEnd}
                onLostPointerCapture={handleCornerEnd}
              >
                <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
                  <circle
                    cx="26"
                    cy="26"
                    r="22"
                    fill="rgba(0,0,0,0.35)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="26"
                    cy="26"
                    r="22"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray={`${holdProgress * C} ${C}`}
                    strokeLinecap="round"
                    transform="rotate(-90 26 26)"
                  />
                  <text
                    x="26"
                    y="32"
                    textAnchor="middle"
                    fill="white"
                    fontSize="18"
                  >
                    ✕
                  </text>
                </svg>
              </button>
            )}

            {!hideAppChrome && (
              <div className="settings-wrap" ref={settingsRef}>
                <button
                  className={`settings-gear-btn${showSettingsHint ? " settings-gear-pulse" : ""}`}
                  type="button"
                  aria-label={t("common.openSettings")}
                  aria-expanded={settingsOpen}
                  aria-controls="settings-menu"
                  onClick={(e) => {
                    setShowSettingsHint(false);
                    setSettingsOpen((o) => !o);
                    e.stopPropagation();
                  }}
                >
                  ⚙️
                </button>

                {showSettingsHint && !settingsOpen && (
                  <div
                    className="settings-hint-bubble"
                    role="status"
                    aria-live="polite"
                  >
                    {t("menu.settingsHint")}
                  </div>
                )}

                {settingsOpen && (
                  <SettingsMenu
                    lang={lang}
                    gameMode={gameMode}
                    theme={theme}
                    muteOn={muteOn}
                    vibrateOn={vibrateOn}
                    themePresets={THEME_PRESETS}
                    onGameModeChange={setGameMode}
                    onLangChange={setLang}
                    onThemeChange={setTheme}
                    onMuteChange={setMuteOn}
                    onVibrateChange={setVibrateOn}
                    onResetProgress={resetProgress}
                    onClose={() => setSettingsOpen(false)}
                  />
                )}
              </div>
            )}

            <ActiveGame
              gameMode={gameMode}
              progressEpoch={progressEpoch}
              ctx={gameCtx}
            />
          </>
        )}
      </div>
    </LangProvider>
  );
}
