import { loadJson, saveJson } from './storage.js';

const KEY = 'pointscanner:theme';
export const THEMES = ['system', 'light', 'dark'];

let media = null;
let mediaListener = null;

export function getTheme() {
  const t = loadJson(KEY, 'system');
  return THEMES.includes(t) ? t : 'system';
}

// "system" is resolved here (and in the inline script in index.html) so the
// stylesheet only needs a single dark definition keyed on data-theme.
export function applyTheme(theme) {
  media ??= window.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
  if (media && mediaListener) media.removeEventListener('change', mediaListener);
  mediaListener = null;
  const resolve = () => (theme === 'system' ? (media?.matches ? 'dark' : 'light') : theme);
  document.documentElement.setAttribute('data-theme', resolve());
  if (theme === 'system' && media) {
    mediaListener = () => document.documentElement.setAttribute('data-theme', resolve());
    media.addEventListener('change', mediaListener);
  }
}

export function setTheme(theme) {
  saveJson(KEY, theme);
  applyTheme(theme);
}

export function nextTheme(theme) {
  return THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
}
