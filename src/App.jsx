import { useState, useEffect, useCallback, useRef } from "react";
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
import PianoGame from "./games/piano";
import SleepGame from "./games/sleep";

import {
  IS_TOUCH,
  isHebrew as defaultHebrew,
  isWebView,
  canVibrate,
} from "./constants.js";
import {
  BALLOON_LEVELS,
  BALLOON_LEVEL_STEP,
  getBalloonLevelNumber,
  getBalloonConfigByLevel,
} from "./games/balloons/levels.js";
import { getTargetLevelConfig } from "./games/targets/levels.js";

import {
  setGlobalMute,
  playSound,
  playBalloonPop,
} from "./audio.js";

import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { STORAGE_KEYS } from "./storage/keys.js";
import {
  isBoolean,
  isNonNegativeInteger,
} from "./storage/validation.js";
import SettingsMenu from "./components/SettingsMenu/index.jsx";
import MemoryGame from "./games/memory/MemoryGame.jsx";
import ShapesGame from "./games/shapes/ShapesGame.jsx";
import { rand, randInt, nextId } from "./utils/random.js";

const UI_TEXT = {
  he: {
    emojiRow: "👶🏻 🎉 🌈",
    title: "Baby Tap Game",
    subtitle: "תנו לתינוק ללחוץ על המסך\nולראות קסם צבעוני! ✨",
    btn: "🚀 התחל מסך מלא",
    hint: "ליציאה: לחיצה בפינה הימנית העליונה",
    ultra: "👑 עוצמה ×",
    fire: "🔥 לוהט ×",
  },
  en: {
    emojiRow: "👶🏻 🎉 🌈",
    title: "Baby Tap Game",
    subtitle: "Let the baby tap the screen\nand see colorful magic! ✨",
    btn: "🚀 Start Fullscreen",
    hint: "To exit: tap top-right corner",
    ultra: "👑 ULTRA ×",
    fire: "🔥 HOT ×",
  },
};

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
const GAME_MODE_IDS = [
  "classic",
  "balloons",
  "drums",
  "targets",
  "autoshow",
  "piano",
  "memory",
  "shapes",
  "shapematch",
  "colormix",
  "sizesort",
  "shapememory",
  "pattern",
];
const isBalloonLevel = (value) =>
  Number.isInteger(value) &&
  value >= 1 &&
  value <= BALLOON_LEVELS.length;

// speedFactor: 1 = normal, 2 = twice as fast, etc.
function makeBalloon(speedFactor = 1) {
  const size = randInt(65, 106);
  const hue = randInt(0, 360);
  const sway = rand(-60, 60);
  const rise = rand(6000 / speedFactor, 11000 / speedFactor);
  const floatD = rand(2000, 4000);
  return {
    id: nextId(),
    x: rand(size, window.innerWidth - size),
    y: window.innerHeight + size,
    size,
    color: `hsl(${hue}, 80%, 70%)`,
    colorDark: `hsl(${hue}, 70%, 50%)`,
    sway,
    rise,
    floatD,
    born: Date.now(),
  };
}

