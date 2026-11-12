const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export function mount(el, html) {
  el.innerHTML = html;
  return el;
}

export function listHtml(items, render, empty = '') {
  return items.length ? items.map(render).join('') : empty;
}

// Delegated listener: fires handler(event, matchedElement) for events whose
// target is inside `selector` within `root`. Returns an unsubscribe function.
export function on(root, type, selector, handler, options) {
  const listener = (event) => {
    const match = event.target.closest?.(selector);
    if (match && root.contains(match)) handler(event, match);
  };
  root.addEventListener(type, listener, options);
  return () => root.removeEventListener(type, listener, options);
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function announce(message) {
  const region = document.getElementById('live-region');
  if (!region) return;
  region.textContent = '';
  setTimeout(() => {
    region.textContent = message;
  }, 50);
}
