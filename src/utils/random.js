/** Shared tiny RNG / id helpers used across game modes. */

export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export function randInt(min, maxExclusive) {
  return Math.floor(rand(min, maxExclusive));
}

let _id = 0;
export function nextId() {
  _id += 1;
  return _id;
}
