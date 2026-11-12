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

export const STORAGE_PREFIX = 'pointscanner:';

export function ownKeys(prefix = STORAGE_PREFIX) {
  try {
    const store = globalThis.localStorage;
    if (!store) return [];
    const keys = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key?.startsWith(prefix)) keys.push(key);
    }
    return keys.sort();
  } catch {
    return [];
  }
}

export function exportOwnData(prefix = STORAGE_PREFIX) {
  const out = {};
  for (const key of ownKeys(prefix)) out[key] = loadJson(key, null);
  return out;
}

export function clearOwnData(prefix = STORAGE_PREFIX) {
  const keys = ownKeys(prefix);
  try {
    for (const key of keys) globalThis.localStorage.removeItem(key);
  } catch {
    return 0;
  }
  return keys.length;
}
