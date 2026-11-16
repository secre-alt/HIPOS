// Small, local illustrations shared by the arcade. No external assets or text.
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
