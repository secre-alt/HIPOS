// The buddy hops from card to card as you scroll, alternating left and right,
// and says one short line when it lands. Everything stays on the device.
import { buddySay, hideBubble, cheersOn } from './buddy-fx.js';

const SIZE = 48;
const CARDS = [
  '#view > section', '#view > article', '#view > form',
  '#view > div[class$="-page"] > section', '.buddy-editor > section', '.buddy-editor > form',
  '.prevent-tip', '.reuse-item', '.visual-waste-card', '.carry-steps > li', '.arcade-card'
].join(',');
// The game boards stay clear so the buddy never covers a control mid-game.
const SKIP = '.sort-game,.compost-game';

// [selector, lines]. First match wins; a list of lines rotates card by card.
export const PERCH_LINES = [
  ['.home-intro', ['Hi! Let us look around.']],
  ['.waste-checker', ['Tap what you are holding.']],
  ['.home-today', ['Tick off today’s habits.']],
  ['.buddy-strip', ['That is me! Say hi.']],
  ['.recent-guides', ['Look back at these.']],
  ['.home-next', ['Pick one small change.']],
  ['.games-strip', ['Need a quick break?']],
  ['#weekly-activity', ['Look how far you came!']],
  ['.school-info', ['Know who to ask.']],
  ['.classify-page .prevent-hero', ['Know what you carry.']],
  ['.carry-page .prevent-hero', ['Carry out with care.']],
  ['.prevent-hero', ['Stop waste early!']],
  ['.reuse-hero', ['Use it again!']],
  ['.prevent-tip', ['Try this tip!', 'Small habit, big help.', 'Easy, right?']],
  ['.reuse-item', ['Wash it, use it!', 'Keep it going.', 'Great idea to reuse.']],
  ['.reuse-scheme', ['A neat school idea!']],
  ['.guide-tools', ['Search for an item.']],
  ['.visual-waste-card', ['Check the guide.', 'Clean and dry first.', 'Sort it right.']],
  ['.carry-steps > li', ['Step by step.', 'Almost there!', 'You can do it.']],
  ['.arcade-sort', ['A fun sorting game!']],
  ['.arcade-compost', ['Catch the scraps!']],
  ['.arcade-garden', ['Grow some flowers!']],
  ['.games-rewards', ['Unlock new buddies!']],
  ['.buddy-nickname', ['Give me a name!']],
  ['.buddy-stage', ['Do I look great?']],
  ['.buddy-options', ['Pick my new look!']],
  ['.sticker-book', ['Collect every sticker!']],
  ['.garden', ['Look how they grow!']],
  ['.version-card', ['Always ready offline.']],
  ['.intro', ['Take a look around!']]
];
export const FALLBACK_LINES = ['Keep going!', 'You are doing great.', 'Small steps count.'];
export const allPerchLines = () => [...PERCH_LINES.flatMap((x) => x[1]), ...FALLBACK_LINES];

// Pure helpers (unit tested).
export const sideFor = (index) => (index % 2 === 0 ? 'left' : 'right');
export function pickActive(tops, line, atBottom = false) {
  if (!tops.length) return -1;
  if (atBottom) return tops.length - 1;
  let found = 0;
  tops.forEach((top, i) => { if (top <= line) found = i; });
  return found;
}
export function lineFor(el, index) {
  for (const [selector, lines] of PERCH_LINES) {
    if (el.matches(selector)) return lines[index % lines.length];
  }
  return FALLBACK_LINES[index % FALLBACK_LINES.length];
}

