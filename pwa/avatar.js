// HIPOS buddy avatars (Leaf, Bottle, Paper, Hippo, Volt): layered inline SVG, no images or network.
// The choice is a tiny config saved on this device only. It is never part of report QR codes.
// Visible labels are English here; i18n.js translates them like the rest of the interface.

import { escapeHTML as esc } from './core.js';

const NICKNAME_KEY = 'hipos.buddy.nickname.v1';
export const normalizeNickname = (value) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim().slice(0, 24) : '';
export function loadNickname() {
  try { return normalizeNickname(localStorage.getItem(NICKNAME_KEY)); } catch { return ''; }
}
export function saveNickname(value) {
  try { localStorage.setItem(NICKNAME_KEY, normalizeNickname(value)); return true; } catch { return false; }
}
export function submitNickname(form) {
  const input = form.querySelector('#buddy-nickname');
  input.value = normalizeNickname(input.value);
  const saved = saveNickname(input.value);
  const heading = document.querySelector('#buddy-name');
  if (heading) {
    const nickname = loadNickname();
    heading.toggleAttribute('data-no-translate', Boolean(nickname));
    heading.textContent = nickname || 'Your buddy';
  }
  document.querySelector('#notice').textContent = saved ? 'Nickname saved. Looking cute!' : 'Could not save your buddy. Browser storage may be unavailable.';
}

