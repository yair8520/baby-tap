import { useEffect, useState } from "react";

const QUERY = "(pointer: coarse), (max-width: 900px)";

function matchesPerformanceLite() {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}

/** Prefer cheaper visual effects on phones and touch-first tablets. */
export function usePerformanceLite() {
  const [performanceLite, setPerformanceLite] = useState(matchesPerformanceLite);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const update = () => setPerformanceLite(media.matches);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return performanceLite;
}
