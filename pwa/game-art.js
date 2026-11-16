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