const INK = '#2F3A33';
const BLUSH = '#FF8FA3';
const STORAGE_KEY = 'hipos.avatar.v1';

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const target = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  const ch = (v) => Math.round((target - v) * p + v);
  const out = [n >> 16, (n >> 8) & 255, n & 255].map(ch);
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ---------- Characters ----------
// faceY: vertical centre of the face. top/sl/sr: anchor points for accessories
// (top of head, upper-left, upper-right).
export const CHARACTERS = [
  {
    id: 'leaf',
    name: 'Leaf',
    colors: ['#7ED68F', '#B8E26A', '#6FD3C0', '#FFB46B'],
    faceY: 62,
    top: { x: 60, y: 14 },
    sl: { x: 44, y: 31 },
    sr: { x: 76, y: 31 },
    corner: { x: 98, y: 26 },
    body(hex) {
      const dark = shade(hex, -0.25);
      return `
<path d="M60 14 Q60 6 68 4" fill="none" stroke="${dark}" stroke-width="3.5" stroke-linecap="round"/>
<path d="M60 12 C94 28 104 62 90 88 C82 102 70 106 60 106 C50 106 38 102 30 88 C16 62 26 28 60 12 Z" fill="${hex}"/>
<path d="M60 106 V88 M60 100 L47 92 M60 100 L73 92" fill="none" stroke="${dark}" stroke-width="2.4" stroke-linecap="round" opacity=".4"/>
<ellipse cx="42" cy="38" rx="5.5" ry="11" transform="rotate(24 42 38)" fill="#fff" opacity=".38"/>`;
    },
  },
  {
    id: 'bottle',
    name: 'Bottle',
    colors: ['#8FD3F4', '#FFB3C7', '#C9B8F5', '#9FE3C4'],
    faceY: 64,
    top: { x: 60, y: 10 },
    sl: { x: 41, y: 38 },
    sr: { x: 79, y: 38 },
    corner: { x: 98, y: 26 },
    body(hex) {
      const dark = shade(hex, -0.28);
      return `
<rect x="47" y="10" width="26" height="14" rx="5" fill="${dark}"/>
<path d="M54 13 V21 M60 13 V21 M66 13 V21" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".4"/>
<rect x="51" y="22" width="18" height="12" rx="3" fill="${hex}"/>
<rect x="30" y="30" width="60" height="78" rx="24" fill="${hex}"/>
<rect x="38" y="42" width="6" height="26" rx="3" fill="#fff" opacity=".42"/>
<rect x="40" y="91" width="40" height="9" rx="4.5" fill="#fff" opacity=".38"/>`;
    },
  },
  {
    id: 'paper',
    name: 'Paper',
    colors: ['#FFF6DC', '#FFFFFF', '#EBCB9C', '#FFD6E0'],
    faceY: 58,
    top: { x: 50, y: 14 },
    sl: { x: 40, y: 25 },
    sr: { x: 58, y: 26 },
    corner: { x: 18, y: 27 },
    body(hex) {
      const dark = shade(hex, -0.12);
      const line = shade(hex, -0.3);
      return `
<path d="M38 14 H70 L94 38 V94 Q94 106 82 106 H38 Q26 106 26 94 V26 Q26 14 38 14 Z" fill="${hex}" stroke="rgba(47,58,51,.16)" stroke-width="2" stroke-linejoin="round"/>
<path d="M70 14 V32 Q70 38 76 38 H94 Z" fill="${dark}" stroke="rgba(47,58,51,.16)" stroke-width="2" stroke-linejoin="round"/>
<path d="M40 92 H80 M40 99 H66" fill="none" stroke="${line}" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>`;
    },
  },
  {
    // The app's namesake: a chubby, round hippo with tiny ears and a big soft snout.
    id: 'hippo',
    name: 'Hippo',
    colors: ['#B9A6E6', '#8FD3F4', '#F7B6C8', '#A8D5A2'],
    faceY: 52,
    top: { x: 60, y: 22 },
    sl: { x: 44, y: 33 },
    sr: { x: 76, y: 33 },
    corner: { x: 98, y: 26 },
    body(hex) {
      const dark = shade(hex, -0.22);
      const snout = shade(hex, 0.4);
      const nose = shade(hex, -0.4);
      return `
<ellipse cx="43" cy="105" rx="11" ry="6" fill="${dark}"/>
<ellipse cx="77" cy="105" rx="11" ry="6" fill="${dark}"/>
<circle cx="33" cy="30" r="10" fill="${hex}"/><circle cx="33" cy="31" r="5.2" fill="${BLUSH}" opacity=".7"/>
<circle cx="87" cy="30" r="10" fill="${hex}"/><circle cx="87" cy="31" r="5.2" fill="${BLUSH}" opacity=".7"/>
<ellipse cx="60" cy="64" rx="42" ry="43" fill="${hex}"/>
<ellipse cx="60" cy="79" rx="31" ry="23" fill="${snout}"/>
<ellipse cx="50" cy="76" rx="3.2" ry="4.4" fill="${nose}" opacity=".6"/><ellipse cx="70" cy="76" rx="3.2" ry="4.4" fill="${nose}" opacity=".6"/>
<ellipse cx="38" cy="38" rx="6" ry="11" transform="rotate(30 38 38)" fill="#fff" opacity=".34"/>`;
    },
  },
  {
    // Hazardous waste, but friendly: a tough little battery with hazard tape, a bolt and sparks.
    // Batteries never go in the pouch, so Volt is the buddy that says "ask school staff".
    id: 'volt',
    name: 'Volt',
    colors: ['#FFD84D', '#FF8A3D', '#B07CFF', '#6BE0A0'],
    faceY: 54,
    top: { x: 60, y: 14 },
    sl: { x: 44, y: 29 },
    sr: { x: 76, y: 29 },
    corner: { x: 98, y: 26 },
    body(hex) {
      const dark = shade(hex, -0.3);
      const tape = '#FFD84D';
      return `
<path d="M20 52 l7 -5 -3 8 8 -6" fill="none" stroke="#FFD84D" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M100 66 l-7 -5 3 8 -8 -6" fill="none" stroke="#FFD84D" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="49" y="12" width="22" height="13" rx="4.5" fill="${dark}"/>
<rect x="29" y="22" width="62" height="86" rx="20" fill="${hex}"/>
<rect x="29" y="78" width="62" height="13" fill="${tape}"/>
<path d="M36 78 h9 l-9 13 h-7 v-6 z M54 78 h9 l-9 13 h-9 z M72 78 h9 l-9 13 h-9 z M90 78 v6 l-7 7 h-5 l9 -13 z" fill="${INK}" opacity=".88"/>
<path d="M29 78 h62 M29 91 h62" stroke="${INK}" stroke-width="1.6" opacity=".6"/>
<path d="M79 26 l-6.5 8.5 h4.5 l-2.5 7 8 -10 h-4.5 z" fill="#fff" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round" opacity=".95"/>
<ellipse cx="38" cy="46" rx="4.5" ry="10" transform="rotate(8 38 46)" fill="#fff" opacity=".4"/>`;
    },
  },
];

// ---------- Faces (drawn around 0,0 = face centre) ----------
const blush = `<ellipse cx="-20" cy="9" rx="5" ry="3.2" fill="${BLUSH}" opacity=".55"/><ellipse cx="20" cy="9" rx="5" ry="3.2" fill="${BLUSH}" opacity=".55"/>`;
const dotEye = (x, r) => `<circle cx="${x}" cy="-2" r="${r}" fill="${INK}"/>`;

