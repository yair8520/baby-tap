import he from "./he.json";
import en from "./en.json";

const translations = { he, en };

/**
 * Returns the translation for a dot-notation key, e.g. "games.classic"
 * Supports {{variable}} interpolation.
 */
export function getT(lang) {
  const dict = translations[lang] ?? translations.en;

  return function t(key, vars = {}) {
    const parts = key.split(".");
    let val = dict;
    for (const part of parts) {
      if (val == null) break;
      val = val[part];
    }
    if (val == null) {
      // Fallback to English
      let fb = translations.en;
      for (const part of parts) {
        if (fb == null) break;
        fb = fb[part];
      }
      val = fb ?? key;
    }
    if (typeof val !== "string") return key;
    // Interpolate {{var}} placeholders
    return val.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      vars[k] !== undefined ? String(vars[k]) : `{{${k}}}`
    );
  };
}

/** Convenience: get all translations for a given lang */
export function getTranslations(lang) {
  return translations[lang] ?? translations.en;
}
