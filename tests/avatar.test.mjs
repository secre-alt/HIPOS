import test from 'node:test';
import assert from 'node:assert/strict';
import {CHARACTERS,FACES,ACCESSORIES,BACKGROUNDS,DEFAULT_AVATAR,normalizeConfig,randomAvatar,renderAvatar,loadAvatar,saveAvatar,syncUnlocks,loadUnlocks,isLocked,greeting,GREETING_LINES} from '../pwa/avatar.js';

const memoryStorage=()=>{const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};

test('unknown or damaged data falls back to the default buddy',()=>{
  for(const bad of [null,undefined,'leaf',42,[],{},{character:'dragon',color:99,face:-1,accessory:'jetpack',bg:1.5}])assert.deepEqual(normalizeConfig(bad,[]),DEFAULT_AVATAR);
});
test('valid choices are kept and out-of-range indexes are reset',()=>{
  assert.deepEqual(normalizeConfig({character:'bottle',color:3,face:2,accessory:'crown',bg:4},[]),{character:'bottle',color:3,face:2,accessory:'crown',bg:4});
  assert.equal(normalizeConfig({character:'paper',color:4}).color,0);
  assert.equal(normalizeConfig({face:FACES.length}).face,0);
  assert.equal(normalizeConfig({bg:BACKGROUNDS.length}).bg,0);
});
test('every combination renders a clean SVG with no ids',()=>{
  for(const c of CHARACTERS)for(let color=0;color<c.colors.length;color++)for(let face=0;face<FACES.length;face++)for(const a of ACCESSORIES){
    const svg=renderAvatar({character:c.id,color,face,accessory:a.id,bg:0},{teaser:true});
    assert.match(svg,/^<svg /);assert.doesNotMatch(svg,/undefined|NaN|id="/);
  }
});
test('decorative avatars are hidden from screen readers; others are labelled',()=>{
  assert.match(renderAvatar(DEFAULT_AVATAR),/role="img" aria-label="Leaf"/);
  assert.match(renderAvatar(DEFAULT_AVATAR,{decorative:true}),/aria-hidden="true"/);
  assert.doesNotMatch(renderAvatar(DEFAULT_AVATAR,{decorative:true}),/role="img"/);
});
test('randomAvatar is always a valid config',()=>{
  for(let i=0;i<200;i++){const cfg=randomAvatar(Math.random,[]);assert.deepEqual(cfg,normalizeConfig(cfg,[]));assert.ok(!ACCESSORIES.find(a=>a.id===cfg.accessory).unlock,'locked extras are never picked at random');}
  assert.deepEqual(randomAvatar(()=>0,[]),normalizeConfig({character:CHARACTERS[0].id,color:0,face:0,accessory:'none',bg:0},[]));
});
test('a buddy is saved and loaded from this device only',()=>{
  globalThis.localStorage=memoryStorage();
  assert.deepEqual(loadAvatar(),DEFAULT_AVATAR);
  assert.equal(saveAvatar({character:'paper',color:2,face:1,accessory:'bow',bg:3}),true);
  assert.deepEqual(loadAvatar(),{character:'paper',color:2,face:1,accessory:'bow',bg:3});
  localStorage.setItem('hipos.avatar.v1','{not json');
  assert.deepEqual(loadAvatar(),DEFAULT_AVATAR);
});
test('blocked storage does not throw',()=>{
  globalThis.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.deepEqual(loadAvatar(),DEFAULT_AVATAR);
  assert.equal(saveAvatar(DEFAULT_AVATAR),false);
});

const badge=(key,earned=true)=>({key,earned});
const noBadges=['first','habits','streak3','streak7'].map(k=>badge(k,false));
test('extras start locked and a locked extra cannot be equipped',()=>{
  const locked=ACCESSORIES.filter(a=>a.unlock);
  assert.equal(locked.length,5);
  for(const a of locked){assert.equal(isLocked(a,[]),true);assert.equal(normalizeConfig({accessory:a.id},[]).accessory,'none');assert.equal(normalizeConfig({accessory:a.id},[a.id]).accessory,a.id);}
  for(const a of ACCESSORIES.filter(a=>!a.unlock))assert.equal(isLocked(a,[]),false);
});
test('badges and challenge days unlock matching extras',()=>{
  globalThis.localStorage=memoryStorage();loadUnlocks();
  assert.deepEqual(syncUnlocks({badges:noBadges,challengeDays:2}),[]);
  const first=syncUnlocks({badges:[badge('first'),badge('habits',false),badge('streak3',false),badge('streak7',false)],challengeDays:3});
  assert.deepEqual(first.map(a=>a.id).sort(),['medal','sprout']);
  assert.deepEqual(syncUnlocks({badges:[badge('streak3'),badge('streak7')],challengeDays:3}).map(a=>a.id).sort(),['halo','rainbow']);
  assert.deepEqual(syncUnlocks({badges:[badge('habits')],challengeDays:0}).map(a=>a.id),['headband']);
});
test('earned extras are kept after a streak is lost or history is trimmed',()=>{
  globalThis.localStorage=memoryStorage();loadUnlocks();
  syncUnlocks({badges:[badge('first'),badge('streak3')],challengeDays:0});
  assert.deepEqual(syncUnlocks({badges:noBadges,challengeDays:0}),[]);
  const reloaded=loadUnlocks();
  assert.equal(reloaded.has('sprout'),true);assert.equal(reloaded.has('rainbow'),true);
  assert.equal(normalizeConfig({accessory:'rainbow'}).accessory,'rainbow');
});
test('damaged or blocked unlock storage leaves everything locked without throwing',()=>{
  globalThis.localStorage=memoryStorage();localStorage.setItem('hipos.avatar.unlocks.v1','[1,"crown","sprout",{}]');
  assert.deepEqual([...loadUnlocks()],['sprout']);
  localStorage.setItem('hipos.avatar.unlocks.v1','{nope');assert.equal(loadUnlocks().size,0);
  globalThis.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.equal(loadUnlocks().size,0);
  assert.equal(syncUnlocks({badges:[badge('first')],challengeDays:0}).length,1);
});

test('the buddy greets by time of day and the line is stable within a day',()=>{
  const at=(h,d=15)=>new Date(2026,10,d,h,30);
  assert.match(greeting(at(8)),/morning|shine/);
  assert.match(greeting(at(12)),/day|Hello|Hi/);
  assert.match(greeting(at(15)),/afternoon|Hello|Hi/);
  assert.match(greeting(at(19)),/evening|back|Hello/);
  for(const h of [23,2])assert.match(greeting(at(h)),/up|Sleep|owl/);
  assert.equal(greeting(at(8)),greeting(at(10)));
  const lines=new Set([15,16,17].map(d=>greeting(at(8,d))));
  assert.equal(lines.size,3);
  for(let h=0;h<24;h++)assert.ok(GREETING_LINES.includes(greeting(at(h))));
});
test('avatar tiles carry a background index so dark mode can soften them',()=>{
  assert.match(renderAvatar({bg:3}),/class="av-bg" data-bg="3"/);
});