export const FACES = [
  {
    id: 'happy',
    name: 'Happy',
    draw: () =>
      `<g class="av-eyes">${dotEye(-14, 4.6)}${dotEye(14, 4.6)}<circle cx="-12.6" cy="-3.6" r="1.5" fill="#fff"/><circle cx="15.4" cy="-3.6" r="1.5" fill="#fff"/></g>${blush}<path d="M-6 7 Q0 14 6 7" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
  },
  {
    id: 'joy',
    name: 'Joyful',
    draw: () =>
      `<g class="av-eyes"><path d="M-19 0 Q-14 -8 -9 0 M9 0 Q14 -8 19 0" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/></g>${blush}<path d="M-7 6 Q0 19 7 6 Z" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><ellipse cx="0" cy="12" rx="3.2" ry="2" fill="${BLUSH}"/>`,
  },
  {
    id: 'sparkle',
    name: 'Sparkly',
    draw: () =>
      `<g class="av-eyes"><circle cx="-14" cy="-2" r="6" fill="${INK}"/><circle cx="14" cy="-2" r="6" fill="${INK}"/><circle cx="-16" cy="-4.4" r="2.2" fill="#fff"/><circle cx="12" cy="-4.4" r="2.2" fill="#fff"/><circle cx="-11.6" cy="0.6" r="1.1" fill="#fff"/><circle cx="16.4" cy="0.6" r="1.1" fill="#fff"/></g>${blush}<ellipse cx="0" cy="9" rx="2.6" ry="3" fill="${INK}"/>`,
  },
  {
    id: 'wink',
    name: 'Winky',
    draw: () =>
      `<g class="av-eyes"><path d="M-19 -1 Q-14 -7 -9 -1" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>${dotEye(14, 4.6)}<circle cx="15.4" cy="-3.6" r="1.5" fill="#fff"/></g>${blush}<path d="M-8 6 Q-4 12 0 6 Q4 12 8 6" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    // Angled brows and a tiny fang: tough, but the rosy cheeks keep it cute.
    id: 'fierce',
    name: 'Fierce',
    draw: () =>
      `<g class="av-eyes"><path d="M-21 -11 L-7 -5 M21 -11 L7 -5" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>${dotEye(-13, 4.4)}${dotEye(13, 4.4)}<circle cx="-11.8" cy="-3.4" r="1.4" fill="#fff"/><circle cx="14.2" cy="-3.4" r="1.4" fill="#fff"/></g>${blush}<path d="M-9 7 Q0 15 9 7" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M-5.2 10.2 L-3.2 15.4 L-0.8 11.6 Z" fill="#fff" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`,
  },
];

// ---------- Accessories ----------
const star = (x, y, s, fill) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7 Z" fill="${fill}"/>`;

