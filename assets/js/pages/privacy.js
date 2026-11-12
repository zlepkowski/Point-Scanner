import { SAVED_KEY } from '../data/alerts.js';
import { WALLET_KEY } from '../data/wallet.js';
import { REPO_URL } from '../components/header.js';
import { announce, esc, mount, on } from '../util/dom.js';
import { STORAGE_PREFIX, clearOwnData, exportOwnData, ownKeys } from '../util/storage.js';
import { THEME_KEY, applyTheme } from '../util/theme.js';

export const PRIVACY_VERSION = '0.1 (draft), 12 November 2026';

// Every key the app writes. Keep in sync with util/theme.js, data/alerts.js
// and data/wallet.js (test/legal.test.js checks this).
export const STORAGE_INVENTORY = [
  { key: THEME_KEY, purpose: 'Remembers the colour theme you picked (system, light or dark).', category: 'Preferences', duration: 'Until you change it or clear site data' },
  { key: SAVED_KEY, purpose: 'Routes you saved and the snapshot used to show what changed since your last visit.', category: 'Functional (feature you turned on)', duration: 'Until you remove the route or clear site data' },
  { key: WALLET_KEY, purpose: 'Point balances you typed on the Wallet page.', category: 'Functional (feature you turned on)', duration: 'Until you remove them or clear site data' },
];

export const DRAFT_NOTICE = `<p class="rounded-lg bg-bad-100 px-3 py-2 text-sm font-semibold text-bad-800" role="note">DRAFT: requires review by a qualified lawyer before publishing.</p>`;

const section = (id, title, body) => `
  <section aria-labelledby="${id}" class="space-y-3">
    <h2 id="${id}" class="text-lg font-semibold text-ink-900">${title}</h2>
    <div class="space-y-3 text-ink-700">${body}</div>
  </section>`;

function storedSummary() {
  const keys = ownKeys();
  return keys.length
    ? `This browser currently holds ${keys.length} Pointscanner item${keys.length === 1 ? '' : 's'}: ${keys.map((k) => `<code class="font-mono text-sm">${esc(k)}</code>`).join(', ')}.`
    : 'This browser currently holds no Pointscanner data.';
}

