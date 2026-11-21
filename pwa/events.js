// Seasonal event weeks. Each runs for seven days with one small thing per day and a keepsake for
// each. Everything stays on this device. Items stay open for the whole week, so a missed day can
// be caught up, and earned keepsakes are kept for good. Nothing is ever taken away.
import { escapeHTML as e } from './core.js';

// Filipino sentences, meanings and ideas were written by Claude and are listed in
// docs/FILIPINO_REVIEW.md for review. Month is 0-based.
export const WIKA = {
  id: 'wika', name: 'Linggo ng Wika', month: 7, from: 13, to: 19, kind: 'word',
  eyebrow: 'Linggo ng Wika · August 13–19', heading: 'Word of the day',
  intro: 'Learn a Filipino word each day this week and collect a keepsake.',
  button: 'I learned it', done: 'Learned ✓', unit: 'words',
  complete: 'All seven words learned! Wika champion.', revealNew: 'New word learned!', revealChampion: 'Wika champion!',
  collection: 'Linggo ng Wika keepsakes', champion: ['🏅', 'Wika champion'],
  items: [
    { name: 'Basura', meaning: 'waste or trash', example: 'Itapon ang basura sa tamang lalagyan.', english: 'Put waste in the right container.', emoji: '🗑️' },
    { name: 'Kalikasan', meaning: 'nature and the environment', example: 'Alagaan natin ang kalikasan.', english: 'Let us take care of nature.', emoji: '🌿' },
    { name: 'Malinis', meaning: 'clean', example: 'Malinis ang aming silid-aralan.', english: 'Our classroom is clean.', emoji: '🧼' },
    { name: 'Muling gamitin', meaning: 'to use again', example: 'Muling gamitin ang bote ng tubig.', english: 'Reuse the water bottle.', emoji: '🔄' },
    { name: 'Bayanihan', meaning: 'neighbors working together', example: 'Sa bayanihan, gumagaan ang gawain.', english: 'With bayanihan, the work gets lighter.', emoji: '🛖' },
    { name: 'Tubig', meaning: 'water', example: 'Magtipid tayo ng tubig.', english: 'Let us save water.', emoji: '🚰' },
    { name: 'Pag-asa', meaning: 'hope', example: 'Pag-asa ang dala ng maliliit na gawa.', english: 'Small acts bring hope.', emoji: '🌅' }
  ]
};
export const CHRISTMAS = {
  id: 'christmas', name: 'Christmas week', month: 11, from: 19, to: 25, kind: 'idea',
  eyebrow: 'Christmas week · December 19–25', heading: 'Idea of the day',
  intro: 'Try one waste-smart Christmas idea each day this week and collect a keepsake.',
  button: 'I tried it', done: 'Tried ✓', unit: 'ideas',
  complete: 'All seven ideas tried! Christmas star.', revealNew: 'Idea tried!', revealChampion: 'Christmas star!',
  collection: 'Christmas week keepsakes', champion: ['🌟', 'Christmas star'],
  items: [
    { name: 'Cloth wrap', title: 'Wrap with cloth or old paper', detail: 'Use a cloth, a scarf or last year’s paper. Shiny gift wrap is often hard to recycle.', emoji: '🧣' },
    { name: 'Parol', title: 'Make a parol from scrap', detail: 'Build a parol from clean scrap paper, cardboard or bottle caps.', emoji: '🏮' },
    { name: 'Market bag', title: 'Bring your own bag', detail: 'Take a reusable bag when you shop for Noche Buena.', emoji: '🛍️' },
    { name: 'Noche Buena plate', title: 'Plan only what you can eat', detail: 'Cook the right amount. Share extra food with neighbors while it is fresh.', emoji: '🍽️' },
    { name: 'Ribbon', title: 'Reuse a gift box or ribbon', detail: 'Keep boxes, ribbons and bags to use again next year.', emoji: '🎀' },
    { name: 'Real spoon', title: 'Skip single-use plates', detail: 'Use real plates and spoons at the family table and wash up together.', emoji: '🥄' },
    { name: 'Gift of time', title: 'Give a gift of time', detail: 'A hug, a song or a helping hand makes no waste at all.', emoji: '⏳' }
  ]
};
export const EVENTS = [WIKA, CHRISTMAS];
export const XP_PER_ITEM = 10, XP_CHAMPION = 30;
const COUNT = 7;

const KEY = 'hipos.events.v1';
const byId = (id) => EVENTS.find((ev) => ev.id === id);

// ---------- Dates ----------
export function activeEvent(now = new Date()) {
  return EVENTS.find((ev) => now.getMonth() === ev.month && now.getDate() >= ev.from && now.getDate() <= ev.to) || null;
}
export const dayIndex = (now = new Date()) => {
  const ev = activeEvent(now);
  return ev ? now.getDate() - ev.from : -1;
};