let dock = null, link = null, cards = [], active = -1, hop = null, pos = null, ready = false;
let said = new Set(), sayTimer = 0, pageKey = '', queued = false;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// The sticky top bar is the only thing the buddy must stay below.
const headBottom = () => Math.max(60, document.querySelector('aside')?.getBoundingClientRect().bottom || 0) + 4;
function bottomLimit() {
  const nav = document.querySelector('.mobile-bottom-nav');
  return nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect().top : innerHeight;
}
function collect() {
  const all = [...document.querySelectorAll(CARDS)].filter((el) => !el.matches(SKIP) && el.offsetHeight >= 90);
  return all.filter((el) => !all.some((other) => other !== el && el.contains(other)));
}
function target(i) {
  const r = cards[i].getBoundingClientRect();
  const x = sideFor(i) === 'left' ? Math.max(8, r.left + 12) : Math.min(innerWidth - SIZE - 8, r.right - 12 - SIZE);
  let y = Math.min(r.top - (SIZE - 8), r.bottom - SIZE - 8, bottomLimit() - SIZE - 8);
  y = Math.max(y, headBottom());
  return { x, y };
}
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function draw(now) {
  if (!dock || active < 0 || !cards[active]?.isConnected) return;
  const t = target(active);
  let { x, y } = t, sx = 1, sy = 1;
  if (hop) {
    const p = Math.min(1, (now - hop.t0) / hop.dur), e = ease(p);
    x = hop.from.x + (t.x - hop.from.x) * e;
    y = hop.from.y + (t.y - hop.from.y) * e - Math.sin(Math.PI * p) * 64;
    if (p < 0.15) { sy = 1 - 0.22 * (p / 0.15); sx = 1 + 0.14 * (p / 0.15); }
    else if (p < 0.85) { sy = 1.1; sx = 0.94; }
    else { const q = (p - 0.85) / 0.15; sy = 0.8 + 0.2 * q; sx = 1.12 - 0.12 * q; }
    if (p >= 1) hop = null;
  }
  pos = { x: t.x, y: t.y, drawX: x, drawY: y };
  dock.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`;
  // Squash the artwork, not the tap target, so the button never shrinks below 44px.
  const art = link.querySelector('.hipos-avatar');
  if (art) art.style.scale = sx === 1 && sy === 1 ? '' : `${sx} ${sy}`;
  if (hop) requestAnimationFrame(draw);
}

function sayFor(i) {
  const el = cards[i];
  if (!el || said.has(el) || i !== active || document.hidden) return;
  said.add(el);
  if (document.querySelector('#buddy-say:not([hidden]),dialog[open]')) return;
  buddySay(lineFor(el, i), { ms: 2600, voice: false });
}

function update() {
  queued = false;
  if (!dock) return;
  cards = collect();
  if (!cards.length) { stop(); return; }
  const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
  const next = pickActive(cards.map((c) => c.getBoundingClientRect().top), innerHeight * 0.35, atBottom);
  dock.dataset.perch = 'on';
  if (next !== active || !cards[active]?.isConnected) {
    const first = !pos;
    active = next;
    dock.dataset.side = sideFor(active);
    clearTimeout(sayTimer);
    if (first) {
      said.add(cards[active]);
      hop = null;
    } else {
      if (document.querySelector('#buddy-say:not([hidden])')) hideBubble();
      const animated = !reduced() && cheersOn();
      hop = animated ? { from: { x: pos.drawX, y: pos.drawY }, t0: performance.now(), dur: 520 } : null;
      sayTimer = setTimeout(() => sayFor(active), animated ? 620 : 250);
    }
  }
  draw(performance.now());
}
const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
function stop() {
  clearTimeout(sayTimer);
  active = -1; pos = null; hop = null;
  if (dock) { delete dock.dataset.perch; delete dock.dataset.side; dock.style.transform = ''; }
  const art = link?.querySelector('.hipos-avatar');
  if (art) art.style.scale = '';
}

// Call after every page render.
export function refreshPerch() {
  if (!ready) {
    dock = document.querySelector('.buddy-dock');
    link = document.querySelector('#avatar-link');
    if (!dock || !link) return;
    ready = true;
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    const view = document.querySelector('#view');
    if (view && typeof ResizeObserver === 'function') new ResizeObserver(schedule).observe(view);
  }
  const key = location.hash || '#home';
  if (key !== pageKey) { pageKey = key; said = new Set(); active = -1; }
  schedule();
}
