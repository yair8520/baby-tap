import { useState, useEffect, useRef } from "react";
import "./App.css";
import appIcon from "./assets/icon-192.png";
import appIconLarge from "./assets/icon-512.png";
import ShapeMatch from "./games/shapematch";
import ColorMix from "./games/colormix";
import SizeSort from "./games/sizesort";
import ShapeMemory from "./games/shapememory";
import PatternGame from "./games/pattern";
import ClassicGame from "./games/classic";
import DrumsGame from "./games/drums";
import BalloonsGame from "./games/balloons";
import TargetsGame from "./games/targets";
import PianoGame from "./games/piano";
import SleepGame from "./games/sleep";

import {
  isHebrew as defaultHebrew,
  isWebView,
  canVibrate,
} from "./constants";

import { setGlobalMute, playSound } from "./audio.js";

import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { STORAGE_KEYS } from "./storage/keys.js";
import SettingsMenu from "./components/SettingsMenu/index.jsx";
import MemoryGame from "./games/memory";
import ShapesGame from "./games/shapes";
import { getT } from "./i18n/index.js";
import { THEME_PRESETS } from "./themes.js";

export default function App() {
  const [lang, setLang] = useLocalStorage(STORAGE_KEYS.lang, defaultHebrew ? "he" : "en");
  const isHebrewUI = lang === "he";
  const t = getT(lang);
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.theme, "space");
  const activeTheme = THEME_PRESETS[theme] || THEME_PRESETS.space;
  const activeEmojis = activeTheme.emojis;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [vibrateOn, setVibrateOn] = useLocalStorage(STORAGE_KEYS.vibrateOn, true);
  const [muteOn, setMuteOn] = useLocalStorage(STORAGE_KEYS.muteOn, false);
  const [gameMode, setGameMode] = useLocalStorage(STORAGE_KEYS.gameMode, "classic");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSettingsHint, setShowSettingsHint] = useState(false);

  const containerRef = useRef(null);
  const holdStartRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const muteRef = useRef(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    muteRef.current = muteOn;
    setGlobalMute(muteOn);
  }, [muteOn]);

  // Favicons
  useEffect(() => {
    const setHeadIcon = (selector, rel, href, type) => {
      let link = document.head.querySelector(selector);
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        document.head.appendChild(link);
      }
      if (type) link.setAttribute("type", type);
      link.setAttribute("href", href);
    };
    setHeadIcon('link[rel="icon"]', "icon", appIcon, "image/png");
    setHeadIcon(
      'link[rel="apple-touch-icon"]',
      "apple-touch-icon",
      appIconLarge,
    );
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      setShowSettingsHint(false);
      return;
    }
    const hintTimer = setTimeout(() => setShowSettingsHint(true), 2000);
    const hideTimer = setTimeout(() => setShowSettingsHint(false), 7000);
    return () => {
      clearTimeout(hintTimer);
      clearTimeout(hideTimer);
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
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
      typeof DeviceMotionEvent?.requestPermission === "function"
    ) {
      const cached = sessionStorage.getItem("motionPermission");
      if (cached !== "granted") {
        try {
          const result = await DeviceMotionEvent.requestPermission();
          sessionStorage.setItem("motionPermission", result);
        } catch (e) {}
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
    e.stopPropagation();
    holdStartRef.current = Date.now();
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
    e?.stopPropagation();
    clearInterval(holdIntervalRef.current);
    setHoldProgress(0);
  };

  const C = 2 * Math.PI * 22;

  return (
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
              {t("common.subtitle").split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
            </p>
            <button className="start-btn" onClick={enterFullscreen}>
              {t("common.startFullscreen")}
            </button>
            <p className="start-hint">{t("common.exitHint")}</p>
            <a
              className="start-privacy-link"
              href="#privacy-policy"
              rel="noopener noreferrer"
            >
              {t("common.privacyPolicy")}
            </a>
          </div>
        </div>
      )}

      {isFullscreen && (
        <>
          <div
            className="corner-hold"
            onTouchStart={handleCornerStart}
            onTouchEnd={handleCornerEnd}
            onMouseDown={handleCornerStart}
            onMouseUp={handleCornerEnd}
            onMouseLeave={handleCornerEnd}
          >
            <svg width="52" height="52" viewBox="0 0 52 52">
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
          </div>

          <div className="settings-wrap" ref={settingsRef}>
            <button
              className={`settings-gear-btn${showSettingsHint ? " settings-gear-pulse" : ""}`}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSettingsHint(false);
                setSettingsOpen((o) => !o);
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                setShowSettingsHint(false);
                setSettingsOpen((o) => !o);
              }}
            >
              ⚙️
            </button>

            {showSettingsHint && !settingsOpen && (
              <div className="settings-hint-bubble">
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
                onClose={() => setSettingsOpen(false)}
              />
            )}
          </div>

          {gameMode === "classic" && (
            <ClassicGame
              lang={lang}
              activeEmojis={activeEmojis}
              activeColors={activeTheme.colors}
              vibrateOn={vibrateOn}
              comboLabels={{ ultra: t("common.ultra"), fire: t("common.fire") }}
            />
          )}

          {gameMode === "balloons" && (
            <BalloonsGame lang={lang} vibrateOn={vibrateOn} />
          )}

          {gameMode === "drums" && <DrumsGame vibrateOn={vibrateOn} />}

          {gameMode === "targets" && (
            <TargetsGame lang={lang} activeEmojis={activeEmojis} vibrateOn={vibrateOn} />
          )}

          {gameMode === "autoshow" && (
            <SleepGame lang={lang} muteOn={muteOn} />
          )}

          {gameMode === "piano" && (
            <PianoGame lang={lang} vibrateOn={vibrateOn} />
          )}

          {gameMode === "memory" && (
            <MemoryGame
              lang={lang}
              onSound={(type) => {
                if (muteRef.current) return;
                if (type === "match") playSound("match");
                else playSound("miss");
              }}
            />
          )}

          {gameMode === "shapes" && (
            <ShapesGame
              lang={lang}
              onSound={(type) => {
                if (muteRef.current) return;
                if (type === "match") playSound("match");
                else playSound("miss");
              }}
            />
          )}
        </>
      )}

      {isFullscreen && gameMode === "shapematch" && (
        <ShapeMatch
          onExit={() => setGameMode("classic")}
          lang={lang}
          vibrateOn={vibrateOn && canVibrate}
        />
      )}

      {isFullscreen && gameMode === "colormix" && (
        <ColorMix
          onExit={() => setGameMode("classic")}
          lang={lang}
          vibrateOn={vibrateOn && canVibrate}
        />
      )}

      {isFullscreen && gameMode === "sizesort" && (
        <SizeSort
          onExit={() => setGameMode("classic")}
          lang={lang}
          vibrateOn={vibrateOn && canVibrate}
        />
      )}

      {isFullscreen && gameMode === "shapememory" && (
        <ShapeMemory
          onExit={() => setGameMode("classic")}
          lang={lang}
          vibrateOn={vibrateOn && canVibrate}
        />
      )}

      {isFullscreen && gameMode === "pattern" && (
        <PatternGame
          onExit={() => setGameMode("classic")}
          lang={lang}
          vibrateOn={vibrateOn && canVibrate}
        />
      )}
    </div>
  );
}
