import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNickname,loadNickname,saveNickname,avatarEditor,buddyStrip,CHARACTERS,FACES,ACCESSORIES,BACKGROUNDS,DEFAULT_AVATAR,normalizeConfig,randomAvatar,renderAvatar,loadAvatar,saveAvatar,syncUnlocks,loadUnlocks,isLocked,greeting,GREETING_LINES} from '../pwa/avatar.js';

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
  assert.equal(locked.length,12);
  for(const a of locked){assert.equal(isLocked(a,[]),true);assert.equal(normalizeConfig({accessory:a.id},[]).accessory,'none');assert.equal(normalizeConfig({accessory:a.id},[a.id]).accessory,a.id);}
  for(const a of ACCESSORIES.filter(a=>!a.unlock))assert.equal(isLocked(a,[]),false);
});
test('badges and challenge days unlock matching extras',()=>{
  globalThis.localStorage=memoryStorage();loadUnlocks();
  assert.deepEqual(syncUnlocks({badges:noBadges,challengeDays:2}),[]);
  const first=syncUnlocks({badges:[badge('first'),badge('habits',false),badge('streak3',false),badge('streak7',false)],challengeDays:3});
  assert.deepEqual(first.map(a=>a.id).sort(),['medal','sprout']);
  assert.deepEqual(syncUnlocks({badges:[badge('streak3'),badge('streak7')],challengeDays:3}).map(a=>a.id).sort(),['flick','halo','rainbow'],'streak3 also opens the Flick buddy');
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
test('sorting, treat, tap and season extras unlock from extra keys',()=>{
  globalThis.localStorage=memoryStorage();loadUnlocks();
  assert.deepEqual(syncUnlocks({badges:noBadges,challengeDays:0,extra:['sort1','tap10','season-wika']}).map(a=>a.id).sort(),['partyhat','salakot','scarf']);
  assert.deepEqual(syncUnlocks({badges:noBadges,challengeDays:0,extra:['sort1','sort5','treat10','season-christmas','season-earth']}).map(a=>a.id).sort(),['backpack','charm','globe','santa']);
  assert.deepEqual(syncUnlocks({badges:noBadges,challengeDays:0,extra:['sort1']}),[]);
});
test('the Hippo buddy is a selectable character with four colors and anchors inside the picture',()=>{
  const hippo=CHARACTERS.find(c=>c.id==='hippo');assert.ok(hippo);assert.equal(hippo.name,'Hippo');assert.equal(hippo.colors.length,4);
  for(const point of [hippo.top,hippo.sl,hippo.sr,hippo.corner])assert.ok(point.x>0&&point.x<120&&point.y>0&&point.y<120);
  assert.equal(normalizeConfig({character:'hippo',color:3}).color,3);
  assert.match(renderAvatar({character:'hippo',color:1,face:2,accessory:'none',bg:0}),/role="img" aria-label="Hippo"/);
  assert.equal(normalizeConfig({character:'hippo',color:9}).color,0,'unknown colors fall back');
});
test('Volt, the hazardous-waste battery buddy, and the Fierce face work with every color and accessory',()=>{
  const volt=CHARACTERS.find(c=>c.id==='volt');assert.ok(volt);assert.equal(volt.colors.length,4);
  for(const point of [volt.top,volt.sl,volt.sr,volt.corner])assert.ok(point.x>0&&point.x<120&&point.y>0&&point.y<120);
  const fierce=FACES.findIndex(f=>f.id==='fierce');assert.ok(fierce>=0,'Fierce face exists');
  for(let color=0;color<volt.colors.length;color++)for(const a of ACCESSORIES){
    const svg=renderAvatar({character:'volt',color,face:fierce,accessory:a.id,bg:0},{teaser:true});
    assert.match(svg,/^<svg[\s\S]*<\/svg>$/);assert.ok(!/undefined|NaN/.test(svg),'no broken numbers');
  }
  assert.match(renderAvatar({character:'volt',color:0,face:fierce,accessory:'none',bg:0},{teaser:true}),/aria-label="Volt"/);
  assert.equal(normalizeConfig({character:'hippo',face:fierce}).face,fierce);
  assert.ok(!/id="/.test(renderAvatar({character:'volt',color:0,face:fierce,accessory:'none',bg:0},{teaser:true})),'no ids, so many avatars never clash');
});

test('Crinkle, Peely and Flick render cleanly with every color, face and accessory',()=>{
  for(const id of ['crinkle','peely','flick']){
    const c=CHARACTERS.find(x=>x.id===id);assert.ok(c,id);assert.equal(c.colors.length,4);
    for(const point of [c.top,c.sl,c.sr,c.corner])assert.ok(point.x>0&&point.x<120&&point.y>0&&point.y<120);
    for(let color=0;color<4;color++)for(let face=0;face<FACES.length;face++)for(const a of ACCESSORIES){
      const svg=renderAvatar({character:id,color,face,accessory:a.id,bg:0},{teaser:true});
      assert.ok(!/undefined|NaN/.test(svg),'no broken numbers');assert.ok(!/id="/.test(svg),'no ids');
    }
    assert.match(renderAvatar({character:id,color:0,face:0,accessory:'none',bg:0},{teaser:true}),new RegExp(`aria-label="${c.name}"`));
  }
});

test('Peely stays locked until a perfect Compost Catch round, then stays unlocked',()=>{
  const none=new Set();
  assert.equal(normalizeConfig({character:'peely'},none).character,'leaf','locked buddy falls back');
  assert.equal(normalizeConfig({character:'peely'},new Set(['peely'])).character,'peely');
  for(let i=0;i<40;i++)assert.notEqual(randomAvatar(()=>0.99,none).character,'peely');
  const fresh=syncUnlocks({badges:[],extra:['compostperfect']});
  assert.deepEqual(fresh.map(x=>x.id),['peely']);
  assert.equal(normalizeConfig({character:'peely'}).character,'peely');
  assert.deepEqual(syncUnlocks({badges:[],extra:['compostperfect']}),[],'only announced once');
});
test('Volt unlocks with a perfect sorting round and Flick with a three-day streak',()=>{
  const none=new Set();
  for(const id of ['volt','flick'])assert.equal(normalizeConfig({character:id},none).character,'leaf',id+' starts locked');
  assert.deepEqual(syncUnlocks({badges:[],extra:['perfect']}).map(x=>x.id).filter(id=>id==='volt'),['volt']);
  assert.equal(normalizeConfig({character:'volt'}).character,'volt');
  assert.equal(normalizeConfig({character:'flick'}).character,'leaf','a perfect round does not open Flick');
  assert.deepEqual(syncUnlocks({badges:[{key:'streak3',earned:true}],extra:[]}).map(x=>x.id).filter(id=>id==='flick'),['flick']);
  assert.equal(normalizeConfig({character:'flick'}).character,'flick');
});

test('nickname length limits preserve whole emoji and existing local saves',()=>{
  const emoji=String.fromCodePoint(0x1f331);
  assert.equal(normalizeNickname('a'.repeat(23)+emoji),'a'.repeat(23));
  assert.equal(normalizeNickname('a'.repeat(22)+emoji+'x'),'a'.repeat(22)+emoji);
  assert.equal(normalizeNickname('  Luna  '),'Luna');
  assert.equal(normalizeNickname(null),'');
  globalThis.localStorage=memoryStorage();
  assert.equal(saveNickname('Luna '+emoji),true);
  assert.equal(loadNickname(),'Luna '+emoji);
  saveAvatar(DEFAULT_AVATAR);
  assert.equal(loadNickname(),'Luna '+emoji);
});
