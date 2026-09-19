import { useCallback, useEffect, useRef, useState } from "react";
import { playBalloonPop } from "../../audio.js";
import { IS_TOUCH } from "../../constants.js";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { STORAGE_KEYS } from "../../storage/keys.js";
import { nextId, rand, randInt } from "../../utils/random.js";
import {
  BALLOON_LEVELS,
  BALLOON_LEVEL_STEP,
  getBalloonConfigByLevel,
  getBalloonLevelNumber,
} from "./levels.js";
import "./Balloons.css";

/** @import { BalloonsProps } from "./Balloons.props.js" */

const isBalloonLevel = (value) =>
  Number.isInteger(value) &&
  value >= 1 &&
  value <= BALLOON_LEVELS.length;

// speedFactor: 1 = normal, 2 = twice as fast, etc.
function makeBalloon(speedFactor = 1) {
  const size = randInt(65, 106);
  const hue = randInt(0, 360);

  return {
    id: nextId(),
    x: rand(size, window.innerWidth - size),
    y: window.innerHeight + size,
    size,
    color: `hsl(${hue}, 80%, 70%)`,
    colorDark: `hsl(${hue}, 70%, 50%)`,
    sway: rand(-60, 60),
    rise: rand(6000 / speedFactor, 11000 / speedFactor),
    floatD: rand(2000, 4000),
    born: Date.now(),
  };
}

/**
 * Balloon popping game.
 * @param {BalloonsProps} props
 */
