import { useState, useEffect, useCallback, useRef } from "react";
import { IS_TOUCH, canVibrate } from "../../constants";
import { playBalloonPop } from "../../audio.js";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { STORAGE_KEYS } from "../../storage/keys.js";
import { rand, randInt, nextId } from "../../utils/random.js";
import { getT } from "../../i18n/index.js";
import {
  BALLOON_LEVEL_STEP,
  getBalloonLevelNumber,
  getBalloonConfigByLevel,
} from "./levels.js";
import "./BalloonsGame.css";

function vibrate(pattern, vibrateOn) {
  if (!vibrateOn) return;
  if (canVibrate) navigator.vibrate(pattern);
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({ type: "vibrate", pattern }),
  );
}

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

/**
 * Balloon pop mode – rising balloons, level progression, sparkles.
 */
export default function BalloonsGame({ lang = "he", vibrateOn = true }) {
  const t = getT(lang);

  const [balloons, setBalloons] = useState([]);
  const [balloonHint, setBalloonHint] = useState(false);
  const [popCount, setPopCount] = useState(0);
  const [balloonMissed, setBalloonMissed] = useState(0);
  const [balloonLevel, setBalloonLevel] = useState(1);
  const [balloonLevelUp, setBalloonLevelUp] = useState(null);
  const [emojis, setEmojis] = useState([]);

  const balloonLevelRef = useRef(1);
  const balloonsRef = useRef([]);
  const balloonTimerRef = useRef(null);
  const lastBalloonPopRef = useRef(Date.now());
  const vibrateOnRef = useRef(vibrateOn);

  const [balloonSavedLevel, setBalloonSavedLevel] = useLocalStorage(
    STORAGE_KEYS.balloonLevel,
    1,
  );

  useEffect(() => {
    vibrateOnRef.current = vibrateOn;
  }, [vibrateOn]);

  useEffect(() => {
    balloonsRef.current = balloons;
  }, [balloons]);

  const doVibrate = useCallback((pattern) => {
    vibrate(pattern, vibrateOnRef.current);
  }, []);

  // Persist current level on unmount
  useEffect(() => {
    return () => {
      const savedLvl = balloonLevelRef.current;
      if (savedLvl > 1) setBalloonSavedLevel(savedLvl);
    };
  }, [setBalloonSavedLevel]);

  useEffect(() => {
    const newLevel = getBalloonLevelNumber(popCount);
    if (newLevel > balloonLevelRef.current) {
      balloonLevelRef.current = newLevel;
      setBalloonLevel(newLevel);
      setBalloonSavedLevel(newLevel);
      setBalloonLevelUp({ level: newLevel });
      doVibrate([60, 30, 80]);
      setTimeout(() => setBalloonLevelUp(null), 2000);
    }
  }, [popCount, doVibrate, setBalloonSavedLevel]);

  useEffect(() => {
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
  }, [balloonLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now();
      setBalloons((prev) => {
        const expired = prev.filter((b) => now - b.born >= b.rise + 200);
        if (expired.length) setBalloonMissed((m) => m + expired.length);
        return prev.filter((b) => now - b.born < b.rise + 200);
      });
    }, 500);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const check = setInterval(() => {
      if (Date.now() - lastBalloonPopRef.current > 5000) {
        setBalloonHint(true);
      } else {
        setBalloonHint(false);
      }
    }, 500);
    return () => clearInterval(check);
  }, []);

  const popBalloon = useCallback(
    (balloon, clientX, clientY) => {
      setBalloons((prev) => prev.filter((b) => b.id !== balloon.id));
      setPopCount((c) => c + 1);
      lastBalloonPopRef.current = Date.now();
      setBalloonHint(false);
      playBalloonPop();
      doVibrate([25]);

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
    [doVibrate],
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

  return (
    <>
      <div className="balloon-counter">
        {t("balloons.counter", { pops: popCount, missed: balloonMissed })}
        &nbsp;|&nbsp;
        <span className="balloon-level-badge">
          {"⚡".repeat(Math.min(balloonLevel, 5))}{" "}
          {t("balloons.level", { level: balloonLevel })}
        </span>
      </div>

      {balloonLevelUp && (
        <div className="balloon-levelup">
          {"🚀"}
          <br />
          {t("balloons.levelUp", { level: balloonLevelUp.level })}
        </div>
      )}

      {balloonHint && (
        <div className="balloon-hint">{t("balloons.hint")}</div>
      )}

      {balloons.map((b) => (
        <div
          key={b.id}
          className="balloon"
          onTouchStart={(e) => handleBalloonDirectTap(b, e)}
          onMouseDown={
            IS_TOUCH ? undefined : (e) => handleBalloonDirectTap(b, e)
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
  );
}
