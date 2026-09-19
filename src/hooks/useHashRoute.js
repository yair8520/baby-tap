import { useEffect, useState } from "react";

/** Normalised route name from the URL, e.g. "#/privacy-policy" → "privacy-policy". */
export function readRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash) return hash;
  // Deep links from the store listing arrive as a real path on some hosts.
  const path = window.location.pathname.split("/").filter(Boolean).pop() ?? "";
  return path.includes("privacy-policy") ? "privacy-policy" : "";
}

/**
 * Hash routing, so GitHub Pages never 404s on a deep link. Unlike reading the
 * hash once at boot, this follows in-app navigation without a page reload.
 */
export function useHashRoute() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, []);

  return route;
}

/** Navigate without reloading the document. */
export function navigate(route) {
  window.location.hash = route ? `#/${route}` : "";
}