// ---------- Saved state: { wika: { "2026": [0, 2] }, christmas: { ... } } ----------
const blank = () => Object.fromEntries(EVENTS.map((ev) => [ev.id, {}]));
export function sanitize(raw) {
  const out = blank();
  if (!raw || typeof raw !== 'object') return out;
  for (const ev of EVENTS) {
    const years = raw[ev.id] && typeof raw[ev.id] === 'object' ? raw[ev.id] : {};
    for (const [year, list] of Object.entries(years)) {
      if (!/^\d{4}$/.test(year) || !Array.isArray(list)) continue;
      out[ev.id][year] = [...new Set(list.filter((i) => Number.isInteger(i) && i >= 0 && i < ev.items.length))].sort((a, b) => a - b);
    }
  }
  return out;
}
export function readEvents(storage = globalThis.localStorage) {
  try { return sanitize(JSON.parse(storage.getItem(KEY) || 'null')); } catch { return blank(); }
}
export function saveEvents(state, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}
const yearList = (state, id, year) => state[id]?.[String(year)] || [];
export const learnedCount = (state, id, year) => yearList(state, id, year).length;
// An item's keepsake is kept once it has been done in any year.
export const ownedItems = (state, id) => new Set(Object.values(state[id] || {}).flat());
export const hasChampion = (state, id) => Object.values(state[id] || {}).some((list) => list.length === COUNT);
export function eventXp(state = readEvents()) {
  return EVENTS.reduce((total, ev) => total + Object.values(state[ev.id] || {}).reduce((sum, list) => sum + list.length * XP_PER_ITEM + (list.length === COUNT ? XP_CHAMPION : 0), 0), 0);
}
// Keepsake groups for the collection page, one per event.
export function eventKeepsakes(state = readEvents()) {
  return EVENTS.map((ev) => {
    const owned = ownedItems(state, ev.id);
    return { event: ev, items: [...ev.items.map((it, i) => ({ emoji: it.emoji, name: it.name, owned: owned.has(i) })), { emoji: ev.champion[0], name: ev.champion[1], owned: hasChampion(state, ev.id) }] };
  });
}

// Does one item. Only items up to today's are open, so nothing can be skipped ahead.
export function completeItem(index, { storage = globalThis.localStorage, now = new Date() } = {}) {
  const ev = activeEvent(now);
  if (!ev || !Number.isInteger(index) || index < 0 || index > dayIndex(now) || index >= ev.items.length) return null;
  const state = readEvents(storage), year = String(now.getFullYear());
  const list = state[ev.id][year] || [];
  if (list.includes(index)) return null;
  state[ev.id][year] = [...list, index].sort((a, b) => a - b);
  saveEvents(state, storage);
  const count = state[ev.id][year].length, champion = count === COUNT, item = ev.items[index];
  return {
    event: ev.id, item: champion ? ev.champion : [item.emoji, item.name], isNew: true, champion,
    xp: XP_PER_ITEM + (champion ? XP_CHAMPION : 0), collected: count, total: COUNT,
    countLabel: `${count} of ${COUNT} ${ev.unit}`,
    heading: champion ? ev.revealChampion : ev.revealNew
  };
}

// ---------- Rendering ----------
function itemBlock(ev, it, i, done, big) {
  const text = ev.kind === 'word'
    ? `<p class="event-term" lang="fil" data-no-translate>${e(it.name)}</p><p class="event-meaning">${it.meaning}</p><p class="event-example" lang="fil" data-no-translate>“${e(it.example)}”</p><p class="event-english"><span>In English:</span> <span data-no-translate>${e(it.english)}</span></p>`
    : `<p class="event-term">${it.title}</p><p class="event-meaning">${it.detail}</p>`;
  return `<div class="event-item${big ? ' event-today' : ''}"><div class="event-art" aria-hidden="true">${it.emoji}</div><div class="event-copy">${text}</div>${done ? `<p class="event-done">${ev.done}</p>` : `<button type="button" class="event-learn" data-event-item="${i}">${ev.button}</button>`}</div>`;
}
export function eventCard({ storage = globalThis.localStorage, now = new Date() } = {}) {
  const ev = activeEvent(now);
  if (!ev) return '';
  const state = readEvents(storage), today = dayIndex(now), done = new Set(yearList(state, ev.id, now.getFullYear()));
  const earlier = ev.items.slice(0, today).map((it, i) => ({ it, i })).reverse();
  return `<section class="event-card card" id="event-card" data-event="${ev.id}" aria-labelledby="event-heading"><p class="eyebrow">${ev.eyebrow}</p><h2 id="event-heading">${ev.heading}</h2><p>${ev.intro}</p>${itemBlock(ev, ev.items[today], today, done.has(today), true)}${earlier.length ? `<details class="event-earlier"><summary>Earlier ${ev.unit}</summary>${earlier.map(({ it, i }) => itemBlock(ev, it, i, done.has(i), false)).join('')}</details>` : ''}<p class="event-count">${done.size} of ${COUNT} ${ev.unit}</p><progress class="gift-meter" value="${done.size}" max="${COUNT}" aria-label="Progress this week">${done.size} of ${COUNT}</progress>${done.size === COUNT ? `<p class="event-champion">${ev.complete}</p>` : ''}</section>`;
}
// Handles the event buttons. `reveal` shows the reward pop-up; `after` refreshes other views.
export function eventClick(button, { reveal, after } = {}) {
  if (!button.hasAttribute('data-event-item')) return false;
  const result = completeItem(Number(button.dataset.eventItem));
  if (result) {
    const card = document.querySelector('#event-card');
    if (card) { const tpl = document.createElement('template'); tpl.innerHTML = eventCard().trim(); card.replaceWith(tpl.content.firstElementChild); }
    reveal?.(result, result.heading);
    after?.();
  }
  return true;
}
export { byId as eventById };
