#!/usr/bin/env node
// Bundles the ES modules under assets/js into one classic <script> so the site
// works when index.html is opened straight from disk (browsers refuse to load
// ES modules over file://). No dependencies: imports/exports are rewritten
// into a tiny lazy module registry.
//
// Also compiles Tailwind (pinned, fetched on demand with npx; nothing to
// install) into dist/pointscanner.css so the site makes no third-party
// requests and has no flash of unstyled content. Offline, the JS still
// builds and the CSS step is skipped with a warning.
//
//   node build.mjs           write dist/pointscanner.js and dist/pointscanner.css
//   node build.mjs --check   exit 1 if either is stale
//   node build.mjs --watch   rebuild on change
//
// Supported syntax: named imports (`import { a, b as c } from './x.js'`),
// namespace imports (`import * as x from './x.js'`), `export function|class|
// const|let|var name` and `export { a, b as c }`. Default exports, re-exports
// and import cycles are rejected so the output stays predictable.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, watch, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'assets', 'js');
const ENTRY = 'main.js';
const OUT = join(ROOT, 'dist', 'pointscanner.js');
const CSS_OUT = join(ROOT, 'dist', 'pointscanner.css');
const TAILWIND = 'tailwindcss@3.4.17';

const IMPORT_RE = /^import\s+(?:([\s\S]*?)\s+from\s+)?(['"])([^'"]+)\2;?[ \t]*$/gm;
const EXPORT_DECL_RE = /^export\s+((?:async\s+)?function\s*\*?\s*|class\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]*)/gm;
const EXPORT_LIST_RE = /^export\s*\{([^}]*)\}\s*;?[ \t]*$/gm;

class BuildError extends Error {}

function resolveId(fromId, spec) {
  if (!spec.startsWith('./') && !spec.startsWith('../')) {
    throw new BuildError(`${fromId}: only relative imports are supported (got "${spec}")`);
  }
  const id = posix.normalize(posix.join(posix.dirname(fromId), spec));
  if (id.startsWith('..')) throw new BuildError(`${fromId}: import "${spec}" escapes assets/js`);
  return id;
}

function importBinding(fromId, clause, depId) {
  const req = `__require(${JSON.stringify(depId)})`;
  if (!clause) return `${req};`;
  const c = clause.trim();
  const ns = c.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
  if (ns) return `const ${ns[1]} = ${req};`;
  const named = c.match(/^\{([\s\S]*)\}$/);
  if (!named) throw new BuildError(`${fromId}: default imports are not supported ("import ${c} from ...")`);
  const parts = named[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
      if (!m) throw new BuildError(`${fromId}: can't parse import specifier "${s}"`);
      return m[2] ? `${m[1]}: ${m[2]}` : m[1];
    });
  return `const { ${parts.join(', ')} } = ${req};`;
}

