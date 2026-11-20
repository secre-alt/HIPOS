import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSession,validSession,quizForToday,questionBank,localDay,readDaily} from '../pwa/activities.js';
import {challengeIndex,schoolSection} from '../pwa/engagement.js';
import {schoolInfo} from '../pwa/school-info.js';

test('quiz selects three distinct valid questions and avoids the previous set',()=>{
  let previous=[];
  for(let i=0;i<100;i++){
    const session=makeSession(previous);
    assert.equal(validSession(session),true);
    assert.equal(session.ids.some(id=>previous.includes(id)),false);
    previous=session.ids;
  }
  assert.equal(questionBank.length,9);
});
test('quiz rejects corrupted and impossible saved progress',()=>{
  const good={ids:[0,1,2],answers:[0],position:0};
  assert.equal(validSession(good),true);
  for(const changes of [{ids:[0,0,1]},{ids:[0,1,99]},{answers:[2]},{position:2},{position:3},{position:-1},{ids:null},{answers:[0,1,0,1]}])assert.ok(!validSession({...good,...changes}));
  assert.ok(validSession({ids:[0,1,2],answers:[0,1,1],position:3}));
});
test('daily reminders use the device calendar date and do not carry yesterday forward',()=>{
  assert.equal(localDay(new Date(2026,0,2,0,1)),'2026-01-02');
  const storage={getItem:()=>JSON.stringify({day:'2026-01-01',checked:[true,true,true]})};
  assert.deepEqual(readDaily(storage,'2026-01-02').checked,[false,false,false]);
  assert.deepEqual(readDaily(storage,'2026-01-01').checked,[true,true,true]);
});
test('daily challenges rotate by calendar day, including month and year boundaries',()=>{
  assert.equal(challengeIndex('2026-11-14'),challengeIndex('2026-11-14'));
  assert.equal(challengeIndex('2027-01-01'),(challengeIndex('2026-12-31')+1)%7);
  assert.equal(challengeIndex('2026-03-01'),(challengeIndex('2026-02-28')+1)%7);
});
test('school information is unpublished without approval metadata and escapes approved text',()=>{
  assert.match(schoolSection(),/Awaiting school approval/);
  schoolInfo.entries.push({title:'Unconfirmed',detail:'Do not publish',status:'approved'});
  assert.doesNotMatch(schoolSection(),/Do not publish/);
  schoolInfo.entries.push({title:'<script>test</script>',detail:'Approved example',status:'approved',approvedBy:'School office',reviewedOn:'2026-11-14',source:'School memo'});
  assert.match(schoolSection(),/&lt;script&gt;/);
  schoolInfo.entries.length=0;
});

test('the sorting check starts fresh each day without pressing Try again',()=>{
  const finished={ids:[3,4,5],answers:[1,1,0],position:3,day:'2026-11-20'};
  assert.equal(quizForToday(finished,'2026-11-20'),finished,'same day keeps the result');
  const next=quizForToday(finished,'2026-11-21');
  assert.deepEqual([next.answers.length,next.position,next.day],[0,0,localDay()]);
  assert.equal(next.ids.some(id=>finished.ids.includes(id)),false,'new day avoids yesterday’s questions');
  const midway={ids:[0,1,2],answers:[0],position:0,day:'2026-11-19'};
  assert.equal(quizForToday(midway,'2026-11-20').answers.length,0,'yesterday’s half-done quiz is replaced');
  assert.equal(quizForToday({ids:[0,1,2],answers:[0],position:0},'2026-11-20').day,'2026-11-20','old saves without a day carry on today');
  assert.equal(quizForToday({ids:[0,1,2],answers:[0,0,0],position:3},'2026-11-20').position,0,'old finished saves reset');
  assert.equal(quizForToday(null,'2026-11-20').position,0);
});