export const ACCESSORIES = [
  { id: 'none', name: 'None', draw: () => '' },
  {
    id: 'bow',
    name: 'Bow',
    draw: ({ sl }) =>
      `<g transform="translate(${sl.x} ${sl.y}) rotate(-18)"><path d="M0 0 L-12 -8 V8 Z M0 0 L12 -8 V8 Z" fill="#FF7FA5" stroke="#E85C89" stroke-width="1.4" stroke-linejoin="round"/><circle r="4" fill="#FF5C8A"/></g>`,
  },
  {
    id: 'glasses',
    name: 'Glasses',
    draw: ({ faceY }) =>
      `<g transform="translate(60 ${faceY})" fill="#fff" fill-opacity=".28" stroke="${INK}" stroke-width="2.2"><circle cx="-14" cy="-2" r="8.8"/><circle cx="14" cy="-2" r="8.8"/><path d="M-5.2 -2 H5.2" fill="none"/></g>`,
  },
  {
    id: 'crown',
    name: 'Crown',
    draw: ({ top }) =>
      `<g transform="translate(${top.x} ${top.y + 3})"><path d="M-14 0 V-12 L-7 -5 L0 -15 L7 -5 L14 -12 V0 Z" fill="#FFD25A" stroke="#E0A800" stroke-width="1.6" stroke-linejoin="round"/><circle cx="0" cy="-5" r="2" fill="#FF7FA5"/></g>`,
  },
  {
    id: 'flower',
    name: 'Flower',
    draw: ({ sr }) => {
      const petals = [0, 72, 144, 216, 288]
        .map((a) => {
          const r = (a * Math.PI) / 180;
          return `<circle cx="${(Math.cos(r) * 5.6).toFixed(1)}" cy="${(Math.sin(r) * 5.6).toFixed(1)}" r="4.6" fill="#FFFFFF" stroke="#F3A6BC" stroke-width="1.2"/>`;
        })
        .join('');
      return `<g transform="translate(${sr.x} ${sr.y})">${petals}<circle r="3.6" fill="#FFC94D"/></g>`;
    },
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    draw: () => star(15, 24, 1.1, '#FFC94D') + star(106, 34, 0.8, '#FFFFFF') + star(102, 94, 1, '#FFC94D') + star(16, 90, 0.7, '#FFFFFF'),
  },
  // Unlockable extras: purely cosmetic. Each is earned once and kept for good.
  {
    id: 'sprout',
    name: 'Sprout',
    unlock: 'first',
    hint: 'Complete your first action.',
    draw: ({ top }) =>
      `<g transform="translate(${top.x} ${top.y + 3})"><path d="M0 0 V-8" stroke="#3F8F5A" stroke-width="2.6" stroke-linecap="round"/><path d="M0 -8 C-4 -16 -13 -14 -14 -8 C-9 -5 -3 -6 0 -8Z" fill="#7ED68F" stroke="#3F8F5A" stroke-width="1.2" stroke-linejoin="round"/><path d="M0 -8 C4 -16 13 -14 14 -8 C9 -5 3 -6 0 -8Z" fill="#A6E889" stroke="#3F8F5A" stroke-width="1.2" stroke-linejoin="round"/></g>`,
  },
  {
    id: 'headband',
    name: 'Hero headband',
    unlock: 'habits',
    hint: 'Check off all three habits in one day.',
    draw: ({ faceY }) => {
      const y = faceY - 18;
      return `<path d="M30 ${y} Q60 ${y - 5} 90 ${y} V${y + 7} Q60 ${y + 2} 30 ${y + 7} Z" fill="#FF6B6B" stroke="#D94A4A" stroke-width="1.2" stroke-linejoin="round"/>` +
        `<path d="M88 ${y + 3} L101 ${y - 3} L98 ${y + 5} Z M88 ${y + 3} L100 ${y + 11} L96 ${y + 2} Z" fill="#FF6B6B" stroke="#D94A4A" stroke-width="1.2" stroke-linejoin="round"/>` +
        star(60, y + 2, 0.55, '#FFFFFF');
    },
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    unlock: 'streak3',
    hint: 'Be active three days in a row.',
    draw: ({ corner }) =>
      `<g transform="translate(${corner.x} ${corner.y}) scale(.85)" fill="none" stroke-linecap="round" stroke-width="3.4"><path d="M-16 0 A16 16 0 0 1 16 0" stroke="#FF8E72"/><path d="M-10.5 0 A10.5 10.5 0 0 1 10.5 0" stroke="#FFD36B"/><path d="M-5 0 A5 5 0 0 1 5 0" stroke="#7ED68F"/><ellipse cx="-16" cy="1.5" rx="6" ry="3.6" fill="#fff" stroke="none"/><ellipse cx="16" cy="1.5" rx="6" ry="3.6" fill="#fff" stroke="none"/></g>`,
  },
  {
    id: 'halo',
    name: 'Golden halo',
    unlock: 'streak7',
    hint: 'Be active seven days in a row.',
    draw: ({ top }) =>
      `<ellipse cx="${top.x}" cy="${Math.max(top.y - 5, 7)}" rx="15" ry="4.2" fill="none" stroke="#FFC94D" stroke-width="3.2"/>` + star(top.x + 22, Math.max(top.y - 5, 7) - 1, 0.5, '#FFC94D'),
  },
  {
    id: 'medal',
    name: 'Challenge medal',
    unlock: 'challenge3',
    hint: 'Complete the daily challenge on three different days.',
    draw: () =>
      `<g transform="translate(100 96)"><path d="M-6 -3 L-10 13 L-3 10 L0 15 L3 -3Z" fill="#FF7FA5" stroke="#E85C89" stroke-width="1.2" stroke-linejoin="round"/><path d="M6 -3 L10 13 L3 10 L0 15 L-3 -3Z" fill="#FF9CBB" stroke="#E85C89" stroke-width="1.2" stroke-linejoin="round"/><circle r="9.5" fill="#FFD25A" stroke="#E0A800" stroke-width="1.6"/>${star(0, 0, 0.8, '#FFFFFF')}</g>`,
  },
  {
    id: 'scarf',
    name: 'Cozy scarf',
    unlock: 'sort1',
    hint: 'Finish a sorting game round.',
    draw: ({ faceY }) => {
      const y = faceY + 24;
      return `<path d="M32 ${y} Q60 ${y + 11} 88 ${y} L86 ${y + 10} Q60 ${y + 21} 34 ${y + 10} Z" fill="#FF8A5B" stroke="#E0663A" stroke-width="1.2" stroke-linejoin="round"/>` +
        `<path d="M76 ${y + 9} L84 ${y + 26} L74 ${y + 24} L70 ${y + 12} Z" fill="#FF8A5B" stroke="#E0663A" stroke-width="1.2" stroke-linejoin="round"/><path d="M45 ${y + 6} v8 M58 ${y + 9} v8" stroke="#FFD2B8" stroke-width="2" stroke-linecap="round"/>`;
    },
  },
  {
    id: 'backpack',
    name: 'Little backpack',
    unlock: 'sort5',
    hint: 'Finish five sorting game rounds.',
    draw: () =>
      `<g transform="translate(97 72)"><rect x="-8" y="-12" width="16" height="26" rx="6" fill="#6C8EF5" stroke="#4A6BD6" stroke-width="1.4"/><rect x="-5" y="-4" width="10" height="8" rx="3" fill="#9DB4FA" stroke="#4A6BD6" stroke-width="1"/><path d="M-8 -6 Q-14 -4 -13 8" fill="none" stroke="#4A6BD6" stroke-width="2.4" stroke-linecap="round"/></g>`,
  },
  {
    id: 'charm',
    name: 'Bottle charm',
    unlock: 'treat10',
    hint: 'Share ten treats with your buddy by checking off habits.',
    draw: () =>
      `<g transform="translate(18 94) rotate(-12)"><rect x="-4" y="-14" width="8" height="5" rx="1.5" fill="#6C8EF5"/><path d="M-6 -9 h12 v20 a3 3 0 0 1 -3 3 h-6 a3 3 0 0 1 -3 -3 z" fill="#CFE3F7" stroke="#6C8EF5" stroke-width="1.4"/><path d="M-6 0 h12" stroke="#6C8EF5" stroke-width="1.2"/><path d="M0 -14 Q0 -20 6 -22" fill="none" stroke="#6C8EF5" stroke-width="1.2" stroke-linecap="round"/></g>`,
  },
  {
    id: 'partyhat',
    name: 'Party hat',
    unlock: 'tap10',
    hint: 'Tap your buddy ten times.',
    draw: ({ top }) =>
      `<g transform="translate(${top.x} ${top.y + 3}) rotate(8)"><path d="M-12 0 L0 -28 L12 0 Z" fill="#B28CFF" stroke="#8A63E0" stroke-width="1.3" stroke-linejoin="round"/><path d="M-7 -10 L7 -10 M-10 -4 L10 -4" stroke="#FFD25A" stroke-width="2.2" stroke-linecap="round"/><circle cy="-29" r="3.4" fill="#FFD25A"/></g>`,
  },
  {
    id: 'santa',
    name: 'Festive hat',
    unlock: 'season-christmas',
    hint: 'Try the Christmas theme in Settings.',
    draw: ({ top }) =>
      `<g transform="translate(${top.x} ${top.y + 4}) rotate(-6)"><path d="M-15 0 Q-12 -22 6 -24 Q16 -22 18 -8 Q8 -14 15 0 Z" fill="#E5484D" stroke="#C0272D" stroke-width="1.3" stroke-linejoin="round"/><rect x="-17" y="-3" width="34" height="7" rx="3.5" fill="#fff" stroke="#E4E4E4" stroke-width="1"/><circle cx="18" cy="-9" r="4.2" fill="#fff" stroke="#E4E4E4" stroke-width="1"/></g>`,
  },
  {
    id: 'globe',
    name: 'Earth pin',
    unlock: 'season-earth',
    hint: 'Try the Earth Day theme in Settings.',
    draw: ({ corner }) =>
      `<g transform="translate(${corner.x - 2} ${corner.y + 2})"><circle r="10" fill="#6EB6F0" stroke="#3E8FD0" stroke-width="1.4"/><path d="M-6 -3 Q-2 -8 3 -5 Q1 -1 -3 0 Q-7 2 -6 -3 Z M2 3 Q7 1 8 5 Q4 8 2 3 Z" fill="#7BCB6B"/></g>`,
  },
  {
    id: 'salakot',
    name: 'Salakot',
    unlock: 'season-wika',
    hint: 'Try the Buwan ng Wika theme in Settings.',
    draw: ({ top }) =>
      `<g transform="translate(${top.x} ${top.y + 5})"><path d="M-27 0 Q0 -30 27 0 Q0 7 -27 0 Z" fill="#E6C27A" stroke="#B88F3E" stroke-width="1.4" stroke-linejoin="round"/><path d="M-18 -4 Q0 -2 18 -4 M-10 -10 Q0 -8 10 -10" fill="none" stroke="#B88F3E" stroke-width="1.1" stroke-linecap="round"/><circle cy="-17" r="2.4" fill="#C9973E"/></g>`,
  },
];

