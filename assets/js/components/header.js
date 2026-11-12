import { esc } from '../util/dom.js';
import { fmtDateLong, plural } from '../util/format.js';
import { getTheme, nextTheme, setTheme } from '../util/theme.js';
import { icon } from './icons.js';

export const REPO_URL = 'https://github.com/zlepkowski/Point-Scanner';

export const NAV = [
  { path: '/search', label: 'Search' },
  { path: '/explore', label: 'Explore' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/wallet', label: 'Wallet' },
  { path: '/saved', label: 'Saved' },
  { path: '/programs', label: 'Programs' },
  { path: '/about', label: 'About' },
];

const LOGO = `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false">
  <rect width="32" height="32" rx="8" fill="rgb(37 99 235)"/>
  <path d="M7 25a18 18 0 0 1 18-18" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>
  <path d="M12 25a13 13 0 0 1 13-13" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="M17 25a8 8 0 0 1 8-8" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <circle cx="24.5" cy="24.5" r="2.6" fill="#fbbf24"/>
</svg>`;

const GITHUB = `<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`;

const THEME_LABEL = { system: 'System', light: 'Light', dark: 'Dark' };

function navLinks(className) {
  return NAV.map(
    (n) => `<a href="#${n.path}" data-nav="${n.path}" class="${className}">${esc(n.label)}${
      n.path === '/saved' ? '<span data-saved-badge class="badge badge-brand ml-1.5 hidden" aria-hidden="true"></span>' : ''
    }</a>`,
  ).join('');
}

function themeButtonInner(theme, animate = false) {
  return `${icon(theme, { size: 18, className: animate ? 'icon-swap-in' : '' })}<span class="sr-only">Colour theme: ${THEME_LABEL[theme]}. Activate to change.</span>`;
}

export function renderHeader(el) {
  const desktopLink = 'rounded-lg px-3 py-2 text-ink-600 hover:bg-ink-100 hover:text-ink-900 aria-[current=page]:bg-brand-100 aria-[current=page]:text-brand-800 inline-flex items-center';
  const mobileLink = 'block rounded-lg px-3 py-2.5 text-ink-700 hover:bg-ink-100 aria-[current=page]:bg-brand-100 aria-[current=page]:text-brand-800';
  const theme = getTheme();
  el.innerHTML = `
    <a href="#main" class="skip-link" data-skip>Skip to content</a>
    <header class="site-header sticky top-0 z-30 border-b border-ink-200 bg-ink-0">
      <div class="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <a href="#/" class="flex items-center gap-2 rounded-lg font-semibold text-ink-900" aria-label="Pointscanner home">
          ${LOGO}<span class="text-[17px] tracking-tight">Pointscanner</span>
        </a>
        <nav aria-label="Main" class="ml-4 hidden items-center gap-0.5 text-sm font-medium lg:flex">${navLinks(desktopLink)}</nav>
        <div class="ml-auto flex items-center gap-1">
          <button type="button" class="btn btn-ghost btn-sm" data-theme-toggle title="Theme: ${THEME_LABEL[theme]}">${themeButtonInner(theme)}</button>
          <a href="${REPO_URL}" class="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer">${GITHUB}<span class="sr-only">Source code on GitHub (opens in new tab)</span></a>
          <button type="button" class="btn btn-sm lg:hidden" data-menu-toggle aria-expanded="false" aria-controls="mobile-nav">${icon('menu')}Menu</button>
        </div>
      </div>
      <nav id="mobile-nav" aria-label="Main" class="mobile-nav px-4 py-2 text-sm font-medium lg:hidden" data-open="false">${navLinks(mobileLink)}</nav>
    </header>`;

  const menuBtn = el.querySelector('[data-menu-toggle]');
  const mobileNav = el.querySelector('#mobile-nav');
  const setMenu = (open, { returnFocus = false } = {}) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    mobileNav.dataset.open = String(open);
    if (!open && returnFocus) menuBtn.focus();
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  mobileNav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.dataset.open === 'true') setMenu(false, { returnFocus: true });
  });
  document.addEventListener('click', (e) => {
    if (mobileNav.dataset.open === 'true' && !el.contains(e.target)) setMenu(false);
  });

  const themeBtn = el.querySelector('[data-theme-toggle]');
  const showTheme = (theme, animate) => {
    themeBtn.innerHTML = themeButtonInner(theme, animate);
    themeBtn.title = `Theme: ${THEME_LABEL[theme]}`;
  };
  themeBtn.addEventListener('click', () => {
    const next = nextTheme(getTheme());
    setTheme(next);
    showTheme(next, true);
  });
  document.addEventListener('pointscanner:theme-changed', () => showTheme(getTheme(), true));

  // Hash links to #main would be treated as routes, so move focus manually.
  el.querySelector('[data-skip]').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('main')?.focus();
  });
}

export function setActiveNav(el, path) {
  for (const link of el.querySelectorAll('[data-nav]')) {
    if (link.dataset.nav === path) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

export function setSavedBadge(el, count) {
  for (const badge of el.querySelectorAll('[data-saved-badge]')) {
    badge.textContent = count ? String(count) : '';
    badge.classList.toggle('hidden', !count);
  }
  for (const link of el.querySelectorAll('[data-nav="/saved"]')) {
    link.setAttribute('aria-label', count ? `Saved, ${count} route${count === 1 ? '' : 's'} with updates` : 'Saved');
  }
}

export function renderFooter(el, source, today) {
  const synthetic = source?.kind === 'synthetic';
  el.innerHTML = `
    <footer class="mt-16 border-t border-ink-200 bg-ink-0">
      <div class="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-ink-600 md:grid-cols-3">
        <div>
          <p class="font-semibold text-ink-900">Pointscanner</p>
          <p class="mt-1">Free, open-source award search. No account, no tracking, no ads.</p>
        </div>
        <div>
          <p class="font-semibold text-ink-900">Data</p>
          <p class="mt-1">${esc(source?.label ?? 'Loading…')} · ${plural(source?.count ?? 0, 'award')} · as of ${esc(fmtDateLong(today))}.</p>
          ${
            synthetic
              ? '<p class="mt-1"><span class="badge">Demo data</span> Generated, not real availability. Always confirm with the program before transferring points.</p>'
              : '<p class="mt-1">Loaded from your award file. Confirm with the program before transferring points.</p>'
          }
        </div>
        <div>
          <p class="font-semibold text-ink-900">Project</p>
          <ul class="mt-1 space-y-1">
            <li class="flex flex-wrap gap-x-4"><a class="link link-target" href="#/about">Methodology</a><a class="link link-target" href="#/privacy">Privacy</a><a class="link link-target" href="#/terms">Terms</a></li>
            <li><a class="link link-target" href="${REPO_URL}" target="_blank" rel="noopener noreferrer">Source on GitHub</a> · MIT license</li>
            <li>Not affiliated with any airline or loyalty program.</li>
            <li>Contact: [[TODO: contact email]]</li>
          </ul>
        </div>
      </div>
    </footer>`;
}
