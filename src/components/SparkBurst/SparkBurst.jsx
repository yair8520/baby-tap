import { useMemo } from "react";
import "./SparkBurst.css";

/**
 * Deterministic spark burst (no Math.random during render).
 */
export function SparkBurst({ x, y, color, count = 12, className = "spark-burst-dot" }) {
  const dots = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const dist = 45 + ((i * 17) % 35);
      const size = 6 + (i % 7);
      return {
        id: i,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size,
        delay: i * 0.02,
      };
    });
  }, [count]);

  return (
    <>
      {dots.map((d) => (
        <div
          key={d.id}
          className={className}
          style={{
            left: x,
            top: y,
            "--dx": `${d.dx}px`,
            "--dy": `${d.dy}px`,
            background: color,
            width: `${d.size}px`,
            height: `${d.size}px`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </>
  );
}
