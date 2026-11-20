import test from 'node:test';
import assert from 'node:assert/strict';
import { pickActive, sideFor, lineFor, allPerchLines, PERCH_LINES, FALLBACK_LINES } from '../pwa/buddy-hop.js';
import { pairs } from '../pwa/i18n.js';

test('the buddy alternates left, right, left, right', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(sideFor), ['left', 'right', 'left', 'right', 'left']);
});

test('pickActive follows the card crossing the reading line', () => {
  assert.equal(pickActive([], 280), -1);
  assert.equal(pickActive([300, 700, 1200], 280), 0);
  assert.equal(pickActive([-400, 100, 900], 280), 1);
  assert.equal(pickActive([-1400, -900, -100], 280), 2);
  assert.equal(pickActive([-100, 400, 900], 280, true), 2);
});

test('lineFor uses the first matching selector and rotates pools', () => {
  const el = (...classes) => ({ matches: (s) => classes.includes(s) });
  assert.equal(lineFor(el('.waste-checker'), 3), 'Tap what you are holding.');
  assert.equal(lineFor(el('.prevent-tip'), 0), 'Try this tip!');
  assert.equal(lineFor(el('.prevent-tip'), 1), 'Small habit, big help.');
  assert.equal(lineFor(el('.classify-page .prevent-hero', '.prevent-hero'), 0), 'Know what you carry.');
  assert.equal(lineFor(el('.unknown'), 1), FALLBACK_LINES[1]);
});

test('every perch line is short and has a Filipino translation', () => {
  const have = new Map(pairs.map((p) => [p[0], p[1]]));
  for (const line of allPerchLines()) {
    assert.ok(line.length <= 40, `too long: ${line}`);
    assert.ok(have.get(line) && have.get(line) !== line, `no Filipino for: ${line}`);
  }
  assert.ok(PERCH_LINES.length > 20);
});
