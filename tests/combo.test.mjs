import test from 'node:test';
import assert from 'node:assert/strict';
import { createCombo, hit, miss, comboLine, comboLevel } from '../pwa/combo.js';
import { pairs } from '../pwa/i18n.js';

test('a combo grows with each hit, a miss ends it, and the best run is kept', () => {
  const c = createCombo();
  assert.deepEqual([hit(c), hit(c), hit(c)], [1, 2, 3]);
  assert.equal(miss(c), 3);
  assert.equal(c.count, 0);
  hit(c);
  assert.deepEqual([c.count, c.best], [1, 3]);
  assert.equal(miss(createCombo()), 0);
});

test('buddy lines only appear at milestones and sound rises then holds', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9].map(comboLine).filter(Boolean).length, 3);
  assert.equal(comboLine(3), 'Three in a row!');
  assert.deepEqual([0, 1, 2, 3, 7, 20].map(comboLevel), [0, 0, 1, 2, 6, 6]);
});

test('combo lines have Filipino translations', () => {
  const have = new Set(pairs.map((p) => p[0]));
  for (const line of ['Three in a row!', 'Five in a row, nice!', 'On fire! Eight in a row!']) assert.ok(have.has(line), line);
});