export const BACKGROUNDS = ['#E7EDDB', '#D1DFBE', '#F6E6D2', '#DCE8F4', '#F3DEE6'];

export const DEFAULT_AVATAR = Object.freeze({ character: 'leaf', color: 0, face: 0, accessory: 'none', bg: 0 });

// ---------- Unlocked extras ----------
// Extras with an `unlock` rule start locked. Once earned they stay unlocked: a broken streak or
// trimmed activity history never takes one away. The list is saved on this device only.
const UNLOCKS_KEY = 'hipos.avatar.unlocks.v1';
const ALL_UNLOCKED = new Set(ACCESSORIES.filter((a) => a.unlock).map((a) => a.id));
let unlockedCache = null;
const has = (set, id) => (set instanceof Set ? set.has(id) : Array.isArray(set) && set.includes(id));

// Reads the saved list again (also useful to simulate a reload).
export function loadUnlocks() {
  let saved = [];
  try {
    const raw = JSON.parse(localStorage.getItem(UNLOCKS_KEY) || '[]');
    if (Array.isArray(raw)) saved = raw.filter((id) => ALL_UNLOCKED.has(id));
  } catch {
    /* storage blocked or damaged: start with nothing unlocked */
  }
  unlockedCache = new Set(saved);
  return unlockedCache;
}
export const getUnlocked = () => unlockedCache || loadUnlocks();
export const isLocked = (accessory, unlocked = getUnlocked()) => Boolean(accessory.unlock) && !has(unlocked, accessory.id);

