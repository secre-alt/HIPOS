import test from 'node:test';
import assert from 'node:assert/strict';
import { makeHazardRound, HAZARD_ITEMS, HAZARD_ROUND } from '../pwa/hazard.js';
test('a hazard round is balanced and has no repeats', () => {
  for (let n = 0; n < 20; n++) {
    const r = makeHazardRound();
    assert.equal(r.length, HAZARD_ROUND);
    assert.equal(new Set(r.map((x) => x.name)).size, HAZARD_ROUND);
    assert.equal(r.filter((x) => x.safe).length, HAZARD_ROUND / 2);
  }
});
test('every hazard item has art and a reason', () => {
  for (const it of HAZARD_ITEMS) assert.ok(it.art && it.why && it.name);
});
