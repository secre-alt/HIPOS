import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapAngle, clampPitch, stepSpin } from '../pwa/keepsake-viewer.js';

test('angles wrap into one turn and pitch is limited', () => {
  assert.ok(Math.abs(wrapAngle(-0.5) - (Math.PI * 2 - 0.5)) < 1e-9);
  assert.ok(Math.abs(wrapAngle(Math.PI * 4 + 1) - 1) < 1e-9);
  assert.equal(clampPitch(5), 1.2);
  assert.equal(clampPitch(-5), -1.2);
});

test('a flick coasts to a slow drift and never stops completely', () => {
  let s = { yaw: 0, pitch: 0, vyaw: 10, vpitch: 0, dragging: false };
  for (let i = 0; i < 600; i++) s = stepSpin(s, 0.016);
  assert.ok(s.vyaw > 0.3 && s.vyaw < 0.7, `settles near the idle drift: ${s.vyaw}`);
  assert.ok(s.yaw > 3, 'it kept turning');
});

test('while dragging nothing moves on its own, and idle 0 lets it rest', () => {
  const held = stepSpin({ yaw: 1, pitch: 0, vyaw: 5, vpitch: 0, dragging: true }, 0.1);
  assert.equal(held.yaw, 1);
  let s = { yaw: 0, pitch: 0, vyaw: 4, vpitch: 0, dragging: false };
  for (let i = 0; i < 600; i++) s = stepSpin(s, 0.016, { idle: 0 });
  assert.ok(Math.abs(s.vyaw) < 0.01);
});
