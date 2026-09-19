import "./SleepScene.css";

const FALLING_STARS = [
  { emoji: "⭐", dx: -18 },
  { emoji: "🌟", dx: 22 },
  { emoji: "✨", dx: -14 },
  { emoji: "⭐", dx: 18 },
  { emoji: "🌟", dx: -10 },
];

const FALLING_SHEEP = [
  { emoji: "🐑", left: 18, delay: 0.8, dur: 12.5, dxMid: -12, dxEnd: -22, shuf: true },
  { emoji: "🐏", left: 42, delay: 3.4, dur: 13.5, dxMid: 10, dxEnd: 24, shuf: false },
  { emoji: "🐑", left: 64, delay: 6.2, dur: 12.8, dxMid: -8, dxEnd: -18, shuf: true },
  { emoji: "🐑", left: 82, delay: 9.1, dur: 14.2, dxMid: 14, dxEnd: 30, shuf: false },
];

/** Decorative night sky for sleep mode. */
export function SleepScene() {
  return (
    <>
      <div className="sleep-gradient" />
      <div className="sleep-moon" />
      <div className="sleep-stars" />
      <div className="sleep-falling-stars" aria-hidden="true">
        {FALLING_STARS.map((s, i) => {
          const left = 10 + i * 18;
          const delay = i * 2.6;
          const dur = 10.5 + (i % 3) * 1.6;
          return (
            <div
              key={i}
              className="sleep-falling-star"
              style={{
                left: `${left}%`,
                top: "-12%",
                animationDelay: `${delay}s`,
                animationDuration: `${dur}s`,
                "--dx-mid": `${s.dx * 0.5}vw`,
                "--dx-end": `${s.dx}vw`,
              }}
            >
              {s.emoji}
            </div>
          );
        })}
      </div>
      <div className="sleep-cloud sleep-cloud-1" />
      <div className="sleep-cloud sleep-cloud-2" />
      <div className="sleep-cloud sleep-cloud-3" />
      <div className="sleep-falling-sheep" aria-hidden="true">
        {FALLING_SHEEP.map((s, i) => (
          <div
            key={i}
            className={`sleep-falling-sheep-emoji${s.shuf ? " shuf" : ""}`}
            style={{
              left: `${s.left}%`,
              top: "-12%",
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
              "--dx-mid": `${s.dxMid}vw`,
              "--dx-end": `${s.dxEnd}vw`,
            }}
          >
            {s.emoji}
          </div>
        ))}
      </div>
    </>
  );
}
