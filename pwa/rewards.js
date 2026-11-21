// Daily gift, buddy level and weekly quests. Everything stays on this device.
// Design rules: every reward is a gain (nothing is lost for missing a day), the daily gift always
// pays out, and quests are short and finishable.
import { stats, carePoints, todayKey, buddySay, sparkle, cheer, sound, buzz } from './buddy-fx.js';
import { weekSummary } from './engagement.js';
import { escapeHTML as e } from './core.js';
import { eventXp, eventKeepsakes, readEvents } from './events.js';

const KEY = 'hipos.rewards.v1';

// ---------- Keepsakes (the daily gift collection) ----------
export const KEEPSAKES = [
  ['🌱', 'Little seed'], ['🍃', 'Fresh leaf'], ['🪴', 'Potted plant'], ['♻️', 'Recycle badge'],
  ['🧴', 'Refill bottle'], ['🥡', 'Lunchbox'], ['🍴', 'Reusable fork'], ['🪣', 'Compost pail'],
  ['🐛', 'Compost worm'], ['🍂', 'Autumn leaf'], ['🌳', 'Tiny tree'], ['💧', 'Water drop'],
  ['🌍', 'Little Earth'], ['☀️', 'Sunshine'], ['🌈', 'Rainbow'], ['🦋', 'Butterfly'],
  ['🐝', 'Busy bee'], ['🐞', 'Ladybug'], ['🍄', 'Mushroom'], ['🪺', 'Nest'],
  ['🐚', 'Sea shell'], ['🧺', 'Basket'], ['🎒', 'School bag'], ['⭐', 'Gold star']
];
// A fixed, scrambled order so the collection feels like a surprise but is the same on every device.
const ORDER = [12, 0, 7, 19, 3, 15, 9, 22, 5, 17, 1, 13, 20, 8, 23, 4, 11, 16, 2, 21, 6, 14, 10, 18];

// ---------- Levels ----------
export const XP_PER_CARE = 10, XP_PER_GIFT = 5, XP_PER_CHEST = 30;
const TITLES = ['Sprout', 'Seedling', 'Helper', 'Sorter', 'Guardian', 'Champion', 'Hero', 'Legend'];
// Level n starts at 25 * n * (n - 1) / 2 XP: 0, 25, 75, 150, 250, 375 ...
export const xpForLevel = (level) => (25 * level * (level - 1)) / 2;
export function levelFor(xp) {
  const total = Math.max(0, Math.floor(Number(xp)) || 0);
  let level = 1;
  while (xpForLevel(level + 1) <= total && level < 99) level++;
  const start = xpForLevel(level), next = xpForLevel(level + 1);
  return { level, title: TITLES[Math.min(level, TITLES.length) - 1], xp: total, into: total - start, span: next - start, toNext: next - total, pct: Math.round(((total - start) / (next - start)) * 100) };
}
export const totalXp = ({ care = 0, gifts = 0, chests = 0, bonus = 0 }) => care * XP_PER_CARE + gifts * XP_PER_GIFT + chests * XP_PER_CHEST + bonus;

// ---------- Weekly quests ----------
// Progress is counted from a snapshot taken at the start of the week, so it needs no extra hooks.
export const QUEST_POOL = [
  { id: 'sort3', label: 'Finish 3 sorting rounds', target: 3, read: (s) => s.sorts },
  { id: 'compost3', label: 'Finish 3 Compost Catch rounds', target: 3, read: (s) => s.compost },
  { id: 'treats5', label: 'Share 5 treats with your buddy', target: 5, read: (s) => s.treats },
  { id: 'rounds5', label: 'Play 5 game rounds', target: 5, read: (s) => s.sorts + s.compost },
  { id: 'perfect1', label: 'Get a perfect sorting round', target: 1, read: (s) => s.perfect },
  { id: 'gifts4', label: 'Open 4 daily gifts', target: 4, read: (s) => s.giftDays }
];
const pad = (n) => String(n).padStart(2, '0');
const dayId = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// The week starts on Monday (local time).
export function weekId(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dayId(d);
}
export const daysLeftInWeek = (now = new Date()) => 7 - ((now.getDay() + 6) % 7);
export function pickQuests(week) {
  let seed = 0;
  for (const ch of week) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = [...QUEST_POOL], picked = [];
  while (picked.length < 3) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    picked.push(pool.splice(seed % pool.length, 1)[0]);
  }
  return picked;
}

