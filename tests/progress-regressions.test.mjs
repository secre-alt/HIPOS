import test from 'node:test';
import assert from 'node:assert/strict';
const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};};
function environment(t,storage,document){
  const old={localStorage:globalThis.localStorage,document:globalThis.document};
  globalThis.localStorage=storage;globalThis.document=document;
  t.after(()=>Object.assign(globalThis,old));
}

test('history pruning preserves challenge care without counting archived days twice',async t=>{
  const storage=memory();environment(t,storage);
  const {recordChecklist,weekSummary}=await import('../pwa/engagement.js');
  const {carePoints,gardenState}=await import('../pwa/buddy-fx.js?archive-test');
  storage.setItem('hipos.activity.v1',JSON.stringify({days:{'2020-01-01':{challenge:'done'},'2020-01-02':{challenge:'done'},'2020-01-03':{challenge:'done'}},recent:[]}));
  assert.equal(gardenState(carePoints(weekSummary())).blooms,1);
  recordChecklist([false,false,false]);recordChecklist([true,false,false]);
  assert.equal(weekSummary().challengeDays,3);
  assert.equal(gardenState(carePoints(weekSummary())).blooms,1);
  assert.equal(JSON.parse(storage.getItem('hipos.activity.v1')).days['2020-01-01'],undefined);
});

test('catching all food plus plastic does not earn a perfect compost unlock',async t=>{
  environment(t,memory());
  const fx=await import('../pwa/buddy-fx.js?plastic-test');
  fx.recordCompost(12,12,1);
  assert.equal(fx.stats().compost,1);
  assert.equal(fx.stats().compostPerfect,0);
  fx.recordCompost(11,12,0);
  assert.equal(fx.stats().compostPerfect,0);
  fx.recordCompost(12,12,0);
  assert.equal(fx.stats().compostPerfect,1);
});

test('failed reward saves report temporary progress and return failure',async t=>{
  const storage=memory(),events=[];
  environment(t,storage,{dispatchEvent:event=>events.push(event.type)});
  const fx=await import('../pwa/buddy-fx.js?save-test');
  storage.setItem=()=>{throw Error('quota exceeded');};
  assert.equal(fx.giveTreat(0,'2026-11-21'),false);
  assert.equal(fx.stats().treats,1,'play can continue with temporary progress');
  assert.deepEqual(events,['hipos-progress-save-failed']);
  assert.equal(storage.getItem('hipos.buddy.v1'),null);
});

for(const action of ['answerQuiz','nextQuestion'])test(`${action} replaces an overnight quiz instead of finishing it`,async t=>{
  t.mock.timers.enable({apis:['Date'],now:new Date(2026,10,20,23,59).getTime()});
  const storage=memory(),panel={outerHTML:''},question={focus(){}};
  environment(t,storage,{querySelector:selector=>selector==='.quiz-panel'?panel:question});
  storage.setItem('hipos.quiz.v2',JSON.stringify({ids:[0,1,2],answers:[0,1,0],position:2,day:'2026-11-20'}));
  const quiz=await import(`../pwa/activities.js?overnight-${action}`);
  quiz.quiz();
  t.mock.timers.tick(120000);
  const result=quiz[action]({dataset:{answer:'0'}});
  assert.notEqual(result,true,'must not report today completed');
  const saved=JSON.parse(storage.getItem('hipos.quiz.v2'));
  assert.equal(saved.day,'2026-11-21');assert.equal(saved.position,0);assert.deepEqual(saved.answers,[]);
  assert.match(panel.outerHTML,/Question 1 of 3/);
});
