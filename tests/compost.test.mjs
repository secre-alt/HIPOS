import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeSequence} from '../pwa/compost.js';

test('compost sequence has 18 items, mostly compostable, never the same item twice in a row', () => {
  for (let run = 0; run < 50; run++) {
    const seq = makeSequence();
    assert.equal(seq.length, 18);
    for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i].name, seq[i - 1].name);
  }
  const seq = makeSequence(() => 0.1);
  assert.ok(seq.filter(x => x.good).length >= 12, 'about two thirds should be compostable');
});

test('compost sequence uses a provided random source deterministically', () => {
  const a = makeSequence(() => 0.42).map(x => x.name).join('|');
  const b = makeSequence(() => 0.42).map(x => x.name).join('|');
  assert.equal(a, b);
});