// summary: the object returned by weekSummary() in engagement.js. Returns the extras unlocked just now.
export function syncUnlocks(summary) {
  const earned = new Set((summary?.badges || []).filter((b) => b.earned).map((b) => b.key));
  if ((summary?.challengeDays || 0) >= 3) earned.add('challenge3');
  (summary?.extra || []).forEach((key) => earned.add(key));
  const have = getUnlocked();
  const fresh = ACCESSORIES.filter((a) => a.unlock && earned.has(a.unlock) && !have.has(a.id));
  if (fresh.length) {
    fresh.forEach((a) => have.add(a.id));
    try {
      localStorage.setItem(UNLOCKS_KEY, JSON.stringify([...have]));
    } catch {
      /* still unlocked for this visit */
    }
  }
  return fresh;
}

// ---------- Config helpers ----------
// Always run unknown or stored data through this before rendering. A locked extra falls back to none.
export function normalizeConfig(raw, unlocked = getUnlocked()) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const ch = CHARACTERS.find((c) => c.id === r.character) || CHARACTERS[0];
  const idx = (v, len) => (Number.isInteger(v) && v >= 0 && v < len ? v : 0);
  const acc = ACCESSORIES.find((a) => a.id === r.accessory);
  return {
    character: ch.id,
    color: idx(r.color, ch.colors.length),
    face: idx(r.face, FACES.length),
    accessory: acc && !isLocked(acc, unlocked) ? acc.id : 'none',
    bg: idx(r.bg, BACKGROUNDS.length),
  };
}

export function randomAvatar(rand = Math.random, unlocked = getUnlocked()) {
  const pick = (n) => Math.floor(rand() * n);
  const ch = CHARACTERS[pick(CHARACTERS.length)];
  const pool = ACCESSORIES.filter((a) => !isLocked(a, unlocked));
  return normalizeConfig(
    { character: ch.id, color: pick(ch.colors.length), face: pick(FACES.length), accessory: pool[pick(pool.length)].id, bg: pick(BACKGROUNDS.length) },
    unlocked,
  );
}

export function loadAvatar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeConfig(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_AVATAR };
  }
}

export function saveAvatar(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeConfig(config)));
    return true;
  } catch {
    return false;
  }
}

