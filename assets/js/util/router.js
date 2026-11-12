export function parseHash(hash) {
  const raw = String(hash || '').replace(/^#/, '');
  const [pathPart, queryPart = ''] = raw.split('?');
  const path = '/' + pathPart.replace(/^\/+|\/+$/g, '');
  const query = {};
  for (const [k, v] of new URLSearchParams(queryPart)) query[k] = v;
  return { path, query };
}

// Keeps commas and colons readable in shared links ("cabins=business,first").
function encode(value) {
  return encodeURIComponent(value).replace(/%2C/gi, ',').replace(/%3A/gi, ':');
}

export function buildHash(path, query = {}) {
  const parts = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '' || v === false) continue;
    parts.push(`${encode(k)}=${encode(v === true ? '1' : v)}`);
  }
  return '#' + path + (parts.length ? '?' + parts.join('&') : '');
}

export class Router {
  constructor(routes, { onBeforeRender, onAfterRender, notFound } = {}) {
    this.routes = routes;
    this.onBeforeRender = onBeforeRender;
    this.onAfterRender = onAfterRender;
    this.notFound = notFound;
    this.current = null;
    this.cleanup = null;
    this.silentHash = null;
  }

  start(outlet) {
    this.outlet = outlet;
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  }

  resolve() {
    if (this.silentHash !== null && location.hash === this.silentHash) {
      this.silentHash = null;
      this.current = parseHash(location.hash);
      return;
    }
    this.silentHash = null;
    const next = parseHash(location.hash);
    const pathChanged = !this.current || this.current.path !== next.path;
    this.current = next;
    this.render(pathChanged);
  }

  render(pathChanged = false) {
    const run = () => {
      if (typeof this.cleanup === 'function') this.cleanup();
      this.cleanup = null;
      const page = this.routes[this.current.path] ?? this.notFound;
      this.onBeforeRender?.(this.current);
      this.cleanup = page.render(this.outlet, { query: this.current.query, path: this.current.path, router: this });
      this.onAfterRender?.(this.current, pathChanged);
    };
    // Crossfade between pages where View Transitions exist; never on the first
    // render, on in-page updates, or when the user prefers reduced motion.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (pathChanged && this.rendered && document.startViewTransition && !reduce) document.startViewTransition(run);
    else run();
    this.rendered = true;
  }

  go(path, query = {}) {
    location.hash = buildHash(path, query);
  }

  // Updates the URL to reflect page state without re-rendering the page and
  // without adding a history entry per keystroke.
  replaceQuery(query) {
    const hash = buildHash(this.current.path, query);
    if (hash === location.hash) return;
    this.silentHash = hash;
    location.replace(hash);
  }
}
