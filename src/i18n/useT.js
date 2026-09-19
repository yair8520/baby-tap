import { useContext } from "react";
import { LangContext } from "./LangContext.js";

/** Full language bundle: `{ lang, dir, isRtl, t, localize }`. */
export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error("useLang must be used inside <LangProvider>");
  }
  return ctx;
}

/** Shorthand for the translate function. */
export function useT() {
  return useLang().t;
}
