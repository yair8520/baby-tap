import { useEffect, useState } from "react";

const initialViewport = () => ({
  width: typeof window === "undefined" ? 0 : window.innerWidth,
  height: typeof window === "undefined" ? 0 : window.innerHeight,
});

/**
 * Track a game container's actual size across resize and orientation changes.
 */
export function useResponsiveGameViewport(containerRef) {
  const [viewport, setViewport] = useState(initialViewport);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const next = {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
        setViewport((current) =>
          current.width === next.width && current.height === next.height
            ? current
            : next,
        );
      });
    };

    measure();
    const observer =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(measure)
        : null;
    observer?.observe(element);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [containerRef]);

  return viewport;
}