// ---------- Saved state ----------
const blank = () => ({ gifts: [], giftDay: '', chests: 0, levelSeen: 1, quest: { week: '', base: { sorts: 0, compost: 0, treats: 0, perfect: 0 }, giftDays: 0, chest: false } });
const int = (v, max = 1e6) => (Number.isInteger(v) && v >= 0 && v < max ? v : 0);
export function sanitize(raw) {
  const out = blank();
  if (!raw || typeof raw !== 'object') return out;
  if (Array.isArray(raw.gifts)) out.gifts = [...new Set(raw.gifts.filter((i) => Number.isInteger(i) && i >= 0 && i < KEEPSAKES.length))];
  if (typeof raw.giftDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.giftDay)) out.giftDay = raw.giftDay;
  out.chests = int(raw.chests);
  out.levelSeen = Math.max(1, int(raw.levelSeen, 100));
  const q = raw.quest;
  if (q && typeof q === 'object') {
    out.quest.week = typeof q.week === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q.week) ? q.week : '';
    for (const k of Object.keys(out.quest.base)) out.quest.base[k] = int(q.base?.[k]);
    out.quest.giftDays = int(q.giftDays, 8);
    out.quest.chest = q.chest === true;
  }
  return out;
}
export function readRewards(storage = globalThis.localStorage) {
  try { return sanitize(JSON.parse(storage.getItem(KEY) || 'null')); } catch { return blank(); }
}
export function saveRewards(r, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(r)); return true; } catch { return false; }
}
// Starts a new week of quests when the week changes.
export function ensureWeek(r, now = new Date(), s = stats()) {
  const week = weekId(now);
  if (r.quest.week === week) return false;
  r.quest = { week, base: { sorts: s.sorts, compost: s.compost, treats: s.treats, perfect: s.perfect }, giftDays: 0, chest: false };
  return true;
}
function nextKeepsake(collected) {
  const fresh = ORDER.find((i) => !collected.includes(i));
  return fresh === undefined ? null : fresh;
}

// ---------- View model ----------
export function rewardsNow({ storage = globalThis.localStorage, now = new Date(), s = stats(), summary = safeSummary() } = {}) {
  const r = readRewards(storage);
  if (ensureWeek(r, now, s)) saveRewards(r, storage);
  const xp = totalXp({ care: carePoints(summary), gifts: r.gifts.length, chests: r.chests, bonus: eventXp(readEvents(storage)) });
  const level = levelFor(xp);
  const live = { ...s, giftDays: r.quest.giftDays };
  const quests = pickQuests(r.quest.week).map((q) => {
    const value = Math.min(q.target, Math.max(0, q.read(live) - q.read({ ...r.quest.base, giftDays: 0 })));
    return { id: q.id, label: q.label, target: q.target, value, done: value >= q.target };
  });
  return { r, level, quests, allDone: quests.every((q) => q.done), chestOpened: r.quest.chest, giftReady: r.giftDay !== todayKey(now), collected: r.gifts.length };
}
function safeSummary() { try { return weekSummary(); } catch { return {}; } }

