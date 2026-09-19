import { useSyncExternalStore } from "react";

function subscribe(onStoreChange) {
  document.addEventListener("visibilitychange", onStoreChange);
  return () => {
    document.removeEventListener("visibilitychange", onStoreChange);
  };
}

function getSnapshot() {
  return !document.hidden;
}

function getServerSnapshot() {
  return true;
}

/** True when the page is visible (not backgrounded / tab-hidden). */
export function usePageVisibility() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Toggle a document-level class used to pause CSS animations while hidden. */
export function syncVisibilityPauseClass(
  className = "app-visibility-paused",
) {
  const root = document.documentElement;
  if (document.hidden) root.classList.add(className);
  else root.classList.remove(className);
}
