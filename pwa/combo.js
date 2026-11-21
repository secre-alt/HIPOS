// A combo counts right answers (or good catches) in a row. A miss ends it, but the best run
// of the round is kept and shown, so a slip never takes anything away.
export function createCombo() {
  return { count: 0, best: 0 };
}
export function hit(combo) {
  combo.count += 1;
  if (combo.count > combo.best) combo.best = combo.count;
  return combo.count;
}
export function miss(combo) {
  const ended = combo.count;
  combo.count = 0;
  return ended;
}
// Buddy lines at a few milestones, never on every answer.
export function comboLine(count) {
  if (count === 3) return 'Three in a row!';
  if (count === 5) return 'Five in a row, nice!';
  if (count === 8) return 'On fire! Eight in a row!';
  return '';
}
// Sound level 0..6 rises with the combo and then holds.
export const comboLevel = (count) => Math.max(0, Math.min(6, count - 1));
