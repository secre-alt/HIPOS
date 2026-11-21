import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS, CHAMPION, activeEvent, dayIndex, learnWord, sanitize, readEvents, eventXp, eventKeepsakes, hasChampion, wikaCard } from '../pwa/events.js';
import { pairs } from '../pwa/i18n.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const aug = (d, y = 2026) => new Date(y, 7, d, 12);

test('Linggo ng Wika runs August 13 to 19 only', () => {
  assert.equal(activeEvent(aug(12)), null);
  assert.equal(activeEvent(aug(13)).id, 'wika');
  assert.equal(activeEvent(aug(19)).id, 'wika');
  assert.equal(activeEvent(aug(20)), null);
  assert.equal(activeEvent(new Date(2026, 6, 15)), null, 'July');
  assert.deepEqual([13, 16, 19].map((d) => dayIndex(aug(d))), [0, 3, 6]);
  assert.equal(dayIndex(aug(25)), -1);
  assert.equal(WORDS.length, 7, 'one word for each day of the week');
});

test('words open one day at a time, can be caught up, and count once', () => {
  const storage = memory();
  assert.equal(learnWord(0, { storage, now: aug(12) }), null, 'before the week');
  assert.equal(learnWord(2, { storage, now: aug(14) }), null, 'cannot skip ahead');
  const first = learnWord(1, { storage, now: aug(14) });
  assert.deepEqual([first.xp, first.collected, first.champion, first.countLabel], [10, 1, false, '1 of 7 words']);
  assert.equal(learnWord(1, { storage, now: aug(14) }), null, 'only once');
  assert.ok(learnWord(0, { storage, now: aug(14) }), 'an earlier word can be caught up');
  assert.equal(learnWord(0, { storage, now: aug(30) }), null, 'closed after the week');
});

test('all seven words earn the champion keepsake and bonus XP, and keepsakes stay for good', () => {
  const storage = memory();
  let last;
  for (let i = 0; i < 7; i++) last = learnWord(i, { storage, now: aug(19) });
  assert.equal(last.champion, true);
  assert.equal(last.xp, 40);
  assert.deepEqual(last.item, CHAMPION);
  const state = readEvents(storage);
  assert.equal(eventXp(state), 7 * 10 + 30);
  assert.equal(hasChampion(state), true);
  assert.ok(eventKeepsakes(state).every((k) => k.owned));
  // A new year starts fresh progress but keeps what was earned.
  const next = learnWord(0, { storage, now: aug(13, 2027) });
  assert.equal(next.collected, 1);
  assert.equal(eventXp(readEvents(storage)), 7 * 10 + 30 + 10);
  assert.ok(eventKeepsakes(readEvents(storage)).every((k) => k.owned));
});

test('saved event data is validated and the card only shows during the week', () => {
  assert.deepEqual(sanitize({ wika: { 2026: [0, 0, 9, 'x', 3], bad: [1], 2027: 'no' } }).wika, { 2026: [0, 3] });
  assert.deepEqual(sanitize(null), { wika: {} });
  const storage = memory();
  assert.equal(wikaCard({ storage, now: aug(25) }), '');
  const html = wikaCard({ storage, now: aug(15) });
  assert.match(html, /Word of the day/);
  assert.match(html, /Kalikasan|Malinis/);
  assert.equal((html.match(/data-wika-learn/g) || []).length, 3, 'today plus two earlier words');
});

test('event text has Filipino translations', () => {
  const have = new Map(pairs.map((p) => [p[0], p[1]]));
  const strings = [...WORDS.map((w) => w.meaning), 'Word of the day', 'I learned it', 'Learned ✓', 'Earlier words', 'In English:', 'New word learned!', 'Wika champion!', 'Wika champion', 'Linggo ng Wika keepsakes', 'Linggo ng Wika · August 13–19', 'All seven words learned! Wika champion.'];
  for (const text of strings) assert.ok(have.has(text), `missing Filipino: ${text}`);
});
