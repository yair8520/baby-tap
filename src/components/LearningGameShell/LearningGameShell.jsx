import { ShellHeader } from "./ShellHeader";
import { ShellComplete } from "./ShellComplete";
import { LevelDots } from "./LevelDots";
import { DEFAULT_LEARNING_GAME_SHELL_PROPS } from "./LearningGameShell.props.js";

/**
 * Shared chrome for every learning game: exit, stage badge, stars, stage strip
 * and the completion overlay. Language comes from `LangProvider`.
 */
export function LearningGameShell({
  levelNum = DEFAULT_LEARNING_GAME_SHELL_PROPS.levelNum,
  totalLevels,
  maxUnlocked,
  onSelectLevel,
  totalStars,
  onExit,
  levelDone = DEFAULT_LEARNING_GAME_SHELL_PROPS.levelDone,
  starCount = DEFAULT_LEARNING_GAME_SHELL_PROPS.starCount,
  maxStars = DEFAULT_LEARNING_GAME_SHELL_PROPS.maxStars,
  onNextLevel,
  onReplay,
  children,
}) {
  return (
    <>
      <ShellHeader
        levelNum={levelNum}
        starCount={starCount}
        maxStars={maxStars}
        onExit={onExit}
      />

      {children}

      {totalLevels > 1 && (
        <LevelDots
          total={totalLevels}
          currentIndex={levelNum - 1}
          maxUnlocked={maxUnlocked}
          onSelect={onSelectLevel}
        />
      )}

      {levelDone && (
        <ShellComplete
          starCount={starCount}
          maxStars={maxStars}
          totalStars={totalStars}
          onNextLevel={onNextLevel}
          onReplay={onReplay}
        />
      )}
    </>
  );
}