// ---------- Actions (return what to show, or null when nothing happened) ----------
export function openGift({ storage = globalThis.localStorage, now = new Date(), s = stats() } = {}) {
  const r = readRewards(storage);
  ensureWeek(r, now, s);
  const day = dayId(now);
  if (r.giftDay === day) return null;
  let id = nextKeepsake(r.gifts), isNew = true;
  if (id === null) { id = ORDER[r.chests % ORDER.length]; isNew = false; }
  if (isNew) r.gifts.push(id);
  r.giftDay = day;
  r.quest.giftDays = Math.min(7, r.quest.giftDays + 1);
  saveRewards(r, storage);
  return { item: KEEPSAKES[id], isNew, xp: XP_PER_GIFT, collected: r.gifts.length, total: KEEPSAKES.length };
}
export function openChest({ storage = globalThis.localStorage, now = new Date(), s = stats(), summary } = {}) {
  const view = rewardsNow({ storage, now, s, summary });
  if (!view.allDone || view.chestOpened) return null;
  const r = view.r;
  let id = nextKeepsake(r.gifts), isNew = true;
  if (id === null) { id = ORDER[r.chests % ORDER.length]; isNew = false; }
  if (isNew) r.gifts.push(id);
  r.quest.chest = true;
  r.chests += 1;
  saveRewards(r, storage);
  return { item: KEEPSAKES[id], isNew, xp: XP_PER_CHEST, collected: r.gifts.length, total: KEEPSAKES.length };
}
// Returns the new level once, the first time it is reached.
export function takeLevelUp({ storage = globalThis.localStorage, now = new Date(), s = stats(), summary } = {}) {
  const view = rewardsNow({ storage, now, s, summary });
  if (view.level.level <= view.r.levelSeen) return null;
  view.r.levelSeen = view.level.level;
  saveRewards(view.r, storage);
  return view.level;
}

// ---------- Rendering ----------
const bar = (value, max, cls, label) => `<progress class="${cls}" value="${value}" max="${max}" aria-label="${e(label)}">${value} of ${max}</progress>`;
export function levelLine() {
  const { level } = rewardsNow();
  return `<p class="buddy-level"><strong>Level ${level.level}</strong> · ${level.title}</p>${bar(level.into, level.span, 'level-meter', 'Progress to the next level')}<p class="buddy-level-next">${level.toNext} XP to Level ${level.level + 1}</p>`;
}
export function giftCard() {
  const v = rewardsNow();
  const body = v.giftReady
    ? `<div class="gift-art gift-ready" aria-hidden="true">🎁</div><div class="gift-copy"><h2 id="gift-heading">Daily gift</h2><p>Your buddy found something for you today.</p></div><button type="button" class="gift-open" data-gift-open>Open gift</button>`
    : `<div class="gift-art" aria-hidden="true">${KEEPSAKES[v.r.gifts.at(-1)]?.[0] ?? '🎁'}</div><div class="gift-copy"><h2 id="gift-heading">Daily gift</h2><p>Opened today. Come back tomorrow for another.</p></div><a class="button-link secondary" href="#avatar">See my collection</a>`;
  return `<section class="daily-gift card" id="daily-gift" aria-labelledby="gift-heading">${body}<p class="gift-count">${v.collected} of ${KEEPSAKES.length} keepsakes</p>${bar(v.collected, KEEPSAKES.length, 'gift-meter', 'Keepsakes collected')}</section>`;
}
export function questsCard() {
  const v = rewardsNow();
  const items = v.quests.map((q) => `<li class="${q.done ? 'quest-done' : ''}"><span class="quest-label">${q.label}</span><span class="quest-count">${q.value} of ${q.target}</span>${bar(q.value, q.target, 'quest-meter', q.label)}</li>`).join('');
  const chest = v.chestOpened
    ? '<p class="quest-chest">Chest opened. New quests on Monday.</p>'
    : v.allDone
      ? '<button type="button" class="quest-chest-open" data-chest-open>Open the weekly chest</button>'
      : '<p class="quest-chest">Finish all three to open the weekly chest.</p>';
  return `<section class="quests card" id="weekly-quests" aria-labelledby="quests-heading"><h2 id="quests-heading">This week’s quests</h2><p>Short goals with a chest at the end. New quests every Monday.</p><ul class="quest-list">${items}</ul>${chest}</section>`;
}
function eventCollection() {
  const list = eventKeepsakes();
  if (!list.some((k) => k.owned)) return '';
  const cells = list.map((k) => (k.owned ? `<li class="keepsake"><span aria-hidden="true">${k.emoji}</span><small>${k.name}</small></li>` : '<li class="keepsake keepsake-locked"><span aria-hidden="true">?</span><small>Not found yet</small></li>')).join('');
  return `<h3>Linggo ng Wika keepsakes</h3><ul class="keepsake-grid">${cells}</ul>`;
}
export function collectionCard() {
  const v = rewardsNow(), have = new Set(v.r.gifts);
  const cells = KEEPSAKES.map(([emoji, name], i) => have.has(i)
    ? `<li class="keepsake"><span aria-hidden="true">${emoji}</span><small>${name}</small></li>`
    : '<li class="keepsake keepsake-locked"><span aria-hidden="true">?</span><small>Not found yet</small></li>').join('');
  return `<section class="card keepsakes" id="keepsakes" aria-labelledby="keepsakes-heading"><h2 id="keepsakes-heading">Keepsakes</h2><p>${v.collected} of ${KEEPSAKES.length} keepsakes</p>${bar(v.collected, KEEPSAKES.length, 'gift-meter', 'Keepsakes collected')}<ul class="keepsake-grid">${cells}</ul><p class="note">Open your daily gift on Home to find the next one.</p>${eventCollection()}</section>`;
}

