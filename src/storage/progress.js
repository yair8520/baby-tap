import { PROGRESS_KEYS } from "./keys.js";

/** Return the complete, prefixed set of localStorage progress keys to remove. */
export function getProgressStorageKeys(prefix = "bt_") {
  return PROGRESS_KEYS.map((key) => `${prefix}${key}`);
}

/**
 * Remove only gameplay progress. Language, theme, audio and other preferences
 * are preserved because they are not part of PROGRESS_KEYS.
 */
export function clearStoredProgress(storage) {
  for (const key of getProgressStorageKeys()) {
    try {
      storage.removeItem(key);
    } catch {
      // Storage can be unavailable in private mode; in-memory reset still runs.
    }
  }
}
