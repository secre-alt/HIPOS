import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.localStorage = { getItem: () => null, setItem() {} };
const { sanitize, isDue, dueForNotification, buildIcs, readPrefs, savePrefs, nudgeHtml, snoozeToday } = await import('../pwa/reminders.js');
const at = (h, m = 0, day = 18) => new Date(2026, 10, day, h, m); // 18 Nov 2026 is a Wednesday
const on = { on: true, time: '07:30', days: [1, 2, 3, 4, 5] };
const memory = () => { const d = new Map(); return { getItem: (k) => (d.has(k) ? d.get(k) : null), setItem: (k, v) => d.set(k, String(v)) }; };
test('damaged settings fall back to safe defaults', () => {
  assert.deepEqual(sanitize(null), { on: false, time: '07:30', days: [1, 2, 3, 4, 5], notify: false, snooze: '', lastShown: '' });
  const s = sanitize({ on: 'yes', time: '25:99', days: [9, 'x', 2, 2], snooze: 'tomorrow' });
  assert.equal(s.on, false); assert.equal(s.time, '07:30'); assert.deepEqual(s.days, [2]); assert.equal(s.snooze, '');
});
test('a reminder is due only after the time, on chosen days, and while nothing was done today', () => {
  assert.equal(isDue(on, at(7, 29)), false);
  assert.equal(isDue(on, at(7, 30)), true);
  assert.equal(isDue(on, at(9)), true);
  assert.equal(isDue(on, at(9), true), false, 'quiet once active today');
  assert.equal(isDue(on, at(9, 0, 21)), false, 'Saturday is not a chosen day');
  assert.equal(isDue({ ...on, on: false }, at(9)), false);
  assert.equal(isDue({ ...on, snooze: '2026-11-18' }, at(9)), false, 'snoozed');
  assert.equal(isDue({ ...on, snooze: '2026-11-17' }, at(9)), true, 'yesterday snooze is over');
});
test('notifications fire at most once a day and only when opted in', () => {
  assert.equal(dueForNotification({ ...on, notify: true }, at(9), false), true);
  assert.equal(dueForNotification({ ...on, notify: false }, at(9), false), false);
  assert.equal(dueForNotification({ ...on, notify: true, lastShown: '2026-11-18' }, at(9), false), false);
});
test('the calendar file repeats weekly on the chosen days at the chosen time', () => {
  const ics = buildIcs({ ...on, time: '06:45', days: [1, 3] }, at(8));
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=MO,WE\r\n/);
  assert.match(ics, /DTSTART:20261118T064500\r\n/);
  assert.match(ics, /BEGIN:VALARM[\s\S]*TRIGGER:PT0S[\s\S]*END:VALARM/);
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(!/[^\r]\n/.test(ics), 'CRLF line endings only');
});
test('settings save, read back, and survive blocked storage', () => {
  const st = memory();
  assert.equal(savePrefs({ on: true, time: '08:00', days: [1] }, st), true);
  assert.equal(readPrefs(st).time, '08:00');
  assert.equal(savePrefs({ on: true }, { setItem() { throw new Error('blocked'); } }), false);
  assert.equal(readPrefs({ getItem() { throw new Error('blocked'); } }).on, false);
});
test('the Home nudge shows when due, hides once active or snoozed', () => {
  const st = memory(); savePrefs({ ...on, on: true }, st);
  assert.match(nudgeHtml(false, at(9), st), /Ready for today/);
  assert.equal(nudgeHtml(true, at(9), st), '');
  snoozeToday(st, at(9));
  assert.equal(nudgeHtml(false, at(9), st), '');
});
