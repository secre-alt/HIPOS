import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAsk } from '../pwa/leave-guard.js';
test('only in-app links away from the current page ask, and only during a round', () => {
  assert.equal(shouldAsk('#games', '#compost', true), true);
  assert.equal(shouldAsk('#compost', '#compost', true), false);
  assert.equal(shouldAsk('#games', '#compost', false), false);
  assert.equal(shouldAsk('https://example.com', '#compost', true), false);
  assert.equal(shouldAsk('#home', '', true), true);
});
