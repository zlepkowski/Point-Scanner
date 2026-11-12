import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { STORAGE_INVENTORY } from '../assets/js/pages/privacy.js';
import { clearOwnData, exportOwnData, ownKeys, saveJson } from '../assets/js/util/storage.js';
import { memoryStorage } from './helpers.js';

const ROOT = new URL('..', import.meta.url).pathname;

function sources(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sources(path) : path.endsWith('.js') ? [path] : [];
  });
}

beforeEach(() => {
  globalThis.localStorage = memoryStorage();
});

test('the privacy page lists every storage key the app writes', () => {
  const written = new Set();
  for (const file of sources(join(ROOT, 'assets/js'))) {
    for (const m of readFileSync(file, 'utf8').matchAll(/'(pointscanner:[a-z0-9:]+)'/g)) written.add(m[1]);
  }
  written.delete('pointscanner:saved-changed');
  written.delete('pointscanner:theme-changed');
  written.delete('pointscanner:');
  assert.deepEqual([...written].sort(), STORAGE_INVENTORY.map((s) => s.key).sort());
});

test('index.html loads nothing from another origin', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const external = [...html.matchAll(/<(script|link)\b[^>]*(src|href)="(https?:)?\/\/[^"]+"/g)].map((m) => m[0]);
  assert.deepEqual(external, []);
});

test('legal pages keep visible placeholders instead of invented details', () => {
  for (const page of ['privacy.js', 'terms.js']) {
    const src = readFileSync(join(ROOT, 'assets/js/pages', page), 'utf8');
    assert.ok(src.includes('DRAFT_NOTICE'), `${page} shows the draft notice`);
    assert.ok(src.includes('[[TODO: contact email]]'), `${page} has a contact placeholder`);
  }
});

test('users can export and delete only Pointscanner data', () => {
  saveJson('pointscanner:theme', 'dark');
  saveJson('pointscanner:wallet:v1', [{ programId: 'aeroplan', amount: 1 }]);
  saveJson('someone-else', 1);
  assert.deepEqual(ownKeys(), ['pointscanner:theme', 'pointscanner:wallet:v1']);
  assert.deepEqual(exportOwnData(), { 'pointscanner:theme': 'dark', 'pointscanner:wallet:v1': [{ programId: 'aeroplan', amount: 1 }] });
  assert.equal(clearOwnData(), 2);
  assert.deepEqual(ownKeys(), []);
  assert.equal(globalThis.localStorage.getItem('someone-else'), '1');
});
