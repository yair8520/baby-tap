import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { useCallback } from "react";

/**
 * Harden write path slightly: still fire-and-forget, but expose a reset helper.
 * Existing useLocalStorage remains the primitive; this is a thin progress facade.
 */
export function usePersistedNumber(key, defaultValue = 0) {
  const [value, setValue] = useLocalStorage(key, defaultValue);

  const bumpMax = useCallback(
    (next) => {
      setValue((prev) => Math.max(Number(prev) || 0, Number(next) || 0));
    },
    [setValue],
  );

  const reset = useCallback(() => setValue(defaultValue), [setValue, defaultValue]);

  return [value, setValue, { bumpMax, reset }];
}
