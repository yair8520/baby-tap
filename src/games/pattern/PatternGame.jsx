import { useState, useRef, useEffect, useCallback } from 'react';
import { ShapeGeom } from '../../components/ShapeGeom';
import { LearningGameShell, starsFromMistakes } from '../../components/LearningGameShell';
import { PATTERN_LEVELS, buildLevel } from './levels.js';
import { useGameBestStars, useGameLevel } from '../../hooks/useGameProgress.js';
import './PatternGame.css';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatternGame({ onExit, lang = 'he', vibrateOn = true }) {
  const [levelIdx, setLevelIdx]   = useGameLevel('pattern', 0, {
    maxLevels: PATTERN_LEVELS.length,
  });
  const [pattern, setPattern]     = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [mistakes, setMistakes]   = useState(0);
  const [levelDone, setLevelDone] = useState(false);
  const [answered, setAnswered]   = useState(false);
  const [disabledIds, setDisabledIds] = useState(new Set());
  const [revealed, setRevealed]   = useState(false); // show answer in ? slot
  const [roundKey, setRoundKey]   = useState(0);
  const { recordStars, totalStars } = useGameBestStars(
    'pattern',
    PATTERN_LEVELS.length,
  );

  const levelDoneRef = useRef(false);
  const advanceTimer = useRef(null);
  const disableTimer = useRef(null);

  // ── Build level ──────────────────────────────────────────────────────────

  useEffect(() => {
    levelDoneRef.current = false;
    const data = buildLevel(levelIdx);
    setPattern(data);
    setSelectedId(null);
    setIsCorrect(null);
    setMistakes(0);
    setLevelDone(false);
    setAnswered(false);
    setDisabledIds(new Set());
    setRevealed(false);
  }, [levelIdx, roundKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(advanceTimer.current);
      clearTimeout(disableTimer.current);
    };
  }, []);

  // ── Handle choice tap ────────────────────────────────────────────────────

  const handleChoice = useCallback((choice) => {
    if (!pattern) return;
    if (answered) return;
    if (levelDoneRef.current) return;
    if (disabledIds.has(choice.id)) return;

    const correct = choice.shape === pattern.answer.shape && choice.colorId === pattern.answer.colorId;

    setSelectedId(choice.id);
    setIsCorrect(correct);

    if (correct) {
      if (vibrateOn) navigator.vibrate?.([40, 30, 80, 30, 120]);
      setAnswered(true);
      setRevealed(true);
      levelDoneRef.current = true;
      recordStars(levelIdx, starsFromMistakes(mistakes));

      advanceTimer.current = setTimeout(() => {
        setLevelDone(true);
      }, 1200);
    } else {
      if (vibrateOn) navigator.vibrate?.([80, 40, 80]);
      setMistakes(m => m + 1);

      // disable wrong choice for 1s
      setDisabledIds(prev => new Set([...prev, choice.id]));
      disableTimer.current = setTimeout(() => {
        setDisabledIds(prev => {
          const next = new Set(prev);
          next.delete(choice.id);
          return next;
        });
        setSelectedId(null);
        setIsCorrect(null);
      }, 1000);
    }
  }, [
    pattern,
    answered,
    disabledIds,
    levelIdx,
    mistakes,
    recordStars,
    vibrateOn,
  ]);

  if (!pattern) return null;

  const starCount = starsFromMistakes(mistakes);
  const levelNum  = levelIdx + 1;

  const { displayPattern, answer, choices } = pattern;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="pg-root">
      <div className="pg-bg">
        <div className="pg-blob pg-blob1" />
        <div className="pg-blob pg-blob2" />
        <div className="pg-blob pg-blob3" />
      </div>

      <LearningGameShell
        lang={lang}
        levelNum={levelNum}
        totalStars={totalStars}
        onExit={onExit}
        levelDone={levelDone}
        starCount={starCount}
        onNextLevel={() => setLevelIdx(p => p + 1)}
        onReplay={() => setRoundKey(key => key + 1)}
        isLastLevel={levelIdx === PATTERN_LEVELS.length - 1}
      >
        {/* Pattern display */}
        <div className="pg-content">
          <div className="pg-instruction">
            {lang === 'he' ? 'מה הבא בסדרה?' : 'What comes next?'}
          </div>

          <div className="pg-pattern-row">
            {displayPattern.map((item, i) => (
              <div key={i} className="pg-pattern-item" style={{ '--delay': `${i * 0.08}s` }}>
                <ShapeGeom shape={item.shape} size={75} fill={item.fill} stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
              </div>
            ))}

            {/* Question tile */}
            <div className={`pg-question-tile${revealed ? ' pg-question-revealed' : ''}`}>
              {revealed ? (
                <div className="pg-question-answer-shape">
                  <ShapeGeom shape={answer.shape} size={75} fill={answer.fill} stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
                </div>
              ) : (
                <span className="pg-question-mark">?</span>
              )}
            </div>
          </div>

          {/* Choices */}
          <div className="pg-choices-row">
            {choices.map((choice) => {
              const isSelected = selectedId === choice.id;
              const isWrongSelected = isSelected && isCorrect === false;
              const isRightSelected = isSelected && isCorrect === true;
              const isDisabled = disabledIds.has(choice.id);

              return (
                <button
                  key={choice.id}
                  className={[
                    'pg-choice',
                    isWrongSelected ? 'pg-choice-wrong'   : '',
                    isRightSelected ? 'pg-choice-correct' : '',
                    isDisabled      ? 'pg-choice-disabled': '',
                  ].join(' ')}
                  onPointerDown={() => handleChoice(choice)}
                  disabled={isDisabled || answered}
                >
                  <ShapeGeom shape={choice.shape} size={80} fill={choice.fill} stroke="rgba(255,255,255,0.45)" strokeWidth={3} />
                </button>
              );
            })}
          </div>
        </div>
      </LearningGameShell>
    </div>
  );
}
