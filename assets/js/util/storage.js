// localStorage can be missing or throw (private windows, blocked site data),
// so every access degrades to "nothing saved" instead of breaking the page.
export function loadJson(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
