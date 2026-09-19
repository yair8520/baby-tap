import { useCallback, useEffect, useRef, useState } from "react";
import { playSound } from "../../audio.js";
import { IS_TOUCH } from "../../constants";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { STORAGE_KEYS } from "../../storage/keys.js";
import { isNonNegativeInteger } from "../../storage/validation.js";
import { nextId, rand, randInt } from "../../utils/random.js";
import { getTargetLevelConfig } from "./levels.js";
import "./Targets.css";

/** @import { TargetsProps } from "./Targets.props.js" */

/**
 * Timed target tapping game.
 * @param {TargetsProps} props
 */
export function Targets({ activeEmojis, t, vibrate }) {
  const [targets, setTargets] = useState([]);
  const [targetScore, setTargetScore] = useState(0);
  const [targetMissed, setTargetMissed] = useState(0);
  const [emojis, setEmojis] = useState([]);
  const [targetHighScore, setTargetHighScore] = useLocalStorage(
    STORAGE_KEYS.targetHighScore,
    0,
    isNonNegativeInteger,
  );

  const targetsRef = useRef([]);
  const targetScoreRef = useRef(0);
  const spawnTargetRef = useRef(null);
  const timeoutIdsRef = useRef(new Set());

  const scheduleTimeout = useCallback((callback, delay) => {
    const id = setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      callback();
    }, delay);
    timeoutIdsRef.current.add(id);
    return id;
  }, []);

  const clearScheduledTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current.clear();
  }, []);

  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  useEffect(() => {
    targetScoreRef.current = targetScore;
  }, [targetScore]);

  const spawnTarget = useCallback(() => {
    const config = getTargetLevelConfig(targetScoreRef.current);
    if (targetsRef.current.length >= config.maxTargets) return;

    const size = randInt(config.minSize, config.maxSize + 1);
    const id = nextId();
    const removeTimer = scheduleTimeout(() => {
      setTargets((previous) => {
        const stillPresent = previous.find(
          (target) => target.id === id && !target.popped,
        );
        if (!stillPresent) return previous;
        setTargetMissed((missed) => missed + 1);
        return previous.filter((target) => target.id !== id);
      });
      scheduleTimeout(() => spawnTargetRef.current?.(), 800);
    }, config.durationMs);

    const target = {
      id,
      x: rand(
        80 + size / 2,
        window.innerWidth - 80 - size / 2,
      ),
      y: rand(
        80 + size / 2,
        window.innerHeight - 80 - size / 2,
      ),
      size,
      emoji: activeEmojis[randInt(0, activeEmojis.length)],
      hue: randInt(0, 360),
      duration: config.durationMs,
      removeTimer,
      popped: false,
    };
    setTargets((previous) => [...previous, target]);
  }, [activeEmojis, scheduleTimeout]);

  useEffect(() => {
    spawnTargetRef.current = spawnTarget;
  }, [spawnTarget]);

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    clearScheduledTimeouts();
    targetsRef.current.forEach((target) => clearTimeout(target.removeTimer));
    targetsRef.current = [];

    const initializeTimer = scheduleTimeout(() => {
      setTargets([]);
      spawnTarget();
      spawnTarget();
    }, 0);

    return () => {
      clearTimeout(initializeTimer);
      timeoutIds.delete(initializeTimer);
      clearScheduledTimeouts();
      targetsRef.current.forEach((target) => clearTimeout(target.removeTimer));
    };
  }, [clearScheduledTimeouts, scheduleTimeout, spawnTarget]);

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      targetsRef.current.forEach((target) =>
        clearTimeout(target.removeTimer),
      );
      timeoutIds.forEach(clearTimeout);
      timeoutIds.clear();
    };
  }, []);

  const handleTargetTap = useCallback(
    (target, event) => {
      event.stopPropagation();
      event.preventDefault();
      if (target.popped) return;

      clearTimeout(target.removeTimer);
      setTargets((previous) =>
        previous.map((item) =>
          item.id === target.id ? { ...item, popped: true } : item,
        ),
      );
      setTargetScore((score) => {
        const next = score + 1;
        setTargetHighScore((highScore) => Math.max(highScore, next));
        return next;
      });
      playSound("number");
      vibrate([20]);

      const point = event.changedTouches
        ? event.changedTouches[0]
        : event;
      const sparkles = ["✨", "🌟", "💫", "⭐", "🎉"];
      const newEmojis = Array.from({ length: 5 }, () => {
        const id = nextId();
        const duration = rand(500, 800);
        const angle = rand(0, Math.PI * 2);
        const distance = rand(40, 110);
        const item = {
          id,
          emoji: sparkles[randInt(0, sparkles.length)],
          x: point.clientX,
          y: point.clientY,
          size: randInt(24, 44),
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance - rand(30, 60),
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

      scheduleTimeout(() => {
        setTargets((previous) =>
          previous.filter((item) => item.id !== target.id),
        );
        scheduleTimeout(() => spawnTargetRef.current?.(), 800);
      }, 280);
    },
    [scheduleTimeout, setTargetHighScore, vibrate],
  );

  return (
    <>
      <div className="target-score">
        {t("targets.score", {
          score: targetScore,
          missed: targetMissed,
        })}
        {targetHighScore > 0 && (
          <span className="target-highscore">
            {" "}
            &nbsp;|&nbsp; 🏆 {targetHighScore}
          </span>
        )}
      </div>

      {targets.map((target) => {
        const ringSize = target.size + 10;
        const ringCenter = ringSize / 2;
        const ringRadius = ringCenter - 4;
        const circumference = 2 * Math.PI * ringRadius;

        return (
          <div
            key={target.id}
            className={`target${target.popped ? " target-pop" : ""}`}
            style={{
              "--target-left": `${target.x}px`,
              "--target-top": `${target.y}px`,
              "--target-size": `${target.size}px`,
              "--target-font-size": `${Math.round(target.size * 0.65)}px`,
              "--target-hue": target.hue,
              "--target-ring-size": `${ringSize}px`,
            }}
            onTouchEnd={
              IS_TOUCH
                ? (event) => handleTargetTap(target, event)
                : undefined
            }
            onMouseUp={
              IS_TOUCH
                ? undefined
                : (event) => handleTargetTap(target, event)
            }
          >
            {target.emoji}
            {!target.popped && (
              <svg
                className="target-ring"
                viewBox={`0 0 ${ringSize} ${ringSize}`}
              >
                <circle
                  cx={ringCenter}
                  cy={ringCenter}
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset="0"
                  transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
                  style={{
                    "--target-ring-duration": `${target.duration}ms`,
                    "--circ": circumference,
                  }}
                />
              </svg>
            )}
          </div>
        );
      })}

      {emojis.map((item) => (
        <div
          key={item.id}
          className="targets-emoji-item"
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
