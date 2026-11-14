import test from 'node:test';
import assert from 'node:assert/strict';
import {currentStreak,bestRun,badges,isActive} from '../pwa/streak.js';
const day=(y,m,d)=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const on=(...ids)=>Object.fromEntries(ids.map(id=>[id,{habits:1}]));
const today=new Date(2026,10,15);
test('an empty history has no streak',()=>{assert.deepEqual(currentStreak({},today),{count:0,todayDone:false});});
test('today counts, and yesterday keeps a streak alive until today is done',()=>{
  assert.deepEqual(currentStreak(on(day(2026,11,15),day(2026,11,14)),today),{count:2,todayDone:true});
  assert.deepEqual(currentStreak(on(day(2026,11,14),day(2026,11,13)),today),{count:2,todayDone:false});
});
test('a missed day ends the streak',()=>{
  assert.equal(currentStreak(on(day(2026,11,15),day(2026,11,13)),today).count,1);
  assert.equal(currentStreak(on(day(2026,11,12),day(2026,11,11)),today).count,0);
});
test('streaks cross month and year ends',()=>{
  assert.equal(currentStreak(on(day(2027,3,1),day(2027,2,28),day(2027,2,27)),new Date(2027,2,1)).count,3);
  assert.equal(currentStreak(on(day(2027,1,1),day(2026,12,31),day(2026,12,30)),new Date(2027,0,1)).count,3);
});
test('only habits or a completed challenge make a day active',()=>{
  assert.equal(isActive({habits:0}),false);assert.equal(isActive({challenge:'skipped'}),false);assert.equal(isActive(undefined),false);
  assert.equal(isActive({habits:2}),true);assert.equal(isActive({challenge:'done'}),true);
});
test('best run finds the longest stretch and ignores bad keys',()=>{
  const days={...on(day(2026,11,1),day(2026,11,2),day(2026,11,3),day(2026,11,4),day(2026,11,8),day(2026,11,9)),'not-a-date':{habits:3}};
  assert.equal(bestRun(days),4);assert.equal(bestRun({}),0);
});
test('badges unlock from habits, runs and first action',()=>{
  const none=badges({},0);assert.ok(none.every(b=>!b.earned));
  const some=badges({[day(2026,11,1)]:{habits:3}},3);
  assert.deepEqual(some.map(b=>[b.key,b.earned]),[['first',true],['habits',true],['streak3',true],['streak7',false]]);
  assert.equal(badges({[day(2026,11,1)]:{habits:1}},1).find(b=>b.key==='habits').earned,false);
});
