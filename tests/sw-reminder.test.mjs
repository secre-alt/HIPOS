import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Runs the generated service worker's reminder handler with fake browser objects.
// Needs `npm run build` first; skipped when dist/ is missing.
const source = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8').catch(() => '');
const id = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function run(state) {
  const handlers = {}, shown = [], store = new Map();
  if (state) store.set('state', JSON.stringify(state));
  const cache = { match: async (k) => (store.has(k) ? { json: async () => JSON.parse(store.get(k)) } : undefined), put: async (k, res) => store.set(k, await res.text()) };
  const self = { addEventListener: (type, fn) => { handlers[type] = fn; }, registration: { showNotification: async (title, options) => shown.push({ title, options }) }, clients: {}, skipWaiting() {}, location: { href: 'https://x/sw.js' } };
  vm.runInNewContext(source, { self, caches: { open: async () => cache, keys: async () => [], match: async () => undefined }, Response, Date, Promise, URL, console, fetch: async () => ({}) });
  let pending; handlers.periodicsync({ tag: 'hipos-daily', waitUntil: (p) => { pending = p; } });
  await pending;
  return { shown, store };
}
const base = { on: true, notify: true, time: '00:00', days: [0, 1, 2, 3, 4, 5, 6], snooze: '', lastShown: '', doneDay: '', title: 'Time for your HIPOS check-in', body: 'One small thing today.', open: 'Open HIPOS' };

test('background reminder shows once, with an Open HIPOS button', { skip: !source }, async () => {
  const { shown, store } = await run(base);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, 'Time for your HIPOS check-in');
  assert.equal(JSON.stringify(shown[0].options.actions.map((a) => a.title)), JSON.stringify(['Open HIPOS']));
  assert.equal(JSON.parse(store.get('state')).lastShown, id());
});

test('opening the app earlier does not hide the reminder, but doing something today does', { skip: !source }, async () => {
  assert.equal((await run({ ...base, doneDay: '' })).shown.length, 1);
  assert.equal((await run({ ...base, doneDay: id() })).shown.length, 0);
});

test('background reminder stays quiet when snoozed, already shown, off, or before the time', { skip: !source }, async () => {
  for (const change of [{ snooze: id() }, { lastShown: id() }, { on: false }, { notify: false }, { time: '23:59' }, { days: [] }]) {
    assert.equal((await run({ ...base, ...change })).shown.length, 0, JSON.stringify(change));
  }
  assert.equal((await run(null)).shown.length, 0);
});
