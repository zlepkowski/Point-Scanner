import { Router } from './util/router.js';
import { applyTheme, getTheme } from './util/theme.js';
import { mount } from './util/dom.js';
import { awardsOnRoute, getSource, getToday, loadAwards, onDataChange } from './data/store.js';
import { evaluateSaved } from './data/alerts.js';
import { renderFooter, renderHeader, setActiveNav, setSavedBadge } from './components/header.js';
import { ensureAirportDatalist } from './components/airportSelect.js';
import * as home from './pages/home.js';
import * as search from './pages/search.js';
import * as explore from './pages/explore.js';
import * as calendar from './pages/calendar.js';
import * as wallet from './pages/wallet.js';
import * as saved from './pages/saved.js';
import * as programs from './pages/programs.js';
import * as about from './pages/about.js';
import * as privacy from './pages/privacy.js';
import * as terms from './pages/terms.js';

const ROUTES = {
  '/': home,
  '/search': search,
  '/explore': explore,
  '/calendar': calendar,
  '/wallet': wallet,
  '/saved': saved,
  '/programs': programs,
  '/about': about,
  '/privacy': privacy,
  '/terms': terms,
};

const TITLES = {
  '/search': 'Search',
  '/explore': 'Explore',
  '/calendar': 'Calendar',
  '/wallet': 'Wallet',
  '/saved': 'Saved routes',
  '/programs': 'Programs',
  '/about': 'About',
  '/privacy': 'Privacy',
  '/terms': 'Terms of use',
};

const notFound = {
  render(root) {
    mount(
      root,
      `<div class="card mx-auto max-w-lg p-8 text-center">
        <h1 tabindex="-1" class="text-2xl font-bold text-ink-900">Page not found</h1>
        <p class="mt-2 text-ink-600">That link doesn't match any page.</p>
        <a class="btn btn-primary mt-4" href="#/">Go to the home page</a>
      </div>`,
    );
  },
};

// Read at load: the bundle's own <script> tag can point at an awards.json.
const configScript = document.querySelector('script[data-awards-url]');
const awardsUrl = configScript?.dataset.awardsUrl || null;

async function boot() {
  applyTheme(getTheme());
  const headerEl = document.getElementById('app-header');
  const footerEl = document.getElementById('app-footer');
  const main = document.getElementById('main');
  renderHeader(headerEl);

  await loadAwards({ url: awardsUrl, globalData: window.POINTSCANNER_AWARDS ?? null });
  const source = getSource();
  if (source.warnings.length) console.warn('[pointscanner] ' + source.warnings.join('\n'));

  ensureAirportDatalist();
  const refreshSavedBadge = () => {
    const changed = evaluateSaved(awardsOnRoute, getToday()).filter((e) => e.noteworthy).length;
    setSavedBadge(headerEl, changed);
  };

  let firstRender = true;
  const router = new Router(ROUTES, {
    notFound,
    onAfterRender(current, pathChanged) {
      setActiveNav(headerEl, current.path);
      document.title = TITLES[current.path] ? `${TITLES[current.path]} · Pointscanner` : 'Pointscanner · Free award flight search';
      if (pathChanged && !firstRender) {
        window.scrollTo(0, 0);
        main.querySelector('h1')?.focus({ preventScroll: true });
      }
      firstRender = false;
    },
  });

  renderFooter(footerEl, source, getToday());
  refreshSavedBadge();
  document.addEventListener('pointscanner:saved-changed', refreshSavedBadge);
  onDataChange(() => {
    renderFooter(footerEl, getSource(), getToday());
    refreshSavedBadge();
    router.render(false);
  });
  router.start(main);
}

boot().catch((err) => {
  console.error(err);
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `<div class="card mx-auto max-w-lg p-8 text-center"><h1 class="text-xl font-bold">Something went wrong</h1>
      <p class="mt-2">Pointscanner couldn't start. This is usually temporary.</p>
      <button type="button" class="btn btn-primary mt-4" onclick="location.reload()">Reload the page</button></div>`;
  }
});
