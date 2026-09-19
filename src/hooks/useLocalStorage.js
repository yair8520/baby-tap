import { useState, useEffect, useCallback } from "react";
import {
  isValidStoredValue,
  parseStoredValue,
} from "../storage/validation.js";

/**
 * A useState-like hook that persists to localStorage.
 * @param {string} key  - localStorage key (prefixed with "bt_")
 * @param {*} defaultValue - initial value if nothing stored
 * @param {Function|Array|Set} [validator] - predicate or allowed values
 */
export function useLocalStorage(key, defaultValue, validator) {
  const storageKey = `bt_${key}`;

  const [value, setStoredValue] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return parseStoredValue(stored, defaultValue, validator);
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback((nextValue) => {
    setStoredValue((previousValue) => {
      const candidate =
        typeof nextValue === "function"
          ? nextValue(previousValue)
          : nextValue;
      return isValidStoredValue(candidate, validator)
        ? candidate
        : previousValue;
    });
  }, [validator]);

  useEffect(() => {
    try {
      const serialized = JSON.stringify(value);
      // Skip no-op writes (avoids thrashing on mount when value matches storage)
      if (localStorage.getItem(storageKey) === serialized) return;
      localStorage.setItem(storageKey, serialized);
    } catch {
      // localStorage unavailable (private mode, quota exceeded)
    }
  }, [storageKey, value]);

  return [value, setValue];
}
