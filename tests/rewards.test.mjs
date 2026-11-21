import test from 'node:test';
import assert from 'node:assert/strict';
import { KEEPSAKES, levelFor, xpForLevel, totalXp, weekId, daysLeftInWeek, pickQuests, QUEST_POOL, sanitize, openGift, openChest, takeLevelUp, rewardsNow, ensureWeek } from '../pwa/rewards.js';
import { pairs } from '../pwa/i18n.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const day = (d) => new Date(2026, 10, d, 12); // November 2026
const zero = { sorts: 0, compost: 0, treats: 0, perfect: 0 };

test('levels grow with XP and show progress to the next level', () => {
  assert.equal(levelFor(0).level, 1);
  assert.equal(levelFor(24).level, 1);
  assert.equal(levelFor(25).level, 2);
  assert.equal(levelFor(74).level, 2);
  assert.equal(levelFor(75).level, 3);
  const l = levelFor(50);
  assert.deepEqual([l.level, l.into, l.span, l.toNext, l.pct], [2, 25, 50, 25, 50]);
  assert.equal(xpForLevel(4), 150);
  assert.equal(totalXp({ care: 3, gifts: 2, chests: 1 }), 30 + 10 + 30);
  assert.equal(levelFor(-5).level, 1);
});

test('the quest week starts on Monday and quests are stable within a week', () => {
  assert.equal(weekId(day(16)), '2026-11-16'); // Monday
  assert.equal(weekId(day(22)), '2026-11-16'); // Sunday
  assert.equal(weekId(day(23)), '2026-11-23');
  assert.equal(daysLeftInWeek(day(16)), 7);
  assert.equal(daysLeftInWeek(day(22)), 1);
  const a = pickQuests('2026-11-16'), b = pickQuests('2026-11-16');
  assert.deepEqual(a.map((q) => q.id), b.map((q) => q.id));
  assert.equal(new Set(a.map((q) => q.id)).size, 3);
  const seen = new Set();
  for (let w = 0; w < 20; w++) pickQuests(weekId(new Date(2026, 0, 5 + w * 7))).forEach((q) => seen.add(q.id));
  assert.equal(seen.size, QUEST_POOL.length, 'every quest turns up over time');
});

test('the daily gift opens once a day, always pays out, and fills the collection without repeats', () => {
  const storage = memory();
  const seen = new Set();
  for (let d = 1; d <= KEEPSAKES.length; d++) {
    const first = openGift({ storage, now: day(d), s: zero });
    assert.ok(first && first.isNew && first.xp === 5);
    assert.equal(openGift({ storage, now: day(d), s: zero }), null, 'only once per day');
    seen.add(first.item[1]);
  }
  assert.equal(seen.size, KEEPSAKES.length);
  const extra = openGift({ storage, now: new Date(2026, 11, 1, 9), s: zero });
  assert.equal(extra.isNew, false);
  assert.equal(extra.xp, 5, 'still pays out after the collection is complete');
});

test('quest progress counts from the start of the week and the chest opens once', () => {
  const storage = memory();
  const now = day(17);
  const start = { sorts: 10, compost: 4, treats: 20, perfect: 2 };
  const first = rewardsNow({ storage, now, s: start, summary: {} });
  assert.ok(first.quests.every((q) => q.value === 0), 'earlier activity does not count');
  const done = { sorts: 20, compost: 14, treats: 40, perfect: 5 };
  const view = rewardsNow({ storage, now, s: done, summary: {} });
  openGift({ storage, now, s: done });
  const gifted = rewardsNow({ storage, now, s: done, summary: {} });
  for (let d = 18; d <= 20; d++) openGift({ storage, now: day(d), s: done });
  const all = rewardsNow({ storage, now: day(20), s: done, summary: {} });
  assert.ok(view.quests.some((q) => q.value > 0));
  assert.ok(gifted.quests.length === 3);
  assert.equal(all.allDone, true);
  const chest = openChest({ storage, now: day(20), s: done, summary: {} });
  assert.ok(chest && chest.xp === 30);
  assert.equal(openChest({ storage, now: day(20), s: done, summary: {} }), null, 'one chest per week');
  assert.equal(rewardsNow({ storage, now: day(24), s: done, summary: {} }).chestOpened, false, 'new week, new quests');
});

test('a locked chest does not open and no level-up is reported before one is earned', () => {
  const storage = memory();
  assert.equal(openChest({ storage, now: day(17), s: zero, summary: {} }), null);
  assert.equal(takeLevelUp({ storage, now: day(17), s: zero, summary: {} }), null);
});

test('saved data is validated', () => {
  const r = sanitize({ gifts: [0, 0, 99, 'x', 3], giftDay: 'nope', chests: -1, levelSeen: 0, quest: { week: 'bad', base: { sorts: 'a' }, giftDays: 99, chest: 'yes' } });
  assert.deepEqual(r.gifts, [0, 3]);
  assert.deepEqual([r.giftDay, r.chests, r.levelSeen, r.quest.week, r.quest.base.sorts, r.quest.giftDays, r.quest.chest], ['', 0, 1, '', 0, 0, false]);
  const q = { quest: { week: '', base: zero, giftDays: 0, chest: false } };
  assert.equal(ensureWeek(q, day(17), zero), true);
  assert.equal(ensureWeek(q, day(18), zero), false);
});

test('every reward string has a Filipino translation', () => {
  const have = new Map(pairs.map((p) => [p[0], p[1]]));
  const strings = [...KEEPSAKES.map((k) => k[1]), ...QUEST_POOL.map((q) => q.label), 'Sprout', 'Seedling', 'Helper', 'Sorter', 'Guardian', 'Champion', 'Hero', 'Legend', 'Daily gift', 'Open gift', 'Keepsakes', 'You found a keepsake!', 'Weekly chest opened!'];
  for (const text of strings) assert.ok(have.has(text), `missing Filipino: ${text}`);
});
