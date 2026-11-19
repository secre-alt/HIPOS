import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPref, readPref, prefNames } from '../pwa/a11y-prefs.js';
test('each easier-viewing option sets and clears its html attribute', () => {
  const root = { dataset: {} };
  applyPref('contrast', true, root); applyPref('reading', true, root); applyPref('touch', true, root);
  assert.deepEqual(root.dataset, { contrast: 'high', reading: 'easy', touch: 'large' });
  applyPref('contrast', false, root);
  assert.equal(root.dataset.contrast, undefined);
  applyPref('nonsense', true, root);
  assert.equal(root.dataset.nonsense, undefined);
});
test('saved choices are read safely, even when storage throws', () => {
  const store = { getItem: (k) => (k === 'hipos.a11y.touch' ? 'on' : null) };
  assert.equal(readPref('touch', store), true);
  assert.equal(readPref('reading', store), false);
  assert.equal(readPref('touch', { getItem() { throw new Error('blocked'); } }), false);
  assert.equal(prefNames.length, 3);
});
