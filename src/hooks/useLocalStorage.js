import { useCallback, useEffect, useState } from "react";
import { STORAGE_PREFIX, readStored, writeStored } from "../storage/index.js";

/**
 * A useState-like hook that persists to localStorage and stays in sync across
 * tabs (two open copies of the app share one set of settings).
 *
 * @param {string} key          logical key; the `bt_` prefix is added for you
 * @param {*} defaultValue      used when nothing is stored or storage is unusable
 */
export function useLocalStorage(key, defaultValue) {
  const storageKey = `${STORAGE_PREFIX}${key}`;

  const [value, setValue] = useState(() => readStored(key, defaultValue));

  useEffect(() => {
    writeStored(key, value);
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== storageKey) return;
      setValue(e.newValue === null ? defaultValue : safeParse(e.newValue, defaultValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // `defaultValue` is only read when storage is cleared elsewhere; re-subscribing
    // on every render because a caller passed an inline object would be worse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const set = useCallback((next) => setValue(next), []);

  return [value, set];
}

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
