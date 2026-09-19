import { useEffect, useMemo } from "react";
import { LangContext } from "./LangContext.js";
import { getT, localize, dirFor, isRtl } from "./translate.js";

/**
 * Provides the active language to the tree and keeps <html lang/dir> in sync so
 * RTL and screen readers follow the in-app language toggle.
 */
export function LangProvider({ lang, children }) {
  const value = useMemo(() => {
    const t = getT(lang);
    return {
      lang,
      dir: dirFor(lang),
      isRtl: isRtl(lang),
      t,
      localize: (v) => localize(v, lang),
    };
  }, [lang]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", dirFor(lang));
  }, [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
