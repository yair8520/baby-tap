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
  showLevel = DEFAULT_LEARNING_GAME_SHELL_PROPS.showLevel,
  totalLevels,
  maxUnlocked,
  onSelectLevel,
  onExit,
  levelDone = DEFAULT_LEARNING_GAME_SHELL_PROPS.levelDone,
  starCount = DEFAULT_LEARNING_GAME_SHELL_PROPS.starCount,
  maxStars = DEFAULT_LEARNING_GAME_SHELL_PROPS.maxStars,
  headerTrailing,
  onNextLevel,
  onReplay,
  isLastLevel = DEFAULT_LEARNING_GAME_SHELL_PROPS.isLastLevel,
  children,
}) {
  return (
    <>
      <ShellHeader
        levelNum={levelNum}
        showLevel={showLevel}
        starCount={starCount}
        maxStars={maxStars}
        trailing={headerTrailing}
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
          isLastLevel={isLastLevel}
          onNextLevel={onNextLevel}
          onReplay={onReplay}
        />
      )}
    </>
  );
}

export default LearningGameShell;