// ---------- Rendering ----------
// Returns an SVG string with no ids or defs, so many avatars can share a page.
// decorative: true hides the avatar from screen readers (use inside a labelled control).
// teaser: true draws locked extras too (dimmed previews in the editor).
export function renderAvatar(config, { size = 120, decorative = false, teaser = false } = {}) {
  const cfg = normalizeConfig(config, teaser ? ALL_UNLOCKED : getUnlocked());
  const ch = CHARACTERS.find((c) => c.id === cfg.character);
  const face = FACES[cfg.face];
  const acc = ACCESSORIES.find((a) => a.id === cfg.accessory);
  const ctx = { top: ch.top, sl: ch.sl, sr: ch.sr, corner: ch.corner, faceY: ch.faceY };
  const a11y = decorative ? 'aria-hidden="true" focusable="false"' : `role="img" aria-label="${ch.name}"`;
  return (
    `<svg class="hipos-avatar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" ${a11y}>` +
    `<rect class="av-bg" data-bg="${cfg.bg}" width="120" height="120" rx="28" fill="${BACKGROUNDS[cfg.bg]}"/>` +
    `<ellipse class="av-shadow" cx="60" cy="111" rx="26" ry="4" fill="#000" opacity=".08"/>` +
    `<g class="av-body">${ch.body(ch.colors[cfg.color])}` +
    `<g transform="translate(60 ${ch.faceY})">${face.draw()}</g>` +
    `${acc.draw(ctx)}</g></svg>`
  );
}

// ---------- Greetings ----------
// Short, friendly lines for the buddy's speech bubble. English here; i18n.js translates them.
const GREETINGS = {
  morning: ['Good morning!', 'Rise and shine!', 'Good morning, friend!'],
  midday: ['Good day!', 'Hello there!', 'Hi, friend!'],
  afternoon: ['Good afternoon!', 'Hello there!', 'Hi, friend!'],
  evening: ['Good evening!', 'Welcome back!', 'Hello there!'],
  night: ['Still up? Rest well!', 'Sleep well soon!', 'Hello, night owl!'],
};
export const GREETING_LINES = Object.values(GREETINGS).flat();

// Time of day picks the group; the date picks the line, so it changes daily but never flickers.
export function greeting(now = new Date()) {
  const h = now.getHours();
  const part = h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 13 ? 'midday' : h >= 13 && h < 18 ? 'afternoon' : h >= 18 && h < 22 ? 'evening' : 'night';
  const pool = GREETINGS[part];
  return pool[(now.getFullYear() * 372 + now.getMonth() * 31 + now.getDate()) % pool.length];
}

// ---------- Interface ----------
// One cached config per page load; loadAvatar() only runs on first use.
let current = null;
const getConfig = () => current || (current = loadAvatar());
export const currentConfig = () => getConfig();

const chip = (key, value, label, override, cfg) =>
  `<button type="button" class="buddy-chip secondary" data-avatar-key="${key}" data-avatar-value="${value}" aria-pressed="${String(cfg[key]) === String(value)}">${renderAvatar(override, { size: 56, decorative: true })}<span>${label}</span></button>`;

const lockIcon = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false"><path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const accessoryChip = (a, cfg) => {
  const locked = isLocked(a);
  const art = renderAvatar({ ...cfg, accessory: a.id }, { size: 56, decorative: true, teaser: true });
  if (!locked) return `<button type="button" class="buddy-chip secondary" data-avatar-key="accessory" data-avatar-value="${a.id}" aria-pressed="${cfg.accessory === a.id}">${art}<span>${a.name}</span></button>`;
  return `<button type="button" class="buddy-chip secondary is-locked" data-avatar-key="accessory" data-avatar-value="${a.id}" aria-disabled="true">${art}<span>${a.name}</span><span class="buddy-hint">${lockIcon}<span>${a.hint}</span></span></button>`;
};

const swatch = (key, value, hex, label, cfg) =>
  `<button type="button" class="buddy-swatch secondary" data-avatar-key="${key}" data-avatar-value="${value}" aria-pressed="${cfg[key] === value}" aria-label="${label}"><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><circle ${key === 'bg' ? `class="av-bg" data-bg="${value}" ` : ''}cx="12" cy="12" r="11" fill="${hex}" stroke="rgba(47,58,51,.35)" stroke-width="1"/></svg></button>`;