export default function App() {
  const [lang, setLang] = useLocalStorage(
    STORAGE_KEYS.lang,
    defaultHebrew ? "he" : "en",
    LANGUAGE_IDS,
  );
  const isHebrewUI = lang === "he";
  const ui = UI_TEXT[lang];
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
    "classic",
    GAME_MODE_IDS,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSettingsHint, setShowSettingsHint] = useState(false);

  // Shared sparkle emojis for balloons / targets
  const [emojis, setEmojis] = useState([]);

  // Balloon mode state
  const [balloons, setBalloons] = useState([]);
  const [balloonHint, setBalloonHint] = useState(false);
  const [popCount, setPopCount] = useState(0);
  const [balloonMissed, setBalloonMissed] = useState(0);
  const [balloonLevel, setBalloonLevel] = useState(1);
  const [balloonLevelUp, setBalloonLevelUp] = useState(null);
  const balloonLevelRef = useRef(1);
  const balloonsRef = useRef([]);
  const [balloonSavedLevel, setBalloonSavedLevel] = useLocalStorage(
    STORAGE_KEYS.balloonLevel,
    1,
    isBalloonLevel,
  );
  const [targetHighScore, setTargetHighScore] = useLocalStorage(
    STORAGE_KEYS.targetHighScore,
    0,
    isNonNegativeInteger,
  );

  // Target mode state
  const [targets, setTargets] = useState([]);
  const [targetScore, setTargetScore] = useState(0);
  const [targetMissed, setTargetMissed] = useState(0);
  const targetsRef = useRef([]);

  const containerRef = useRef(null);
  const holdStartRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const vibrateRef = useRef(true);
  const muteRef = useRef(false);
  const balloonTimerRef = useRef(null);
  const lastBalloonPopRef = useRef(Date.now());
  const gameModeRef = useRef("classic");
  const settingsRef = useRef(null);
  const targetScoreRef = useRef(0);

  useEffect(() => {
    vibrateRef.current = vibrateOn;
  }, [vibrateOn]);
  useEffect(() => {
    muteRef.current = muteOn;
    setGlobalMute(muteOn);
  }, [muteOn]);
  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);
  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);
  useEffect(() => {
    targetScoreRef.current = targetScore;
  }, [targetScore]);

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

  const vibrate = useCallback((pattern) => {
    if (!vibrateRef.current) return;
    if (canVibrate) navigator.vibrate(pattern);
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ type: "vibrate", pattern }),
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

  useEffect(() => {
    balloonsRef.current = balloons;
  }, [balloons]);

  useEffect(() => {
    if (gameMode !== "balloons") return;
    const newLevel = getBalloonLevelNumber(popCount);
    if (newLevel > balloonLevelRef.current) {
      balloonLevelRef.current = newLevel;
      setBalloonLevel(newLevel);
      setBalloonSavedLevel(newLevel);
      setBalloonLevelUp({ level: newLevel });
      vibrate([60, 30, 80]);
      setTimeout(() => setBalloonLevelUp(null), 2000);
    }
  }, [popCount, gameMode, vibrate, setBalloonSavedLevel]);

  useEffect(() => {
    if (!isFullscreen || gameMode !== "balloons") {
      clearInterval(balloonTimerRef.current);
      setBalloons([]);
      setBalloonMissed(0);
      const savedLvl = balloonLevelRef.current;
      if (savedLvl > 1) setBalloonSavedLevel(savedLvl);
      setPopCount(0);
      setBalloonLevel(1);
      balloonLevelRef.current = 1;
      return;
    }
    if (balloonLevel === 1 && balloonSavedLevel > 1) {
      const restoredPops = (balloonSavedLevel - 1) * BALLOON_LEVEL_STEP;
      setPopCount(restoredPops);
      setBalloonLevel(balloonSavedLevel);
      balloonLevelRef.current = balloonSavedLevel;
    }
    const cfg = getBalloonConfigByLevel(balloonLevel);
    const speed = cfg.speedFactor;
    const interval = cfg.spawnIntervalMs;
    const maxOnScreen = cfg.maxOnScreen;

    setBalloons([makeBalloon(speed), makeBalloon(speed), makeBalloon(speed)]);
    clearInterval(balloonTimerRef.current);
    balloonTimerRef.current = setInterval(() => {
      setBalloons((prev) => {
        if (prev.length >= maxOnScreen) return prev;
        return [...prev, makeBalloon(speed)];
      });
    }, interval);
    return () => clearInterval(balloonTimerRef.current);
  }, [isFullscreen, gameMode, balloonLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameMode !== "balloons") return;
    const tick = setInterval(() => {
      const now = Date.now();
      setBalloons((prev) => {
        const expired = prev.filter((b) => now - b.born >= b.rise + 200);
        if (expired.length) setBalloonMissed((m) => m + expired.length);
        return prev.filter((b) => now - b.born < b.rise + 200);
      });
    }, 500);
    return () => clearInterval(tick);
  }, [gameMode]);

  useEffect(() => {
    if (gameMode !== "balloons" || !isFullscreen) {
      setBalloonHint(false);
      return;
    }
    const check = setInterval(() => {
      if (Date.now() - lastBalloonPopRef.current > 5000) {
        setBalloonHint(true);
      } else {
        setBalloonHint(false);
      }
    }, 500);
    return () => clearInterval(check);
  }, [gameMode, isFullscreen]);

  const spawnTarget = useCallback(() => {
    const score = targetScoreRef.current;
    const cfg = getTargetLevelConfig(score);
    const duration = cfg.durationMs;
    const maxTargets = cfg.maxTargets;
    if (targetsRef.current.length >= maxTargets) return;

    const size = randInt(cfg.minSize, cfg.maxSize + 1);
    const x = rand(80 + size / 2, window.innerWidth - 80 - size / 2);
    const y = rand(80 + size / 2, window.innerHeight - 80 - size / 2);
    const emoji = activeEmojis[randInt(0, activeEmojis.length)];
    const hue = randInt(0, 360);
    const id = nextId();

    const removeTimer = setTimeout(() => {
      setTargets((prev) => {
        const still = prev.find((t) => t.id === id && !t.popped);
        if (!still) return prev;
        setTargetMissed((m) => m + 1);
        return prev.filter((t) => t.id !== id);
      });
      setTimeout(() => {
        if (gameModeRef.current === "targets") spawnTarget();
      }, 800);
    }, duration);

    const target = {
      id,
      x,
      y,
      size,
      emoji,
      hue,
      duration,
      removeTimer,
      popped: false,
    };
    setTargets((prev) => [...prev, target]);
  }, [activeEmojis]);

  useEffect(() => {
    if (!isFullscreen || gameMode !== "targets") {
      targetsRef.current.forEach((t) => clearTimeout(t.removeTimer));
      setTargets([]);
      setTargetScore(0);
      setTargetMissed(0);
      return;
    }
    spawnTarget();
    spawnTarget();
    return () => {
      targetsRef.current.forEach((t) => clearTimeout(t.removeTimer));
    };
  }, [isFullscreen, gameMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTargetTap = useCallback(
    (target, e) => {
      e.stopPropagation();
      e.preventDefault();
      if (target.popped) return;

      clearTimeout(target.removeTimer);
      setTargets((prev) =>
        prev.map((t) => (t.id === target.id ? { ...t, popped: true } : t)),
      );

      setTargetScore((s) => {
        const next = s + 1;
        setTargetHighScore((hs) => Math.max(hs, next));
        return next;
      });

      playSound("number");
      vibrate([20]);

      const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const cy = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const sparkles = ["✨", "🌟", "💫", "⭐", "🎉"];
      const newEmojis = Array.from({ length: 5 }, () => {
        const id = nextId();
        const emoji = sparkles[randInt(0, sparkles.length)];
        const size = randInt(24, 44);
        const angle = rand(0, Math.PI * 2);
        const distance = rand(40, 110);
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance - rand(30, 60);
        const rotation = rand(-180, 180);
        const duration = rand(500, 800);
        setTimeout(
          () => setEmojis((prev) => prev.filter((e) => e.id !== id)),
          duration,
        );
        return { id, emoji, x: cx, y: cy, size, dx, dy, rotation, duration };
      });
      setEmojis((prev) => [...prev, ...newEmojis]);

      setTimeout(() => {
        setTargets((prev) => prev.filter((t) => t.id !== target.id));
        setTimeout(() => {
          if (gameModeRef.current === "targets") spawnTarget();
        }, 800);
      }, 280);
    },
    [vibrate, spawnTarget, setTargetHighScore],
  );

  const popBalloon = useCallback(
    (balloon, clientX, clientY) => {
      setBalloons((prev) => prev.filter((b) => b.id !== balloon.id));
      setPopCount((c) => c + 1);
      lastBalloonPopRef.current = Date.now();
      setBalloonHint(false);
      playBalloonPop();
      vibrate([25]);

      const sparkles = ["✨", "🌟", "💫", "⭐", "🎉", "💥"];
      const count = randInt(3, 6);
      const newEmojis = Array.from({ length: count }, () => {
        const id = nextId();
        const emoji = sparkles[randInt(0, sparkles.length)];
        const size = randInt(28, 50);
        const angle = rand(0, Math.PI * 2);
        const distance = rand(40, 120);
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance - rand(30, 70);
        const rotation = rand(-180, 180);
        const duration = rand(500, 800);
        setTimeout(
          () => setEmojis((prev) => prev.filter((e) => e.id !== id)),
          duration,
        );
        return {
          id,
          emoji,
          x: clientX,
          y: clientY,
          size,
          dx,
          dy,
          rotation,
          duration,
        };
      });
      setEmojis((prev) => [...prev, ...newEmojis]);
    },
    [vibrate],
  );

  const handleBalloonDirectTap = useCallback(
    (balloon, e) => {
      e.preventDefault();
      e.stopPropagation();
      const point = e.touches?.[0] || e.changedTouches?.[0] || e;
      popBalloon(balloon, point.clientX, point.clientY);
    },
    [popBalloon],
  );

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
              {activeTheme.heroRow || ui.emojiRow}
            </div>
            <h1 className="start-title">{ui.title}</h1>
            <p className="start-subtitle">
              {ui.subtitle.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
            </p>
            <button className="start-btn" onClick={enterFullscreen}>
              {ui.btn}
            </button>
            <p className="start-hint">{ui.hint}</p>
            <a
              className="start-privacy-link"
              href="#privacy-policy"
              rel="noopener noreferrer"
            >
              {isHebrewUI ? "פרטיות" : "Privacy Policy"}
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
                {isHebrewUI ? "← הגדרות ומצבים" : "Settings & modes →"}
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
              comboLabels={{ ultra: ui.ultra, fire: ui.fire }}
            />
          )}

          {gameMode === "balloons" && (
            <>
              <div className="balloon-counter">
                🎈 {popCount} &nbsp;|&nbsp; 💨 {balloonMissed}
                &nbsp;|&nbsp;
                <span className="balloon-level-badge">
                  {"⚡".repeat(Math.min(balloonLevel, 5))}{" "}
                  {isHebrewUI ? `רמה ${balloonLevel}` : `Lv ${balloonLevel}`}
                </span>
              </div>

              {balloonLevelUp && (
                <div className="balloon-levelup">
                  {"🚀"}
                  <br />
                  {isHebrewUI
                    ? `רמה ${balloonLevelUp.level}!`
                    : `Level ${balloonLevelUp.level}!`}
                </div>
              )}

              {balloonHint && (
                <div className="balloon-hint">
                  {isHebrewUI ? "! פוצצו את הבלונים" : "tap the balloons!"}
                </div>
              )}

              {balloons.map((b) => (
                <div
                  key={b.id}
                  className="balloon"
                  onTouchStart={(e) => handleBalloonDirectTap(b, e)}
                  onMouseDown={
                    IS_TOUCH
                      ? undefined
                      : (e) => handleBalloonDirectTap(b, e)
                  }
                  style={{
                    left: b.x,
                    top: b.y,
                    width: b.size,
                    height: b.size * 1.15,
                    background: `radial-gradient(circle at 35% 30%, white 0%, ${b.color} 40%, ${b.colorDark} 100%)`,
                    "--rise": `${b.rise}ms`,
                    "--dur": `${b.floatD}ms`,
                    "--sway": `${b.sway}px`,
                  }}
                />
              ))}
            </>
          )}

          {gameMode === "drums" && <DrumsGame vibrateOn={vibrateOn} />}

          {gameMode === "targets" && (
            <>
              <div className="target-score">
                🎯 {targetScore} &nbsp;|&nbsp; 💨 {targetMissed}
                {targetHighScore > 0 && (
                  <span className="target-highscore">
                    {" "}
                    &nbsp;|&nbsp; 🏆 {targetHighScore}
                  </span>
                )}
              </div>

              {targets.map((target) => {
                const circumference =
                  2 * Math.PI * ((target.size + 10) / 2 - 4);
                return (
                  <div
                    key={target.id}
                    className={`target${target.popped ? " target-pop" : ""}`}
                    style={{
                      left: target.x,
                      top: target.y,
                      width: target.size,
                      height: target.size,
                      fontSize: Math.round(target.size * 0.65),
                      background: `radial-gradient(circle at 35% 30%, hsl(${target.hue},100%,85%) 0%, hsl(${target.hue},80%,60%) 50%, hsl(${target.hue},70%,40%) 100%)`,
                      boxShadow: `0 4px 20px hsl(${target.hue},70%,50%,0.6)`,
                    }}
                    onTouchEnd={
                      IS_TOUCH
                        ? (e) => handleTargetTap(target, e)
                        : undefined
                    }
                    onMouseUp={
                      IS_TOUCH
                        ? undefined
                        : (e) => handleTargetTap(target, e)
                    }
                  >
                    {target.emoji}
                    {!target.popped && (
                      <svg
                        className="target-ring"
                        viewBox={`0 0 ${target.size + 10} ${target.size + 10}`}
                        style={{
                          width: target.size + 10,
                          height: target.size + 10,
                        }}
                      >
                        <circle
                          cx={(target.size + 10) / 2}
                          cy={(target.size + 10) / 2}
                          r={(target.size + 10) / 2 - 4}
                          fill="none"
                          stroke="rgba(255,255,255,0.9)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${circumference} ${circumference}`}
                          strokeDashoffset="0"
                          transform={`rotate(-90 ${(target.size + 10) / 2} ${(target.size + 10) / 2})`}
                          style={{
                            animation: `targetRingDrain ${target.duration}ms linear forwards`,
                            "--circ": circumference,
                          }}
                        />
                      </svg>
                    )}
                  </div>
                );
              })}
            </>
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

          {/* Shared sparkles for balloons / targets */}
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
