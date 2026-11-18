// Small, local illustrations shared by the arcade, drawn like the buddies: flat colour, a soft
// highlight and a happy face. No external assets or text, and no ids so many can share a page.
import {FACES} from './avatar.js';

const INK = '#2F3A33';
const face = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})">${FACES[0].draw()}</g>`;
const sparkle = (x, y, color, n) => `<path class="gl-twinkle gl-t${n}" d="M${x} ${y - 7} Q${x} ${y} ${x + 7} ${y} Q${x} ${y} ${x} ${y + 7} Q${x} ${y} ${x - 7} ${y} Q${x} ${y} ${x} ${y - 7} Z" fill="${color}"/>`;
const shadow = '<ellipse class="gl-shadow" cx="60" cy="112" rx="30" ry="4" fill="#000" opacity=".09"/>';


// ---------- Compost Catch items ----------
const ring=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
const zig=(from,to,step,hi,lo)=>{let d='';const n=Math.round(Math.abs(to-from)/step);for(let i=0;i<=n;i++){const x=from+(to>from?1:-1)*i*step;d+=`L${x} ${i%2?lo:hi} `;}return d;};
const items={
  peel: () => `<path d="M50 34 C30 36 14 58 18 90 C19 99 28 100 32 92 C38 78 40 62 52 50 Z" fill="#FFD93D"/><path d="M70 34 C90 36 106 58 102 90 C101 99 92 100 88 92 C82 78 80 62 68 50 Z" fill="#F5C518"/><path d="M60 22 C77 22 88 44 88 68 C88 92 75 106 60 106 C45 106 32 92 32 68 C32 44 43 22 60 22 Z" fill="#FFF3C4"/><path d="M55 27 Q60 12 65 27 Z" fill="#8B5E3C"/><ellipse cx="45" cy="42" rx="4.5" ry="9" transform="rotate(22 45 42)" fill="#fff" opacity=".6"/>${face(60,68,.75)}`,
  apple: () => `<path d="M60 36 C40 24 20 38 22 64 C24 90 42 108 60 100 C78 108 96 90 98 64 C100 38 80 24 60 36 Z" fill="#FF6B6B"/><path d="M72 84 Q76 74 86 78 Q96 74 98 86 Q96 98 86 96 Q76 102 72 92 Z" fill="#FFF1C9"/><path d="M60 34 Q60 22 67 14" fill="none" stroke="#8B5E3C" stroke-width="5" stroke-linecap="round"/><path d="M64 26 Q76 12 92 22 Q80 36 64 26 Z" fill="#7ED68F"/><ellipse cx="34" cy="52" rx="4.5" ry="9" transform="rotate(24 34 52)" fill="#fff" opacity=".45"/>${face(50,68,.66)}`,
  egg: () => `<path d="M86 24 L98 30 L96 44 L84 40 Z" fill="#FFF6DE"/><path d="M24 62 L34 50 L44 64 L54 48 L64 64 L74 48 L84 64 L96 52 L98 72 C98 96 82 108 60 108 C38 108 22 96 22 72 Z" fill="#FFF6DE"/><path d="M22 76 C24 98 40 108 60 108 C82 108 98 96 98 76 C90 90 76 96 60 96 C44 96 30 90 22 76 Z" fill="#EBD9B4" opacity=".7"/><ellipse cx="34" cy="76" rx="4" ry="9" transform="rotate(10 34 76)" fill="#fff" opacity=".6"/>${face(60,80,.7)}`,
  rice: () => `<path d="M26 66 Q22 36 44 36 Q50 20 68 28 Q94 24 94 66 Z" fill="#F7EFD6"/><path d="M30 60 Q60 70 90 60 L94 66 H26 Z" fill="#E6D9B6"/><g fill="#E8DDC0"><ellipse cx="42" cy="44" rx="3" ry="1.6" transform="rotate(30 42 44)"/><ellipse cx="78" cy="40" rx="3" ry="1.6" transform="rotate(-30 78 40)"/><ellipse cx="86" cy="54" rx="3" ry="1.6"/></g><path d="M16 62 H104 Q104 102 60 108 Q16 102 16 62 Z" fill="#7BD9C4"/><path d="M16 62 H104 L103 70 H17 Z" fill="#5DC3AB"/><ellipse cx="30" cy="86" rx="3.5" ry="9" transform="rotate(-20 30 86)" fill="#fff" opacity=".4"/>${face(60,50,.6)}`,
  carrot: () => `<ellipse cx="50" cy="24" rx="7" ry="15" transform="rotate(-24 50 28)" fill="#6BC47E"/><ellipse cx="70" cy="24" rx="7" ry="15" transform="rotate(24 70 28)" fill="#7ED68F"/><ellipse cx="60" cy="20" rx="7" ry="16" fill="#5FB872"/><path d="M34 40 Q60 26 86 40 Q80 78 60 108 Q40 78 34 40 Z" fill="#FF9A3C"/><path d="M40 62 h9 M71 76 h9 M47 88 h7" stroke="#E27A1F" stroke-width="3" stroke-linecap="round" opacity=".7"/><ellipse cx="44" cy="48" rx="3.5" ry="8" transform="rotate(14 44 48)" fill="#fff" opacity=".45"/>${face(60,58,.62)}`,
  carton: () => `<path d="M72 20 V8 H86" fill="none" stroke="#FF8FA3" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 36 L44 20 H76 L90 36 Z" fill="#6FB8DE"/><path d="M30 34 H90 V100 Q90 108 82 108 H38 Q30 108 30 100 Z" fill="#8FD3F4"/><path d="M90 34 V100 Q90 108 82 108 H74 Q80 104 80 96 V34 Z" fill="#6FB8DE" opacity=".5"/><circle cx="60" cy="94" r="7" fill="#FFB347"/><path d="M60 87 Q64 82 68 84" stroke="#6BC47E" stroke-width="2.6" fill="none" stroke-linecap="round"/><ellipse cx="38" cy="58" rx="3.5" ry="9" fill="#fff" opacity=".5"/>${face(60,62,.7)}`,
  spoon: () => `<path d="M54 66 H66 L70 102 Q70 112 60 112 Q50 112 50 102 Z" fill="#B7A2F4"/><ellipse cx="60" cy="40" rx="28" ry="32" fill="#C9B8FF"/><ellipse cx="46" cy="26" rx="5" ry="10" transform="rotate(24 46 26)" fill="#fff" opacity=".5"/>${face(60,42,.66)}`,
  wrapper: () => `<path d="M28 30 ${zig(28,92,4,17,24)}L92 30 C96 54 96 76 92 96 L92 100 ${zig(92,28,4,105,112)}L28 100 L28 96 C24 76 24 54 28 30 Z" fill="#FF8A8A"/><path d="M28 31 ${zig(28,92,4,17,24)}L92 31 L92 37 L28 37 Z" fill="#E56F6F"/><path d="M28 94 L92 94 L92 100 ${zig(92,28,4,105,112)}L28 100 Z" fill="#E56F6F"/><path d="M38 42 L47 42 L37 80 L32 80 Z" fill="#fff" opacity=".3"/>${face(60,66,.72)}`,
  battery: () => `<rect x="50" y="14" width="20" height="14" rx="4" fill="#B7BEC7"/><rect x="34" y="26" width="52" height="82" rx="14" fill="#FFD84D"/><rect x="34" y="88" width="52" height="20" rx="10" fill="#2F3A33"/><path d="M34 98 H86" stroke="#FFD84D" stroke-width="5" stroke-dasharray="8 7"/><path d="M76 34 l-8 11 h6 l-3 9 10 -13 h-6 z" fill="#FF8A3D"/><ellipse cx="42" cy="54" rx="4" ry="12" fill="#fff" opacity=".5"/>${face(60,64,.7)}`,
  bulb: () => `<path d="M60 14 C82 14 96 30 96 50 C96 64 88 74 80 82 C77 85 76 88 76 92 L44 92 C44 88 43 85 40 82 C32 74 24 64 24 50 C24 30 38 14 60 14 Z" fill="#FFE97A"/><rect x="43" y="90" width="34" height="8" rx="2.5" fill="#B7BEC7"/><rect x="45" y="98" width="30" height="7" rx="2.5" fill="#A2AAB4"/><rect x="49" y="105" width="22" height="6" rx="3" fill="#4B5560"/><ellipse cx="38" cy="36" rx="5.5" ry="11" transform="rotate(32 38 36)" fill="#fff" opacity=".5"/>${face(60,52,.7)}`,
  aerosol: () => `<rect x="56" y="8" width="8" height="10" rx="2" fill="#6B7480"/><rect x="42" y="16" width="36" height="22" rx="8" fill="#FF8FA3"/><rect x="38" y="34" width="44" height="74" rx="10" fill="#8FD3F4"/><rect x="38" y="92" width="44" height="10" fill="#6FB8DE"/><ellipse cx="46" cy="62" rx="3.5" ry="14" fill="#fff" opacity=".5"/>${face(60,68,.66)}`,
  lighter: () => `<path d="M60 4 Q72 18 60 30 Q48 18 60 4 Z" fill="#FFB347"/><rect x="42" y="28" width="36" height="16" rx="5" fill="#B7BEC7"/><rect x="40" y="42" width="40" height="66" rx="12" fill="#FF6B6B"/><ellipse cx="48" cy="68" rx="3.5" ry="12" fill="#fff" opacity=".45"/>${face(60,78,.6)}`,
  glass: () => `<path d="M26 96 L44 34 L74 20 L96 68 L78 106 Z" fill="#CDEBFA"/><path d="M44 34 L74 20 L60 62 Z" fill="#EAF7FE"/><path d="M26 96 L60 62 L78 106 Z" fill="#A9D6EE"/><path d="M50 44 L62 38" stroke="#fff" stroke-width="3" stroke-linecap="round"/>${face(62,70,.6)}`,
  paper: () => `<path d="M32 18 H72 L92 38 V104 Q92 110 86 110 H38 Q32 110 32 104 Z" fill="#FFF6DE"/><path d="M72 18 V38 H92 Z" fill="#EBD9B4"/><path d="M42 50 H62 M42 58 H56" stroke="#D8C79B" stroke-width="3" stroke-linecap="round"/><ellipse cx="40" cy="80" rx="3.5" ry="9" fill="#fff" opacity=".7"/>${face(62,82,.62)}`,
  bottle: () => `<rect x="50" y="12" width="20" height="16" rx="4" fill="#5EA9D6"/><path d="M48 28 H72 V40 Q86 50 86 66 V102 Q86 110 78 110 H42 Q34 110 34 102 V66 Q34 50 48 40 Z" fill="#8FD3F4"/><rect x="34" y="84" width="52" height="12" fill="#6FB8DE" opacity=".7"/><ellipse cx="44" cy="66" rx="3.5" ry="12" fill="#fff" opacity=".5"/>${face(60,70,.66)}`,
  box: () => `<rect x="20" y="36" width="80" height="72" rx="10" fill="#E0B070"/><rect x="20" y="36" width="80" height="18" rx="9" fill="#D19A55"/><rect x="50" y="36" width="20" height="30" rx="3" fill="#F1D9A8"/><ellipse cx="32" cy="76" rx="3.5" ry="10" fill="#fff" opacity=".4"/>${face(60,84,.7)}`,
  basket: () => `<path d="M28 52 C28 18 92 18 92 52" fill="none" stroke="#B87A3E" stroke-width="6" stroke-linecap="round"/><path d="M16 54 H104 L95 100 Q93 108 85 108 H35 Q27 108 25 100 Z" fill="#EBB26B"/><path d="M21 78 Q60 86 99 78 M24 92 Q60 100 96 92" stroke="#C98B45" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/><rect x="12" y="46" width="96" height="14" rx="7" fill="#D9984F"/><rect x="18" y="49" width="40" height="3.6" rx="1.8" fill="#fff" opacity=".4"/>${face(60,82,.9)}`,
};
const itemSvg=(body)=>`<svg class="game-item" viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false">${body}</svg>`;
export const gameArt=(kind)=>itemSvg((items[kind]||items.apple)());