export function avatarEditor() {
  const cfg = getConfig();
  const ch = CHARACTERS.find((c) => c.id === cfg.character);
  return `<div id="avatar-editor" class="buddy-editor">
  <form class="card buddy-nickname" id="buddy-nickname-form"><label for="buddy-nickname">Buddy nickname</label><p class="note" id="buddy-nickname-help">Up to 24 characters. Leave blank to use Your buddy.</p><div class="buddy-row"><input id="buddy-nickname" name="nickname" type="text" maxlength="24" autocomplete="off" aria-describedby="buddy-nickname-help" value="${esc(loadNickname())}"><button type="submit">Save nickname</button></div></form>
  <section class="card buddy-stage" aria-label="Your buddy"><h2 id="buddy-name" ${loadNickname() ? 'data-no-translate' : ''}>${esc(loadNickname() || 'Your buddy')}</h2><button type="button" class="buddy-stage-art secondary" data-buddy-tap aria-label="Tap your buddy">${renderAvatar(cfg, { size: 200, decorative: true })}</button><div class="actions"><button type="button" data-avatar-action="random">Surprise me</button><button type="button" class="secondary" data-avatar-action="reset">Reset</button></div><p id="avatar-status" class="note" role="status" aria-live="polite"></p></section>
  <section class="card buddy-options">
    <div class="buddy-group"><h2>Buddy</h2><div class="buddy-row">${CHARACTERS.map((c) => chip('character', c.id, c.name, { ...cfg, character: c.id, color: 0 }, cfg)).join('')}</div></div>
    <div class="buddy-group"><h2>Color</h2><div class="buddy-row">${ch.colors.map((hex, i) => swatch('color', i, hex, `Color ${i + 1}`, cfg)).join('')}</div></div>
    <div class="buddy-group"><h2>Face</h2><div class="buddy-row">${FACES.map((f, i) => chip('face', i, f.name, { ...cfg, face: i }, cfg)).join('')}</div></div>
    <div class="buddy-group"><h2>Extras</h2><p class="note">Earn more extras with small daily actions. Extras you earn are yours to keep.</p><div class="buddy-row">${ACCESSORIES.map((a) => accessoryChip(a, cfg)).join('')}</div></div>
    <div class="buddy-group"><h2>Background</h2><div class="buddy-row">${BACKGROUNDS.map((hex, i) => swatch('bg', i, hex, `Background ${i + 1}`, cfg)).join('')}</div></div>
  </section>
</div>`;
}

export function buddyStrip(treats = 0) {
  return `<section class="buddy-strip" aria-labelledby="buddy-heading"><button type="button" class="buddy-strip-art secondary" data-buddy-tap aria-label="Tap your buddy">${renderAvatar(getConfig(), { size: 72, decorative: true })}</button><div><h2 id="buddy-heading" ${loadNickname() ? 'data-no-translate' : ''}>${esc(loadNickname() || 'Your buddy')}</h2><p class="buddy-mood">Hi! Tap me for a tip.</p><p class="buddy-treats">Treats shared: ${treats}</p></div><div class="buddy-strip-actions"><a class="button-link secondary" href="#avatar">Customize buddy</a><a class="button-link secondary" href="#sort">Play sorting game</a></div></section>`;
}

// Redraws the header avatar and the Home strip. Safe to call when neither is on the page.
export function refreshAvatars() {
  const cfg = getConfig();
  const link = document.querySelector('#avatar-link');
  if (link) link.innerHTML = renderAvatar(cfg, { size: 56, decorative: true });
  const art = document.querySelector('.buddy-strip-art');
  if (art) art.innerHTML = renderAvatar(cfg, { size: 72, decorative: true });
  document.querySelectorAll('.mini-buddy-art').forEach((el) => (el.innerHTML = renderAvatar(cfg, { size: 40, decorative: true })));
  const stage = document.querySelector('.buddy-stage-art');
  if (stage) stage.innerHTML = renderAvatar(cfg, { size: 200, decorative: true });
}

// Handles a tap on any editor button (character, color, face, extra, background, Surprise me, Reset).
export function avatarClick(button) {
  const action = button.dataset.avatarAction;
  const key = button.dataset.avatarKey;
  if (button.getAttribute('aria-disabled') === 'true') {
    const status = document.querySelector('#avatar-status');
    if (status) status.textContent = button.querySelector('.buddy-hint span')?.textContent || '';
    return;
  }
  let cfg = getConfig();
  if (action === 'random') cfg = randomAvatar();
  else if (action === 'reset') cfg = { ...DEFAULT_AVATAR };
  else if (key) {
    const value = button.dataset.avatarValue;
    cfg = { ...cfg, [key]: key === 'character' || key === 'accessory' ? value : Number(value) };
    if (key === 'character') cfg.color = 0;
  } else return;
  current = normalizeConfig(cfg);
  const saved = saveAvatar(current);
  const editor = document.querySelector('#avatar-editor');
  if (editor) {
    editor.outerHTML = avatarEditor();
    const selector = action ? `[data-avatar-action="${action}"]` : `[data-avatar-key="${key}"][data-avatar-value="${button.dataset.avatarValue}"]`;
    document.querySelector(selector)?.focus({ preventScroll: true });
    document.querySelector('#notice').textContent = saved ? 'Buddy look saved!' : 'Could not save your buddy. Browser storage may be unavailable.';
  }
  refreshAvatars();
}
