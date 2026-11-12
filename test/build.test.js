import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { bundle } from '../build.mjs';

test('the committed bundle matches the sources', () => {
  const committed = readFileSync(new URL('../dist/pointscanner.js', import.meta.url), 'utf8');
  assert.ok(committed === bundle(), 'dist/pointscanner.js is stale: run `node build.mjs`');
});

test('the bundle is a single classic script with no ES module syntax', () => {
  const code = bundle();
  assert.doesNotThrow(() => new vm.Script(code));
  assert.ok(!/^\s*(import|export)\s/m.test(code));
});
