import test from 'node:test';
import assert from 'node:assert/strict';
import { createToastQueue, noticeType } from '../pwa/toast.js';

function setup() {
  let time = 0, id = 0;
  const timers = new Map(), rendered = [];
  const queue = createToastQueue(item => rendered.push(item), {
    now: () => time,
    schedule: (fn, delay) => { timers.set(++id, { fn, at: time + delay }); return id; },
    cancel: key => timers.delete(key),
  });
  function advance(ms) {
    const end = time + ms;
    while (true) {
      const due = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!due || due[1].at > end) break;
      time = due[1].at; timers.delete(due[0]); due[1].fn();
    }
    time = end;
  }
  return { queue, rendered, advance, current: () => rendered.at(-1) };
}

test('simultaneous rewards queue without duplicates and expire in order', () => {
  const s = setup();
  s.queue.push('First', 'success'); s.queue.push('Second');
  s.queue.push('First'); s.queue.push('Second');
  assert.equal(s.current().text, 'First');
  s.advance(4999); assert.equal(s.current().text, 'First');
  s.advance(1); assert.equal(s.current().text, 'Second');
  s.advance(5000); assert.equal(s.current(), null);
  s.queue.push('First'); assert.equal(s.current().text, 'First');
});

test('hover, focus, and visibility pause the remaining time independently', () => {
  const s = setup(); s.queue.push('Saved'); s.advance(2000);
  s.queue.pause('pointer'); s.queue.pause('focus'); s.advance(20000);
  s.queue.resume('pointer'); s.advance(10000); assert.ok(s.current());
  s.queue.pause('hidden'); s.queue.resume('focus'); s.advance(10000); assert.ok(s.current());
  s.queue.resume('hidden'); s.advance(2999); assert.ok(s.current());
  s.advance(1); assert.equal(s.current(), null);
});

test('errors stay until dismissed and cancellation does not expire the next message early', () => {
  const s = setup(); s.queue.push('Saved'); s.queue.push('Could not save', 'error'); s.queue.push('Next');
  s.advance(1000); s.queue.dismiss(); s.advance(60000);
  assert.equal(s.current().type, 'error'); s.queue.dismiss();
  s.advance(4999); assert.equal(s.current().text, 'Next');
  s.advance(1); assert.equal(s.current(), null);
});

test('a full routine queue still accepts errors', () => {
  const s = setup(); s.queue.push('Current');
  for (let i = 0; i < 10; i++) s.queue.push(`Routine ${i}`);
  s.queue.push('Could not save', 'error');
  s.advance(25000); assert.equal(s.current().type, 'error');
});

test('English and Filipino storage failures are persistent errors', () => {
  for (const text of ['Could not save language.', 'Appearance changed, but could not be saved on this device.', 'Hindi na-save ang wika. Subukan muli.']) assert.equal(noticeType(text), 'error');
  assert.equal(noticeType('Buddy look saved!'), 'success');
  assert.equal(noticeType('Checking for updates…'), 'info');
});