// ---------- Behaviour ----------
export function revealReward(result, heading) {
  if (typeof document === 'undefined') return;
  document.querySelector('#reward-modal')?.remove();
  const [emoji, name] = result.item;
  const dialog = document.createElement('dialog');
  dialog.id = 'reward-modal';
  dialog.className = 'sort-answer-panel reward-modal';
  dialog.setAttribute('aria-labelledby', 'reward-title');
  dialog.innerHTML = `<div class="reward-emoji" aria-hidden="true">${emoji}</div><h3 id="reward-title">${e(heading)}</h3><p class="reward-name">${result.isNew ? e(name) : e(name) + ' again'}</p><p class="reward-xp">+${result.xp} XP</p><p class="reward-count">${e(result.countLabel || `${result.collected} of ${result.total} keepsakes`)}</p><div class="actions"><button type="button" data-reward-close>Nice!</button></div>`;
  dialog.addEventListener('click', (event) => { if (event.target === dialog || event.target.closest('[data-reward-close]')) dialog.close(); });
  dialog.addEventListener('close', () => { dialog.remove(); announceLevelUp(); });
  document.body.append(dialog);
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  dialog.querySelector('[data-reward-close]').focus({ preventScroll: true });
  sound('unlock'); buzz(15); sparkle(dialog.querySelector('.reward-emoji'), 10);
}
export function refreshRewardViews() {
  const swap = (selector, html) => { const el = document.querySelector(selector); if (el) { const tpl = document.createElement('template'); tpl.innerHTML = html.trim(); el.replaceWith(tpl.content.firstElementChild); } };
  swap('#daily-gift', giftCard());
  swap('#weekly-quests', questsCard());
  const strip = document.querySelector('.buddy-strip .buddy-level-box');
  if (strip) strip.innerHTML = levelLine();
  const keeps = document.querySelector('#keepsakes');
  if (keeps) swap('#keepsakes', collectionCard());
}
export function announceLevelUp() {
  const up = takeLevelUp();
  if (!up) return;
  cheer('complete');
  buddySay(`Level ${up.level}! You are now a ${up.title}.`, { ms: 4500 });
  refreshRewardViews();
}
// Handles the gift and chest buttons from the page's click handler. Returns true when it handled one.
export function rewardClick(button) {
  if (button.hasAttribute('data-gift-open')) {
    const result = openGift();
    if (result) { revealReward(result, 'You found a keepsake!'); refreshRewardViews(); }
    return true;
  }
  if (button.hasAttribute('data-chest-open')) {
    const result = openChest();
    if (result) { revealReward(result, 'Weekly chest opened!'); refreshRewardViews(); }
    return true;
  }
  return false;
}
