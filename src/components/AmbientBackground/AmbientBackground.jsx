/**
 * Menu / classic-play ambience. Heavy blur+animation layers; keep off when a
 * game paints its own opaque background.
 */
export function AmbientBackground({ mode = "full", symbols = [] }) {
  if (mode === "off") return null;

  const lite = mode === "lite";
  const blobCount = lite ? 2 : 4;
  const bubbleCount = lite ? 0 : 12;
  const symbolCount = lite ? 6 : 10;

  return (
    <>
      <div className={`bg-aurora${lite ? " bg-aurora--lite" : ""}`}>
        {Array.from({ length: blobCount }, (_, i) => (
          <div
            key={i}
            className={`aurora-blob aurora-blob-${i + 1}`}
          />
        ))}
      </div>
      <div className="bg-stars" />
      {bubbleCount > 0 && (
        <div className="bg-bubbles">
          {Array.from({ length: bubbleCount }, (_, i) => (
            <div
              key={i}
              className={`bubble bubble-${(i % 4) + 1}`}
              style={{
                left: `${(i * 8.2 + 2) % 100}%`,
                width: `${20 + ((i * 19) % 70)}px`,
                height: `${20 + ((i * 19) % 70)}px`,
                animationDuration: `${13 + ((i * 1.9) % 10)}s`,
                animationDelay: `-${(i * 2.8) % 16}s`,
              }}
            />
          ))}
        </div>
      )}
      {symbolCount > 0 && symbols.length > 0 && (
        <div className="theme-symbols">
          {Array.from({ length: symbolCount }, (_, i) => {
            const sym = symbols[i % symbols.length];
            return (
              <span
                key={`${i}-${sym}`}
                className="theme-symbol"
                style={{
                  left: `${(i * 9.1 + 3) % 100}%`,
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
      )}
    </>
  );
}