function transform(id, source) {
  const deps = [];
  const exportsMap = [];

  let code = source.replace(IMPORT_RE, (_, clause, _q, spec) => {
    const depId = resolveId(id, spec);
    deps.push(depId);
    return importBinding(id, clause, depId);
  });

  code = code.replace(EXPORT_LIST_RE, (_, list) => {
    for (const s of list.split(',').map((x) => x.trim()).filter(Boolean)) {
      const m = s.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
      if (!m) throw new BuildError(`${id}: can't parse export specifier "${s}"`);
      exportsMap.push([m[2] ?? m[1], m[1]]);
    }
    return '';
  });

  code = code.replace(EXPORT_DECL_RE, (_, kind, name) => {
    exportsMap.push([name, name]);
    return kind + name;
  });

  const leftover = code.match(/^export\b.*$/m);
  if (leftover) throw new BuildError(`${id}: unsupported export syntax: ${leftover[0].trim()}`);
  if (/^\s*import\s*\(/m.test(code) || /\bimport\.meta\b/.test(code)) {
    throw new BuildError(`${id}: dynamic import() and import.meta are not supported`);
  }

  const getters = exportsMap.map(([exported, local]) => `${JSON.stringify(exported)}: () => ${local}`).join(', ');
  const body = `${exportsMap.length ? `__export(__exports, { ${getters} });\n` : ''}${code.trimEnd()}\n`;
  return { deps, body };
}

function collect() {
  const modules = new Map();
  const order = [];
  const visiting = new Set();

  const visit = (id, chain) => {
    if (modules.has(id)) return;
    if (visiting.has(id)) throw new BuildError(`import cycle: ${[...chain, id].join(' -> ')}`);
    const file = join(SRC, id);
    if (!existsSync(file)) throw new BuildError(`${chain.at(-1) ?? 'entry'}: cannot find module "${id}"`);
    visiting.add(id);
    const mod = transform(id, readFileSync(file, 'utf8'));
    for (const dep of mod.deps) visit(dep, [...chain, id]);
    visiting.delete(id);
    modules.set(id, mod);
    order.push(id);
  };

  visit(ENTRY, []);
  return order.map((id) => [id, modules.get(id)]);
}

export function bundle() {
  const modules = collect();
  const defs = modules
    .map(
      ([id, mod]) =>
        `// ── assets/js/${id} ${'─'.repeat(Math.max(4, 60 - id.length))}\n` +
        `__define(${JSON.stringify(id)}, function (__exports, __require) {\n${mod.body}});\n`,
    )
    .join('\n');

  return `/*! Pointscanner — generated by build.mjs from assets/js. Do not edit by hand; run \`node build.mjs\`. MIT License. */
(function () {
'use strict';
var __modules = Object.create(null);
var __cache = Object.create(null);
function __define(id, factory) { __modules[id] = factory; }
function __export(target, getters) {
  for (var key in getters) Object.defineProperty(target, key, { enumerable: true, get: getters[key] });
}
function __require(id) {
  if (__cache[id]) return __cache[id];
  var exports = (__cache[id] = {});
  __modules[id](exports, __require);
  return exports;
}

${defs}
__require(${JSON.stringify(ENTRY)});
})();
`;
}

// Returns the compiled CSS, or null when the Tailwind CLI can't be fetched.
export function buildCss() {
  const res = spawnSync(
    'npx',
    ['--yes', TAILWIND, '-c', 'tailwind.config.cjs', '-i', 'assets/css/tailwind.css', '--minify'],
    { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 16 * 1024 * 1024 },
  );
  if (res.status !== 0 || !res.stdout) return null;
  return `/*! Pointscanner — generated by build.mjs (${TAILWIND}). Do not edit by hand. */\n${res.stdout.trim()}\n`;
}

function checkFile(path, expected, label) {
  const current = existsSync(path) ? readFileSync(path, 'utf8') : '';
  if (current === expected) {
    console.log(`${label} is up to date.`);
    return true;
  }
  console.error(`${label} is out of date. Run \`node build.mjs\` and commit the result.`);
  return false;
}

function build({ check = false } = {}) {
  const js = bundle();
  const css = buildCss();
  if (check) {
    let ok = checkFile(OUT, js, 'dist/pointscanner.js');
    if (css === null) {
      console.error(`Could not run ${TAILWIND} to verify dist/pointscanner.css.`);
      ok = false;
    } else {
      ok = checkFile(CSS_OUT, css, 'dist/pointscanner.css') && ok;
    }
    if (!ok) process.exitCode = 1;
    return;
  }
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, js);
  console.log(`wrote dist/pointscanner.js (${(Buffer.byteLength(js) / 1024).toFixed(1)} KB)`);
  if (css === null) {
    console.warn(`warning: couldn't run ${TAILWIND} (offline?); dist/pointscanner.css was not rebuilt.`);
  } else {
    writeFileSync(CSS_OUT, css);
    console.log(`wrote dist/pointscanner.css (${(Buffer.byteLength(css) / 1024).toFixed(1)} KB)`);
  }
}

function main() {
  const args = new Set(process.argv.slice(2));
  try {
    build({ check: args.has('--check') });
  } catch (err) {
    if (!(err instanceof BuildError)) throw err;
    console.error(`build failed: ${err.message}`);
    process.exitCode = 1;
  }
  if (args.has('--watch')) {
    let timer;
    console.log('watching assets/js and assets/css for changes…');
    const rebuildOn = (dir) => watch(dir, { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          build();
        } catch (err) {
          console.error(`build failed: ${err.message}`);
        }
      }, 100);
    });
    rebuildOn(SRC);
    rebuildOn(join(ROOT, 'assets', 'css'));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
