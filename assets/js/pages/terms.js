import { REPO_URL } from '../components/header.js';
import { DRAFT_NOTICE } from './privacy.js';
import { esc, mount } from '../util/dom.js';

export const TERMS_VERSION = '0.1 (draft), 12 November 2026';

const section = (id, title, body) => `
  <section aria-labelledby="${id}" class="space-y-3">
    <h2 id="${id}" class="text-lg font-semibold text-ink-900">${title}</h2>
    <div class="space-y-3 text-ink-700">${body}</div>
  </section>`;

export function render(root) {
  mount(
    root,
    `
    <article class="max-w-3xl space-y-8">
      <header class="space-y-3">
        <h1 tabindex="-1" class="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Terms of use</h1>
        ${DRAFT_NOTICE}
        <p class="text-sm text-ink-600">Version ${esc(TERMS_VERSION)}</p>
      </header>

      ${section(
        'service',
        'What Pointscanner is',
        `<p>A free tool for exploring airline award availability and comparing redemptions. It is provided by
          [[TODO: name of the person or legal entity operating the site]]. There are no accounts, payments or subscriptions.</p>`,
      )}

      ${section(
        'data',
        'Award data is for information only',
        `<p>Unless the footer says otherwise, the award data shown is <strong>generated sample data, not real availability</strong>.
          Even real data can be out of date the moment it's shown. Prices, taxes, seat counts and deal scores are estimates.</p>
         <p>Always confirm availability and price with the loyalty program before transferring points or booking. Point transfers are
          usually irreversible. Pointscanner can't book anything and isn't responsible for decisions made using it.</p>`,
      )}

      ${section(
        'affiliation',
        'No affiliation; trademarks',
        `<p>Pointscanner is independent and is not affiliated with, endorsed by or sponsored by any airline, alliance or loyalty program.
          Airline, alliance and program names are trademarks of their respective owners and are used only to identify them. Colours
          shown next to program names are for telling programs apart, not official branding.</p>`,
      )}

      ${section(
        'warranty',
        'No warranty',
        `<p>The service and its source code are provided "as is", without warranty of any kind, to the extent permitted by law.
          [[TODO: limitation-of-liability wording appropriate to the operator's jurisdiction]]</p>`,
      )}

      ${section(
        'license',
        'Source code',
        `<p>The source code is available under the MIT License in the
          <a class="link" href="${REPO_URL}" target="_blank" rel="noopener noreferrer">public repository</a>. Third-party fonts and
          tools are listed in CREDITS.md there.</p>`,
      )}

      ${section(
        'law',
        'Governing law and changes',
        `<p>Governing law and jurisdiction: [[TODO: governing law and jurisdiction]].</p>
         <p>If these terms change, the version and date above change too. Questions: [[TODO: contact email]].</p>`,
      )}
    </article>`,
  );
}