export function render(root) {
  mount(
    root,
    `
    <article class="max-w-3xl space-y-8">
      <header class="space-y-3">
        <h1 tabindex="-1" class="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Privacy</h1>
        ${DRAFT_NOTICE}
        <p class="text-sm text-ink-600">Version ${esc(PRIVACY_VERSION)}</p>
        <p class="text-ink-700">Short version: Pointscanner has no server, no accounts, no cookies, no analytics and no ads. It doesn't
          collect personal data. A few settings you choose are kept in your own browser, and you can delete them on this page.</p>
      </header>

      ${section(
        'who',
        'Who runs Pointscanner',
        `<p>[[TODO: name of the person or legal entity operating the site]]<br />
         Contact: [[TODO: contact email]]<br />
         Postal address (if required in your jurisdiction): [[TODO: postal address]]</p>`,
      )}

      ${section(
        'collect',
        'What we collect',
        `<p>Nothing. Searches, filters, saved routes and wallet balances are processed entirely in your browser. None of it is sent to us
          or to anyone else.</p>
         <p>The site's files (HTML, scripts, styles, fonts and any award data file) are all served from the same website. There are no
          third-party scripts, fonts or trackers. If you load an award file on the About page, it is read in memory in that tab and is
          never uploaded.</p>`,
      )}

      ${section(
        'hosting',
        'Hosting',
        `<p>Like any website, the host that serves these files receives standard request information such as your IP address and browser
          type, under the host's own privacy terms. Host: [[TODO: hosting provider, e.g. GitHub Pages, and a link to its privacy statement]].</p>
         <p>The "Source on GitHub" link takes you to GitHub, which has its own privacy statement.</p>`,
      )}

      ${section(
        'storage',
        'What is stored in your browser',
        `<p>No cookies are used. Pointscanner writes these <code class="font-mono text-sm">localStorage</code> items, only when you use the
          matching feature:</p>
         <div class="card relative overflow-x-auto">
           <table class="data-table">
             <caption class="sr-only">Browser storage used by Pointscanner</caption>
             <thead><tr><th scope="col">Key</th><th scope="col">Purpose</th><th scope="col">Category</th><th scope="col">Kept</th></tr></thead>
             <tbody>
               ${STORAGE_INVENTORY.map(
                 (s) => `<tr><td class="whitespace-nowrap font-mono text-sm">${esc(s.key)}</td><td>${esc(s.purpose)}</td><td>${esc(s.category)}</td><td>${esc(s.duration)}</td></tr>`,
               ).join('')}
             </tbody>
           </table>
         </div>
         <p>These items are needed for features you ask for and never leave your device, so there is no consent banner. Nothing is
          stored for analytics or advertising.</p>`,
      )}

      ${section(
        'your-data',
        'See, export or delete your data',
        `<p id="stored-summary">${storedSummary()}</p>
         <div class="flex flex-wrap gap-2">
           <button type="button" class="btn" data-export>Download my data (JSON)</button>
           <button type="button" class="btn" data-clear>Delete my Pointscanner data</button>
         </div>
         <div id="clear-confirm" class="hidden rounded-lg bg-ink-100 p-4" role="group" aria-labelledby="clear-confirm-text">
           <p id="clear-confirm-text" class="text-ink-800">This deletes your saved routes, wallet balances and theme choice from this browser.
             It can't be undone.</p>
           <div class="mt-3 flex flex-wrap gap-2">
             <button type="button" class="btn btn-primary" data-clear-confirm>Delete data</button>
             <button type="button" class="btn btn-ghost" data-clear-cancel>Keep my data</button>
           </div>
         </div>
         <p id="clear-status" class="text-sm text-ink-700" role="status"></p>
         <p>You can also clear it any time through your browser's site-data settings. Because nothing reaches us, we hold no copy to access,
          correct or delete.</p>`,
      )}

      ${section(
        'children',
        'Children',
        `<p>Pointscanner is a travel-planning tool for adults and is not directed at children. It collects no personal data from anyone.</p>`,
      )}

      ${section(
        'changes',
        'Changes and questions',
        `<p>If this page changes, the version and date at the top change too, and the history is public in the
          <a class="link" href="${REPO_URL}" target="_blank" rel="noopener noreferrer">source repository</a>.
          Questions: [[TODO: contact email]].</p>`,
      )}
    </article>`,
  );

  const confirmBox = root.querySelector('#clear-confirm');
  const status = root.querySelector('#clear-status');
  const offs = [
    on(root, 'click', '[data-export]', () => {
      const blob = new Blob([JSON.stringify(exportOwnData(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: 'pointscanner-data.json' });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = 'Downloaded pointscanner-data.json.';
    }),
    on(root, 'click', '[data-clear]', () => {
      confirmBox.classList.remove('hidden');
      root.querySelector('[data-clear-cancel]').focus();
    }),
    on(root, 'click', '[data-clear-cancel]', () => {
      confirmBox.classList.add('hidden');
      root.querySelector('[data-clear]').focus();
    }),
    on(root, 'click', '[data-clear-confirm]', () => {
      const n = clearOwnData(STORAGE_PREFIX);
      applyTheme('system');
      document.dispatchEvent(new CustomEvent('pointscanner:saved-changed'));
      document.dispatchEvent(new CustomEvent('pointscanner:theme-changed'));
      confirmBox.classList.add('hidden');
      root.querySelector('#stored-summary').innerHTML = storedSummary();
      status.textContent = n ? `Deleted ${n} item${n === 1 ? '' : 's'} from this browser.` : 'There was nothing to delete.';
      announce(status.textContent);
      root.querySelector('[data-clear]').focus();
    }),
  ];
  return () => offs.forEach((off) => off());
}
