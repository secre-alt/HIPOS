import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyBuddy,dailyProgress} from '../pwa/daily-buddy.js';
const storage=()=>{const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};};
test('daily progress counts only today, keeps skips distinct, and preserves quiz completion on replay',()=>{
  const s=storage(),day='2026-11-18';
  s.setItem('hipos.daily.v1',JSON.stringify({day,checked:[true,false,true,true]}));
  s.setItem('hipos.activity.v1',JSON.stringify({days:{[day]:{challenge:'skipped'}}}));
  dailyBuddy(s,day).quizDone();
  const progress=dailyProgress(s,day);
  assert.equal(progress.completed,3);
  assert.equal(progress.skipped,true);
  assert.equal(progress.challenge,false);
  assert.equal(dailyProgress(s,'2026-11-19').completed,0);
  s.setItem('hipos.daily.v1',JSON.stringify({day,checked:[true,true,true]}));
  s.setItem('hipos.activity.v1',JSON.stringify({days:{[day]:{challenge:'done'}}}));
  assert.equal(dailyProgress(s,day).completed,5);
});
test('daily progress reports unreadable storage without preventing other saved progress',()=>{
  const s=storage(),day='2026-11-18';
  s.setItem('hipos.daily.v1','{broken');
  dailyBuddy(s,day).quizDone();
  assert.equal(dailyProgress(s,day).unavailable,true);
  assert.equal(dailyProgress(s,day).quiz,true);
  assert.equal(dailyProgress({getItem(){throw Error('blocked');}},day).unavailable,true);
});
test('welcome appears once per returning day and rotates across reloads',()=>{
  const s=storage();assert.equal(dailyBuddy(s,'2026-11-16').visit(),null);
  const first=dailyBuddy(s,'2026-11-17').visit();assert.ok(first);
  assert.equal(dailyBuddy(s,'2026-11-17').visit(),null);
  assert.notEqual(dailyBuddy(s,'2026-11-18').visit(),first);
});
test('daily celebration requires all three habits, completed challenge, and a quiz finished today',()=>{
  const s=storage(),day='2026-11-16',buddy=dailyBuddy(s,day);
  s.setItem('hipos.daily.v1',JSON.stringify({day,checked:[true,true,true]}));
  s.setItem('hipos.activity.v1',JSON.stringify({days:{[day]:{challenge:'skipped'}}}));
  buddy.quizDone();assert.equal(buddy.completion(),null);
  s.setItem('hipos.activity.v1',JSON.stringify({days:{[day]:{challenge:'done'}}}));
  assert.ok(buddy.completion());assert.ok(buddy.completion(),'not consumed before the cheer is shown');
  buddy.celebrated();assert.equal(dailyBuddy(s,day).completion(),null);
  assert.equal(dailyBuddy(s,'2026-11-17').completion(),null,'yesterday does not count');
});
test('damaged or blocked storage does not break buddy greetings',()=>{
  const blocked={getItem(){throw Error();},setItem(){throw Error();}};
  assert.equal(dailyBuddy(blocked,'2026-11-16').visit(),null);
  assert.equal(dailyBuddy(blocked,'2026-11-16').completion(),null);
});
