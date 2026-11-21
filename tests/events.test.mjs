import test from 'node:test';
import assert from 'node:assert/strict';
import { WIKA, CHRISTMAS, EVENTS, activeEvent, dayIndex, completeItem, sanitize, readEvents, eventXp, eventKeepsakes, hasChampion, eventCard } from '../pwa/events.js';
import { pairs } from '../pwa/i18n.js';

const WORDS = WIKA.items, CHAMPION = WIKA.champion;
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const aug = (d, y = 2026) => new Date(y, 7, d, 12);
const dec = (d, y = 2026) => new Date(y, 11, d, 12);
const learnWord = completeItem;
const wikaCard = eventCard;

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
  assert.equal(hasChampion(state, 'wika'), true);
  assert.ok(eventKeepsakes(state)[0].items.every((k) => k.owned));
  // A new year starts fresh progress but keeps what was earned.
  const next = learnWord(0, { storage, now: aug(13, 2027) });
  assert.equal(next.collected, 1);
  assert.equal(eventXp(readEvents(storage)), 7 * 10 + 30 + 10);
  assert.ok(eventKeepsakes(readEvents(storage))[0].items.every((k) => k.owned));
});

test('saved event data is validated and the card only shows during the week', () => {
  assert.deepEqual(sanitize({ wika: { 2026: [0, 0, 9, 'x', 3], bad: [1], 2027: 'no' } }).wika, { 2026: [0, 3] });
  assert.deepEqual(sanitize(null), { wika: {}, christmas: {} });
  const storage = memory();
  assert.equal(wikaCard({ storage, now: aug(25) }), '');
  const html = wikaCard({ storage, now: aug(15) });
  assert.match(html, /Word of the day/);
  assert.match(html, /Kalikasan|Malinis/);
  assert.equal((html.match(/data-event-item/g) || []).length, 3, 'today plus two earlier words');
});

test('Christmas week runs December 19 to 25 and works like the other event', () => {
  assert.equal(activeEvent(dec(18)), null);
  assert.equal(activeEvent(dec(19)).id, 'christmas');
  assert.equal(activeEvent(dec(25)).id, 'christmas');
  assert.equal(activeEvent(dec(26)), null);
  assert.deepEqual([19, 22, 25].map((d) => dayIndex(dec(d))), [0, 3, 6]);
  assert.equal(CHRISTMAS.items.length, 7);
  const storage = memory();
  assert.equal(completeItem(1, { storage, now: dec(19) }), null, 'cannot skip ahead');
  const first = completeItem(0, { storage, now: dec(19) });
  assert.deepEqual([first.xp, first.countLabel, first.heading, first.item[1]], [10, '1 of 7 ideas', 'Idea tried!', 'Cloth wrap']);
  for (let i = 1; i < 7; i++) completeItem(i, { storage, now: dec(25) });
  const state = readEvents(storage);
  assert.equal(hasChampion(state, 'christmas'), true);
  assert.equal(hasChampion(state, 'wika'), false, 'events are separate');
  assert.equal(eventXp(state), 100);
  assert.match(eventCard({ storage, now: dec(22) }), /Idea of the day/);
  assert.match(eventCard({ storage, now: dec(22) }), /data-event="christmas"/);
});

test('event text has Filipino translations', () => {
  const have = new Map(pairs.map((p) => [p[0], p[1]]));
  const strings = [];
  for (const ev of EVENTS) {
    strings.push(ev.eyebrow, ev.heading, ev.intro, ev.button, ev.done, ev.complete, ev.revealNew, ev.revealChampion, ev.collection, ev.champion[1], `Earlier ${ev.unit}`);
    for (const it of ev.items) strings.push(...(ev.kind === 'word' ? [it.meaning] : [it.title, it.detail, it.name]));
  }
  for (const text of strings) assert.ok(have.has(text), `missing Filipino: ${text}`);
});
