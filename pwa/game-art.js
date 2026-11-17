// Small, local illustrations shared by the arcade. No external assets or text.
import {FACES} from './avatar.js';
const drawings = {
  peel: '<path fill="#f3cb58" d="M25 15c3 27 17 42 42 30-8 25-36 28-48 8-5-9-3-24 6-38Z"/><path d="M25 15c0 28 14 39 32 37"/>',
  apple: '<path fill="#d97b65" d="M45 25c-28-15-36 14-21 36 8 14 14 8 21 8s14 6 22-8c15-22 7-51-22-36Z"/><path d="m45 25 4-14"/><path fill="#88b27c" d="M49 20q2-15 19-10-4 14-19 10Z"/>',
  egg: '<path fill="#fff4d9" d="m20 39 13 7 12-12 12 12 14-7c8 34-10 40-26 40S12 70 20 39Z"/>',
  rice: '<path fill="#fff4d9" d="M22 44q-2-18 12-18 4-16 17-6 15-6 17 11 10 2 8 13Z"/><path fill="#85b4a4" d="M14 44h65Q74 76 47 76T14 44Z"/><path d="M29 54h35"/>',
  carrot: '<path fill="#e9a15e" d="M27 32q15-18 29-3L39 77Z"/><path fill="#88b27c" d="m48 24-4-17 11 11 13-9-9 20"/><path d="m31 43 10 4m-7 10 7 3"/>',
  carton: '<path fill="#88b5c1" d="m28 26 11-12h23l8 12v48H28Z"/><path fill="#fff4d9" d="M28 36h42v26H28Z"/><path d="m54 14 8-8h13M39 14v12h31"/><path d="M41 48h16"/>',
  spoon: '<path fill="#e8e7df" d="M42 43C16 35 23 10 38 10s22 25 9 33l14 31q-2 9-9 4Z"/>',
  wrapper: '<path fill="#c4a8c3" d="m17 28 13 5 30-6 15-9-1 18 7 23-15-3-29 7-17 9 2-19Z"/><path d="m30 33 7 30m23-36 6 29"/><path fill="#fff4d9" d="m43 40 12-2 3 12-12 3Z"/>',
  basket: '<path fill="#d9ab72" d="m13 38 8 38h54l8-38Z"/><path d="M26 38q0-38 22-30t22 30M28 49l4 16m16-16v16m20-16-4 16M12 38h72"/>',
  flower: '<path d="M48 75V39m0 22Q23 41 25 63q8 14 23 9m0-15q25-20 24 0-9 13-24 11" fill="#88b27c"/><path fill="#e9b1a5" d="M48 15c14-18 28 1 16 12 24-2 21 23 3 23 6 22-19 27-24 8-18 14-35-5-19-18-18-14-1-33 16-23Z"/><circle cx="47" cy="36" r="11" fill="#f3cb58"/>',
  pouch: '<path fill="#d9ab72" d="m24 29-7 49h62l-7-49Z"/><path d="M34 29V18q14-15 28 0v11M29 42h38M29 60h38" stroke-dasharray="3 5"/>',
};
export const gameArt = (kind) => `<svg viewBox="0 0 96 96" fill="none" stroke="#254d3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[kind] || drawings.flower}</svg>`;

