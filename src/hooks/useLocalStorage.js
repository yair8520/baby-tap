import { useCallback, useEffect, useState } from "react";
import {
  isValidStoredValue,
  parseStoredValue,
} from "../storage/validation.js";
import { STORAGE_PREFIX, writeStored } from "../storage/storage.js";

/**
 * A useState-like hook that persists to localStorage, validates writes, and
 * stays in sync across tabs.
 *
 * @param {string} key          logical key; the `bt_` prefix is added for you
 * @param {*} defaultValue      used when nothing is stored or storage is unusable
 * @param {Function|Array|Set} [validator] predicate or allowed values
 */
export function useLocalStorage(key, defaultValue, validator) {
  const storageKey = `${STORAGE_PREFIX}${key}`;

  const [value, setStoredValue] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return parseStoredValue(stored, defaultValue, validator);
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (nextValue) => {
      setStoredValue((previousValue) => {
        const candidate =
          typeof nextValue === "function"
            ? nextValue(previousValue)
            : nextValue;
        return isValidStoredValue(candidate, validator)
          ? candidate
          : previousValue;
      });
    },
    [validator],
  );

  useEffect(() => {
    writeStored(key, value);
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== storageKey) return;
      setStoredValue(
        e.newValue === null
          ? defaultValue
          : parseStoredValue(e.newValue, defaultValue, validator),
      );
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // `defaultValue` / `validator` are only read when another tab clears storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  return [value, setValue];
}