// ---------- Buddy garden ----------
const soil='<ellipse cx="60" cy="106" rx="38" ry="9" fill="#9A6B47"/><ellipse cx="60" cy="103" rx="30" ry="6" fill="#B58557"/>';
const stalk=(x2=60,y2=48)=>`<path d="M60 102 Q60 76 ${x2} ${y2}" fill="none" stroke="#5FA16B" stroke-width="5.5" stroke-linecap="round"/><ellipse cx="45" cy="84" rx="13" ry="6.5" transform="rotate(-28 45 84)" fill="#7ED68F"/><ellipse cx="75" cy="78" rx="13" ry="6.5" transform="rotate(28 75 78)" fill="#6BC47E"/>`;
const petals=(n,rx,ry,dist,fill,cx=60,cy=46,alt)=>ring(n,i=>`<ellipse cx="${cx}" cy="${cy-dist}" rx="${rx}" ry="${ry}" transform="rotate(${i*360/n} ${cx} ${cy})" fill="${alt&&i%2?alt:fill}"/>`);
const heads=[
  // sunflower
  () => `${stalk()}<g class="gl-sway">${petals(12,6.5,13,22,'#FFD84D',60,46,'#FFC531')}<circle cx="60" cy="46" r="19" fill="#E0A862"/>${face(60,47,.66)}</g>`,
  // tulip
  () => `${stalk(60,60)}<g class="gl-sway"><path d="M38 28 Q36 68 60 70 Q84 68 82 28 L70 40 L60 22 L50 40 Z" fill="#FF8FB1"/><path d="M60 22 L70 40 Q74 58 60 70 Q64 46 60 22 Z" fill="#FF7BA2" opacity=".6"/><ellipse cx="46" cy="44" rx="3.5" ry="9" fill="#fff" opacity=".4"/>${face(60,52,.52)}</g>`,
  // daisy
  () => `${stalk()}<g class="gl-sway">${petals(10,6,14,22,'#FFFFFF',60,46,'#F3F6FF')}<circle cx="60" cy="46" r="17" fill="#FFE27A"/>${face(60,47,.6)}</g>`,
  // cherry blossom
  () => `${stalk()}<g class="gl-sway">${ring(5,i=>`<circle cx="60" cy="27" r="15" transform="rotate(${i*72} 60 46)" fill="#FFC2D4"/>`)}<circle cx="60" cy="46" r="15" fill="#FFF0A8"/>${face(60,47,.56)}</g>`,
  // rose
  () => `${stalk()}<g class="gl-sway"><circle cx="60" cy="46" r="26" fill="#E8506A"/><path d="M44 46 Q48 28 60 30 Q76 32 74 48 Q70 64 56 62" fill="none" stroke="#C93A55" stroke-width="3" stroke-linecap="round" opacity=".6"/><ellipse cx="45" cy="34" rx="4" ry="8" transform="rotate(30 45 34)" fill="#fff" opacity=".4"/>${face(60,47,.62)}</g>`,
  // lavender
  () => `${stalk(60,60)}<g class="gl-sway"><ellipse cx="42" cy="46" rx="7" ry="17" transform="rotate(-18 42 46)" fill="#B9A3E6"/><ellipse cx="78" cy="46" rx="7" ry="17" transform="rotate(18 78 46)" fill="#B9A3E6"/><ellipse cx="60" cy="42" rx="17" ry="28" fill="#C9B8FF"/><ellipse cx="52" cy="28" rx="3.5" ry="9" fill="#fff" opacity=".5"/>${face(60,46,.6)}</g>`,
  // hibiscus
  () => `${stalk()}<g class="gl-sway">${ring(5,i=>`<circle cx="60" cy="27" r="16" transform="rotate(${i*72} 60 46)" fill="${i%2?'#FF7F6B':'#FF9A7A'}"/>`)}<circle cx="60" cy="46" r="15" fill="#FFD9A8"/>${face(60,47,.56)}</g>`,
  // strawberry
  () => `<g class="gl-sway"><path d="M60 100 C30 84 28 52 42 44 C52 38 56 44 60 44 C64 44 68 38 78 44 C92 52 90 84 60 100 Z" fill="#FF6B7D"/><g fill="#FFE27A"><circle cx="42" cy="62" r="1.8"/><circle cx="78" cy="62" r="1.8"/><circle cx="50" cy="86" r="1.8"/><circle cx="70" cy="86" r="1.8"/></g><path d="M60 46 L48 38 L56 40 L52 28 L60 36 L68 28 L64 40 L72 38 Z" fill="#6BC47E"/><ellipse cx="40" cy="58" rx="3.5" ry="8" transform="rotate(12 40 58)" fill="#fff" opacity=".4"/>${face(60,68,.7)}</g>`,
  // tomato
  () => `<g class="gl-sway"><circle cx="60" cy="68" r="31" fill="#FF6B5A"/><path d="M60 40 L48 36 L55 40 L50 28 L60 36 L70 28 L65 40 L72 36 Z" fill="#5FB872"/><ellipse cx="42" cy="58" rx="4" ry="9" transform="rotate(20 42 58)" fill="#fff" opacity=".4"/>${face(60,70,.8)}</g>`,
];
export function gardenArt(stage,index=0){
  let content=soil;
  if(stage===1)content=soil+`<ellipse cx="60" cy="92" rx="13" ry="10" fill="#E0B070"/><ellipse cx="55" cy="88" rx="3" ry="4.5" transform="rotate(20 55 88)" fill="#fff" opacity=".45"/>${face(60,94,.4)}`;
  else if(stage===2)content=soil+`<g class="gl-sway"><path d="M60 102 Q60 86 60 72" stroke="#5FA16B" stroke-width="5.5" stroke-linecap="round" fill="none"/><ellipse cx="42" cy="70" rx="17" ry="9" transform="rotate(-24 42 70)" fill="#7ED68F"/><ellipse cx="78" cy="66" rx="17" ry="9" transform="rotate(24 78 66)" fill="#6BC47E"/><circle cx="60" cy="68" r="13" fill="#9BE08C"/>${face(60,70,.5)}</g>`;
  else if(stage>=3)content=soil+(heads[index]||heads[0])();
  return `<svg class="game-item game-plant" viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false">${content}</svg>`;
}

// ---------- Game logos ----------
// Hub logos use the same flat, friendly style as the buddies: filled shapes, a soft highlight and a
// happy face. Motion comes from CSS classes (gl-*) and stops for people who prefer less motion.
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
  hazard: () => `${shadow}<g class="gl-hop"><path d="M60 12 L108 98 Q112 108 100 108 H20 Q8 108 12 98 Z" fill="#FFD84D"/><path d="M60 34 V68" stroke="#2F3A33" stroke-width="8" stroke-linecap="round"/><circle cx="60" cy="84" r="5.5" fill="#2F3A33"/></g>${sparkle(100, 26, '#FFB347', 1)}${sparkle(16, 44, '#9EE7FF', 2)}`,
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
