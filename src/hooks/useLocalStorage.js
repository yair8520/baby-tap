import { useState, useEffect } from "react";

/**
 * A useState-like hook that persists to localStorage.
 * @param {string} key  - localStorage key (prefixed with "bt_")
 * @param {*} defaultValue - initial value if nothing stored
 */
export function useLocalStorage(key, defaultValue) {
  const storageKey = `bt_${key}`;

  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === null) return defaultValue;
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // localStorage unavailable (private mode, quota exceeded)
    }
  }, [storageKey, value]);

  return [value, setValue];
}