export function Balloons({ t, vibrate }) {
  const [balloonSavedLevel, setBalloonSavedLevel] = useLocalStorage(
    STORAGE_KEYS.balloonLevel,
    1,
    isBalloonLevel,
  );
  const [balloons, setBalloons] = useState([]);
  const [balloonHint, setBalloonHint] = useState(false);
  const [popCount, setPopCount] = useState(
    () => (balloonSavedLevel - 1) * BALLOON_LEVEL_STEP,
  );
  const [balloonMissed, setBalloonMissed] = useState(0);
  const [balloonLevel, setBalloonLevel] = useState(balloonSavedLevel);
  const [balloonLevelUp, setBalloonLevelUp] = useState(null);
  const [emojis, setEmojis] = useState([]);

  const balloonLevelRef = useRef(balloonSavedLevel);
  const balloonTimerRef = useRef(null);
  const lastBalloonPopRef = useRef(0);
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
    const newLevel = getBalloonLevelNumber(popCount);
    if (newLevel <= balloonLevelRef.current) return;

    const levelTimer = scheduleTimeout(() => {
      balloonLevelRef.current = newLevel;
      setBalloonLevel(newLevel);
      setBalloonSavedLevel(newLevel);
      setBalloonLevelUp({ level: newLevel });
      vibrate([60, 30, 80]);
      scheduleTimeout(() => setBalloonLevelUp(null), 2000);
    }, 0);

    return () => clearTimeout(levelTimer);
  }, [popCount, scheduleTimeout, setBalloonSavedLevel, vibrate]);

  useEffect(() => {
    const initializeTimer = scheduleTimeout(() => {
      const config = getBalloonConfigByLevel(balloonLevel);
      setBalloons([
        makeBalloon(config.speedFactor),
        makeBalloon(config.speedFactor),
        makeBalloon(config.speedFactor),
      ]);
      clearInterval(balloonTimerRef.current);
      balloonTimerRef.current = setInterval(() => {
        setBalloons((previous) => {
          if (previous.length >= config.maxOnScreen) return previous;
          return [...previous, makeBalloon(config.speedFactor)];
        });
      }, config.spawnIntervalMs);
    }, 0);

    return () => {
      clearTimeout(initializeTimer);
      clearInterval(balloonTimerRef.current);
    };
  }, [balloonLevel, scheduleTimeout]);

  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now();
      setBalloons((previous) => {
        const expired = previous.filter(
          (balloon) => now - balloon.born >= balloon.rise + 200,
        );
        if (expired.length) {
          setBalloonMissed((missed) => missed + expired.length);
        }
        return previous.filter(
          (balloon) => now - balloon.born < balloon.rise + 200,
        );
      });
    }, 500);

    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    lastBalloonPopRef.current = Date.now();
    const check = setInterval(() => {
      setBalloonHint(Date.now() - lastBalloonPopRef.current > 5000);
    }, 500);

    return () => clearInterval(check);
  }, []);

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      clearInterval(balloonTimerRef.current);
      timeoutIds.forEach(clearTimeout);
      timeoutIds.clear();
    };
  }, []);

  const popBalloon = useCallback(
    (balloon, clientX, clientY) => {
      setBalloons((previous) =>
        previous.filter((item) => item.id !== balloon.id),
      );
      setPopCount((count) => count + 1);
      lastBalloonPopRef.current = Date.now();
      setBalloonHint(false);
      playBalloonPop();
      vibrate([25]);

      const sparkles = ["✨", "🌟", "💫", "⭐", "🎉", "💥"];
      const count = randInt(3, 6);
      const newEmojis = Array.from({ length: count }, () => {
        const id = nextId();
        const duration = rand(500, 800);
        const angle = rand(0, Math.PI * 2);
        const distance = rand(40, 120);
        const item = {
          id,
          emoji: sparkles[randInt(0, sparkles.length)],
          x: clientX,
          y: clientY,
          size: randInt(28, 50),
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance - rand(30, 70),
          rotation: rand(-180, 180),
          duration,
        };
        scheduleTimeout(
          () =>
            setEmojis((previous) =>
              previous.filter((emoji) => emoji.id !== id),
            ),
          duration,
        );
        return item;
      });
      setEmojis((previous) => [...previous, ...newEmojis]);
    },
    [scheduleTimeout, vibrate],
  );

  const handleBalloonDirectTap = useCallback(
    (balloon, event) => {
      event.preventDefault();
      event.stopPropagation();
      const point =
        event.touches?.[0] || event.changedTouches?.[0] || event;
      popBalloon(balloon, point.clientX, point.clientY);
    },
    [popBalloon],
  );

  return (
    <>
      <div className="balloon-counter">
        {t("balloons.counter", { pops: popCount, missed: balloonMissed })}
        {" | "}
        <span className="balloon-level-badge">
          {"⚡".repeat(Math.min(balloonLevel, 5))}{" "}
          {t("balloons.level", { level: balloonLevel })}
        </span>
      </div>

      {balloonLevelUp && (
        <div className="balloon-levelup" role="status" aria-live="polite">
          🚀
          <br />
          {t("balloons.levelUp", { level: balloonLevelUp.level })}
        </div>
      )}

      {balloonHint && (
        <div className="balloon-hint" role="status" aria-live="polite">
          {t("balloons.hint")}
        </div>
      )}

      {balloons.map((balloon) => (
        <div
          key={balloon.id}
          className="balloon"
          onTouchStart={(event) =>
            handleBalloonDirectTap(balloon, event)
          }
          onMouseDown={
            IS_TOUCH
              ? undefined
              : (event) => handleBalloonDirectTap(balloon, event)
          }
          style={{
            "--balloon-left": `${balloon.x}px`,
            "--balloon-top": `${balloon.y}px`,
            "--balloon-size": `${balloon.size}px`,
            "--balloon-color": balloon.color,
            "--balloon-color-dark": balloon.colorDark,
            "--rise": `${balloon.rise}ms`,
            "--sway": `${balloon.sway}px`,
          }}
        />
      ))}

      {emojis.map((item) => (
        <div
          key={item.id}
          className="balloons-emoji-item"
          style={{
            "--emoji-left": `${item.x}px`,
            "--emoji-top": `${item.y}px`,
            "--emoji-size": `${item.size}px`,
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
