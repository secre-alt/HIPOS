// The little scene behind each keepsake in the viewer: a coloured backdrop, a pedestal with a
// shadow, and drifting bits that fit the keepsake (leaves, drops, stars, snow). Pure decoration.
import { EVENTS } from './events.js';

const PALETTE = {
  green: ['rgba(150, 215, 140, .65)', 'rgba(40, 120, 80, .22)'],
  blue: ['rgba(130, 200, 250, .65)', 'rgba(40, 100, 190, .22)'],
  sun: ['rgba(255, 228, 120, .75)', 'rgba(255, 160, 60, .22)'],
  warm: ['rgba(250, 195, 125, .65)', 'rgba(190, 90, 40, .22)'],
  pink: ['rgba(250, 175, 205, .6)', 'rgba(170, 80, 160, .22)'],
  earthy: ['rgba(205, 175, 135, .65)', 'rgba(110, 80, 50, .25)'],
  gold: ['rgba(255, 228, 135, .75)', 'rgba(200, 150, 40, .25)'],
  red: ['rgba(240, 125, 115, .6)', 'rgba(40, 120, 80, .28)'],
  space: ['#1a2f66', '#050b1e']
};
const THEMES = {
  'Little seed': ['green', '🌱✨'], 'Fresh leaf': ['green', '🍃'], 'Potted plant': ['green', '🍃💧'], 'Recycle badge': ['green', '♻️✨'],
  'Refill bottle': ['blue', '💧'], 'Lunchbox': ['warm', '✨'], 'Reusable fork': ['warm', '✨'], 'Compost pail': ['earthy', '🍂'],
  'Compost worm': ['earthy', '🍂🍃'], 'Autumn leaf': ['warm', '🍂🍁'], 'Tiny tree': ['green', '🍃'], 'Water drop': ['blue', '💧✨'],
  'Little Earth': ['space', ''], 'Sunshine': ['sun', '✨'], 'Rainbow': ['pink', '☁️✨'], 'Butterfly': ['pink', '🌸✨'],
  'Busy bee': ['sun', '🌼✨'], 'Ladybug': ['green', '🍃'], 'Mushroom': ['earthy', '🍃✨'], 'Nest': ['earthy', '🍃🪶'],
  'Sea shell': ['blue', '💧✨'], 'Basket': ['warm', '✨'], 'School bag': ['blue', '⭐✨'], 'Gold star': ['gold', '⭐✨']
};
const FALL = new Set(['🍃', '🍂', '🍁', '🌸', '❄️', '🪶', '🌱']);
const parts = (text) => (!text ? [] : typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text)].map((x) => x.segment) : Array.from(text));

export function themeFor(name) {
  if (THEMES[name]) return { palette: PALETTE[THEMES[name][0]], bits: parts(THEMES[name][1]), space: THEMES[name][0] === 'space' };
  for (const ev of EVENTS) {
    if (ev.items.some((i) => i.name === name) || ev.champion[1] === name) {
      return ev.id === 'wika' ? { palette: PALETTE.gold, bits: ['✨', '🌟'], space: false } : { palette: PALETTE.red, bits: ['❄️', '✨'], space: false };
    }
  }
  return { palette: PALETTE.green, bits: ['✨'], space: false };
}

export function buildScene(name) {
  const theme = themeFor(name);
  const scene = document.createElement('div');
  scene.className = `keepsake-scene${theme.space ? ' is-space' : ''}`;
  scene.setAttribute('aria-hidden', 'true');
  scene.style.setProperty('--scene-a', theme.palette[0]);
  scene.style.setProperty('--scene-b', theme.palette[1]);
  if (theme.space) {
    for (let i = 0; i < 22; i++) {
      const star = document.createElement('i');
      star.className = 'keepsake-star';
      star.style.left = `${(i * 41 + 7) % 96}%`;
      star.style.top = `${(i * 29 + 13) % 94}%`;
      star.style.animationDelay = `${-(i % 7) * 0.45}s`;
      star.style.scale = String(0.6 + (i % 3) * 0.4);
      scene.append(star);
    }
  } else {
    const floor = document.createElement('div'), shadow = document.createElement('div');
    floor.className = 'keepsake-floor'; shadow.className = 'keepsake-shadow';
    scene.append(floor, shadow);
    for (let i = 0; i < 9; i++) {
      const bit = theme.bits[i % theme.bits.length], fx = document.createElement('span');
      fx.className = `keepsake-fx ${FALL.has(bit) ? 'is-fall' : 'is-rise'}`;
      fx.textContent = bit;
      fx.style.left = `${(i * 37 + 9) % 86 + 4}%`;
      fx.style.fontSize = `${(0.85 + (i % 3) * 0.3).toFixed(2)}rem`;
      fx.style.animationDuration = `${5 + (i % 4)}s`;
      fx.style.animationDelay = `${-(i * 0.95).toFixed(2)}s`;
      scene.append(fx);
    }
  }
  return scene;
}
// The shadow narrows when the keepsake turns edge-on.
export function lightScene(scene, yaw) {
  scene.style.setProperty('--sx', (0.45 + 0.55 * Math.abs(Math.cos(yaw))).toFixed(3));
}
