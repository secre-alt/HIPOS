// Linggo ng Wika (Filipino Language Week, August 13 to 19): one Filipino word a day, each with a
// keepsake. Everything stays on this device. Words stay open for the whole week, so a missed day
// can be caught up, and learned words and their keepsakes are kept for good.
import { escapeHTML as e } from './core.js';

export const WIKA = { id: 'wika', name: 'Linggo ng Wika', month: 7, from: 13, to: 19 }; // month is 0-based (August)
// Filipino sentences were written by Claude and are listed in docs/FILIPINO_REVIEW.md for review.
export const WORDS = [
  { word: 'Basura', meaning: 'waste or trash', example: 'Itapon ang basura sa tamang lalagyan.', english: 'Put waste in the right container.', emoji: '🗑️' },
  { word: 'Kalikasan', meaning: 'nature and the environment', example: 'Alagaan natin ang kalikasan.', english: 'Let us take care of nature.', emoji: '🌿' },
  { word: 'Malinis', meaning: 'clean', example: 'Malinis ang aming silid-aralan.', english: 'Our classroom is clean.', emoji: '🧼' },
  { word: 'Muling gamitin', meaning: 'to use again', example: 'Muling gamitin ang bote ng tubig.', english: 'Reuse the water bottle.', emoji: '🔄' },
  { word: 'Bayanihan', meaning: 'neighbors working together', example: 'Sa bayanihan, gumagaan ang gawain.', english: 'With bayanihan, the work gets lighter.', emoji: '🛖' },
  { word: 'Tubig', meaning: 'water', example: 'Magtipid tayo ng tubig.', english: 'Let us save water.', emoji: '🚰' },
  { word: 'Pag-asa', meaning: 'hope', example: 'Pag-asa ang dala ng maliliit na gawa.', english: 'Small acts bring hope.', emoji: '🌅' }
];
export const CHAMPION = ['🏅', 'Wika champion'];
export const XP_PER_WORD = 10, XP_CHAMPION = 30;

const KEY = 'hipos.events.v1';

// ---------- Dates ----------
export function activeEvent(now = new Date()) {
  return now.getMonth() === WIKA.month && now.getDate() >= WIKA.from && now.getDate() <= WIKA.to ? WIKA : null;
}
export const dayIndex = (now = new Date()) => (activeEvent(now) ? now.getDate() - WIKA.from : -1);

// ---------- Saved state: { wika: { "2026": [0, 2, 3] } } ----------
const blank = () => ({ wika: {} });
export function sanitize(raw) {
  const out = blank();
  const years = raw && typeof raw === 'object' && raw.wika && typeof raw.wika === 'object' ? raw.wika : {};
  for (const [year, list] of Object.entries(years)) {
    if (!/^\d{4}$/.test(year) || !Array.isArray(list)) continue;
    out.wika[year] = [...new Set(list.filter((i) => Number.isInteger(i) && i >= 0 && i < WORDS.length))].sort((a, b) => a - b);
  }
  return out;
}
export function readEvents(storage = globalThis.localStorage) {
  try { return sanitize(JSON.parse(storage.getItem(KEY) || 'null')); } catch { return blank(); }
}
export function saveEvents(state, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}
const yearList = (state, year) => state.wika[String(year)] || [];
export const learnedCount = (state, year) => yearList(state, year).length;
// A word's keepsake is kept once it has been learned in any year.
export const ownedWords = (state) => new Set(Object.values(state.wika).flat());
export const hasChampion = (state) => Object.values(state.wika).some((list) => list.length === WORDS.length);
export function eventXp(state = readEvents()) {
  return Object.values(state.wika).reduce((sum, list) => sum + list.length * XP_PER_WORD + (list.length === WORDS.length ? XP_CHAMPION : 0), 0);
}
export function eventKeepsakes(state = readEvents()) {
  const owned = ownedWords(state);
  return [...WORDS.map((w, i) => ({ emoji: w.emoji, name: w.word, owned: owned.has(i) })), { emoji: CHAMPION[0], name: CHAMPION[1], owned: hasChampion(state) }];
}

// Learns a word. Only words up to today's are open, so nothing can be skipped ahead.
export function learnWord(index, { storage = globalThis.localStorage, now = new Date() } = {}) {
  if (!activeEvent(now) || !Number.isInteger(index) || index < 0 || index > dayIndex(now) || index >= WORDS.length) return null;
  const state = readEvents(storage), year = String(now.getFullYear());
  const list = state.wika[year] || [];
  if (list.includes(index)) return null;
  state.wika[year] = [...list, index].sort((a, b) => a - b);
  saveEvents(state, storage);
  const champion = state.wika[year].length === WORDS.length;
  const word = WORDS[index];
  return {
    item: champion ? CHAMPION : [word.emoji, word.word], isNew: true, champion,
    xp: XP_PER_WORD + (champion ? XP_CHAMPION : 0),
    collected: state.wika[year].length, total: WORDS.length, countLabel: `${state.wika[year].length} of ${WORDS.length} words`
  };
}

// ---------- Rendering ----------
const wordBlock = (w, i, learned, big) => `<div class="wika-word${big ? ' wika-today' : ''}"><div class="wika-art" aria-hidden="true">${w.emoji}</div><div class="wika-copy"><p class="wika-term" lang="fil" data-no-translate>${e(w.word)}</p><p class="wika-meaning">${w.meaning}</p><p class="wika-example" lang="fil" data-no-translate>“${e(w.example)}”</p><p class="wika-english"><span>In English:</span> <span data-no-translate>${e(w.english)}</span></p></div>${learned ? '<p class="wika-done">Learned ✓</p>' : `<button type="button" class="wika-learn" data-wika-learn="${i}">I learned it</button>`}</div>`;
export function wikaCard({ storage = globalThis.localStorage, now = new Date() } = {}) {
  if (!activeEvent(now)) return '';
  const state = readEvents(storage), today = dayIndex(now), learned = new Set(yearList(state, now.getFullYear()));
  const earlier = WORDS.slice(0, today).map((w, i) => ({ w, i })).reverse();
  const done = learned.size === WORDS.length;
  return `<section class="wika-event card" id="wika-event" aria-labelledby="wika-heading"><p class="eyebrow">Linggo ng Wika · August 13–19</p><h2 id="wika-heading">Word of the day</h2><p>Learn a Filipino word each day this week and collect a keepsake.</p>${wordBlock(WORDS[today], today, learned.has(today), true)}${earlier.length ? `<details class="wika-earlier"><summary>Earlier words</summary>${earlier.map(({ w, i }) => wordBlock(w, i, learned.has(i), false)).join('')}</details>` : ''}<p class="wika-count">${learned.size} of ${WORDS.length} words</p><progress class="gift-meter" value="${learned.size}" max="${WORDS.length}" aria-label="Words learned">${learned.size} of ${WORDS.length}</progress>${done ? '<p class="wika-champion">All seven words learned! Wika champion.</p>' : ''}</section>`;
}
// Handles the "I learned it" buttons. `reveal` shows the reward pop-up; `after` refreshes other views.
export function eventClick(button, { reveal, after } = {}) {
  if (!button.hasAttribute('data-wika-learn')) return false;
  const result = learnWord(Number(button.dataset.wikaLearn));
  if (result) {
    const card = document.querySelector('#wika-event');
    if (card) { const tpl = document.createElement('template'); tpl.innerHTML = wikaCard().trim(); card.replaceWith(tpl.content.firstElementChild); }
    reveal?.(result, result.champion ? 'Wika champion!' : 'New word learned!');
    after?.();
  }
  return true;
}