// Fixed artwork for the nine existing plants; no user text is placed in SVG.
const blooms = [
  '<g fill="#f3cb58"><ellipse cx="48" cy="25" rx="9" ry="19"/><ellipse cx="48" cy="25" rx="9" ry="19" transform="rotate(60 48 32)"/><ellipse cx="48" cy="25" rx="9" ry="19" transform="rotate(120 48 32)"/></g><circle cx="48" cy="32" r="13" fill="#956647"/>',
  '<path fill="#dc8d9c" d="M28 18 40 28l8-15 8 15 12-10v18q-20 30-40 0Z"/>',
  '<g fill="#fff4d9"><ellipse cx="48" cy="32" rx="26" ry="9"/><ellipse cx="48" cy="32" rx="26" ry="9" transform="rotate(60 48 32)"/><ellipse cx="48" cy="32" rx="26" ry="9" transform="rotate(120 48 32)"/></g><circle cx="48" cy="32" r="10" fill="#f3cb58"/>',
  '<path fill="#edb9ca" d="M48 16q17-15 18 5 22 0 9 16 9 20-12 18-12 18-21 0-24 5-17-15-19-15 2-21 1-20 21-3Z"/><circle cx="48" cy="34" r="7" fill="#f3cb58"/>',
  '<path fill="#cb7a80" d="M27 22q12-14 21-4 20-12 24 9 10 15-9 27-27 10-38-10-7-14 2-22Z"/><path d="M36 28q25-10 23 12-18 9-16-6l10 2"/>',
  '<path d="M48 53V12"/><g fill="#b7a3ce"><ellipse cx="42" cy="20" rx="7" ry="9"/><ellipse cx="55" cy="28" rx="7" ry="9"/><ellipse cx="41" cy="37" rx="7" ry="9"/><ellipse cx="55" cy="45" rx="7" ry="9"/></g>',
  '<path fill="#e69c85" d="M48 17q24-17 19 9 24 4 7 22 2 23-20 12-20 18-23-6-26-1-13-20-3-23 22-11Z"/><path stroke="#f3cb58" stroke-width="6" d="m48 38 15-18"/>',
  '<path fill="#d88175" d="M30 35q17-16 36 0 6 13-18 33-24-21-18-33Z"/><path fill="#88b27c" d="m48 38-17-12 17 3 16-6-5 14Z"/><path stroke="#fff4d9" d="m40 45 1 1m14-1 1 1m-9 9 1 1"/>',
  '<path fill="#df8c6b" d="M27 41q3-22 21-10 22-13 23 12 3 26-23 24-25 0-21-26Z"/><path fill="#88b27c" d="m48 39-16-9 14 1 5-15 4 15 13-2-14 12Z"/>',
];
export function gardenArt(stage,index=0){
  const soil='<path d="M18 82h60" stroke="#956647"/>';
  const seed='<ellipse cx="48" cy="74" rx="9" ry="5" fill="#d9ab72"/>';
  const stem='<path d="M48 80V49"/><path fill="#88b27c" d="M48 67Q21 40 25 62q7 15 23 11m0-10q26-25 25-4-9 13-25 13"/>';
  const content=stage===0?soil:stage===1?soil+seed:stage===2?soil+stem:soil+stem+(blooms[index]||blooms[0]);
  return `<svg viewBox="0 0 96 96" fill="none" stroke="#254d3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
}

// ---------- Game logos ----------
// Hub logos use the same flat, friendly style as the buddies: filled shapes, a soft highlight and a
// happy face. Motion comes from CSS classes (gl-*) and stops for people who prefer less motion.
const INK = '#2F3A33';
const face = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})">${FACES[0].draw()}</g>`;
const sparkle = (x, y, color, n) => `<path class="gl-twinkle gl-t${n}" d="M${x} ${y - 7} Q${x} ${y} ${x + 7} ${y} Q${x} ${y} ${x} ${y + 7} Q${x} ${y} ${x - 7} ${y} Q${x} ${y} ${x} ${y - 7} Z" fill="${color}"/>`;
const shadow = '<ellipse class="gl-shadow" cx="60" cy="112" rx="30" ry="4" fill="#000" opacity=".09"/>';

const logos = {
  // Sorting game: a smiling pouch that hops
  sort: () => `${shadow}<g class="gl-hop">
<path d="M42 44 C40 12 80 12 78 44" fill="none" stroke="#B87A3E" stroke-width="5.5" stroke-linecap="round"/>
<path d="M32 36 H88 Q94 36 95 42 L102 98 Q103 108 93 108 H27 Q17 108 18 98 L25 42 Q26 36 32 36 Z" fill="#F2B96B"/>
<path d="M25 42 Q26 36 32 36 H88 Q94 36 95 42 L96 50 H24 Z" fill="#E09A48"/>
<path d="M30 49 H90" stroke="#fff" stroke-width="2.4" stroke-dasharray="4 5" stroke-linecap="round" opacity=".7"/>
<path d="M18 98 Q17 108 27 108 H93 Q103 108 102 98 L101 92 H19 Z" fill="#D98F42" opacity=".5"/>
<ellipse cx="31" cy="68" rx="4.5" ry="12" transform="rotate(6 31 68)" fill="#fff" opacity=".4"/>
${face(60, 74, 0.95)}</g>${sparkle(98, 22, '#FFD84D', 1)}${sparkle(20, 30, '#9EE7FF', 2)}${sparkle(104, 62, '#FFB3C7', 3)}`,

  // Compost Catch: a basket catching falling scraps
  compost: () => `${shadow}
<g class="gl-scrap gl-s1"><circle cx="38" cy="14" r="7.5" fill="#FF7A7A"/><path d="M38 7 Q40 2 44 2" stroke="#6BB36F" stroke-width="2.6" fill="none" stroke-linecap="round"/><ellipse cx="35.5" cy="12" rx="2" ry="3" fill="#fff" opacity=".5"/></g>
<g class="gl-scrap gl-s2"><path d="M60 6 Q72 10 70 24 Q58 22 60 6 Z" fill="#7ED68F"/><path d="M62 10 Q66 16 68 22" stroke="#4E9F5E" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>
<g class="gl-scrap gl-s3"><path d="M80 8 C90 8 92 20 86 24 C80 26 72 14 80 8 Z" fill="#FFE27A"/><circle cx="82" cy="14" r="1.5" fill="#E0A83A"/></g>
<g class="gl-wiggle">
<path d="M28 52 C28 18 92 18 92 52" fill="none" stroke="#B87A3E" stroke-width="6" stroke-linecap="round"/>
<path d="M16 54 H104 L95 100 Q93 108 85 108 H35 Q27 108 25 100 Z" fill="#EBB26B"/>
<path d="M21 78 Q60 86 99 78 M24 92 Q60 100 96 92" stroke="#C98B45" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>
<path d="M40 56 L36 106 M60 56 V108 M80 56 L84 106" stroke="#C98B45" stroke-width="2.2" opacity=".35"/>
<rect x="12" y="46" width="96" height="14" rx="7" fill="#D9984F"/>
<rect x="18" y="49" width="40" height="3.6" rx="1.8" fill="#fff" opacity=".4"/>
${face(60, 82, 0.9)}</g>${sparkle(100, 36, '#FFD84D', 1)}`,

  // Buddy garden: a smiling flower in a pot that sways
  garden: () => `${shadow}
<path d="M34 86 H86 L80 106 Q79 112 73 112 H47 Q41 112 40 106 Z" fill="#EE9A74"/>
<rect x="30" y="78" width="60" height="12" rx="6" fill="#DB7F57"/>
<path d="M40 100 L43 108" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>
<g class="gl-sway">
<path d="M60 80 V58" stroke="#5FA16B" stroke-width="5" stroke-linecap="round"/>
<ellipse cx="46" cy="70" rx="12" ry="6" transform="rotate(-28 46 70)" fill="#7ED68F"/>
<ellipse cx="74" cy="66" rx="12" ry="6" transform="rotate(28 74 66)" fill="#6BC47E"/>
<g class="gl-bloom">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="60" cy="22" rx="9.5" ry="15" transform="rotate(${a} 60 40)" fill="${a % 90 ? '#FFC3D3' : '#FFA9C0'}"/>`).join('')}
<circle cx="60" cy="40" r="19" fill="#FFE27A"/><ellipse cx="52" cy="30" rx="3.5" ry="6" transform="rotate(30 52 30)" fill="#fff" opacity=".55"/>
${face(60, 41, 0.74)}</g></g>${sparkle(100, 30, '#FFD84D', 1)}${sparkle(18, 52, '#9EE7FF', 2)}`,
};
export const gameLogo = (id) => `<svg class="game-logo game-logo-${id}" viewBox="0 0 120 120" fill="none" role="presentation" aria-hidden="true" focusable="false">${(logos[id] || logos.garden)()}</svg>`;
