import test from 'node:test';
import assert from 'node:assert/strict';
const { pairs } = await import('../pwa/i18n.js');
// English text that is intentionally the same in Filipino (names, loanwords, labels).
const SAME_OK = /^(Hippo|Volt|Flick|Crinkle|Peely|Lighter|Filipino|Wika|OK|HIPOS|Leaf|Sort|Games?|Home|Menu|Share →)/i;
test('every pair has English and Filipino text', () => {
  for (const p of pairs) { assert.equal(p.length >= 2, true, JSON.stringify(p)); assert.ok(String(p[0]).trim() && String(p[1]).trim(), JSON.stringify(p)); }
});
test('the same English text never maps to two different Filipino texts', () => {
  const seen = new Map();
  for (const [en, fil] of pairs) {
    if (seen.has(en) && seen.get(en) !== fil) assert.fail(`Conflicting translations for "${en}"`);
    seen.set(en, fil);
  }
});
test('numbers and placeholders survive translation', () => {
  for (const [en, fil] of pairs) {
    const nums = (s) => (String(s).match(/\d+|\{[^}]+\}/g) || []).sort().join(',');
    assert.equal(nums(en), nums(fil), `Numbers differ in "${en}"`);
  }
});
test('sentences are not left untranslated', () => {
  const same = pairs.filter(([en, fil]) => en === fil && en.length > 18 && !SAME_OK.test(en));
  assert.deepEqual(same.map((p) => p[0]), []);
});
