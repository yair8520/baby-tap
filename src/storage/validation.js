/** Return whether a value is accepted by a validator or allowlist. */
export function isValidStoredValue(value, validator) {
  if (validator == null) return true;

  try {
    if (typeof validator === "function") return validator(value) === true;
    if (Array.isArray(validator)) return validator.includes(value);
    if (validator instanceof Set) return validator.has(value);
  } catch {
    return false;
  }

  return false;
}

/** Parse a stored JSON value, falling back when it is malformed or invalid. */
export function parseStoredValue(serialized, defaultValue, validator) {
  if (serialized === null) return defaultValue;

  try {
    const parsed = JSON.parse(serialized);
    return isValidStoredValue(parsed, validator) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}

export const isBoolean = (value) => typeof value === "boolean";

export const isNonNegativeInteger = (value) =>
  Number.isInteger(value) && value >= 0;
