import test from 'node:test';
import assert from 'node:assert/strict';
const memoryStorage=()=>{const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};
globalThis.localStorage=memoryStorage();
const fx=await import('../pwa/buddy-fx.js');
const {makeRound}=await import('../pwa/sortgame.js');
const badge=(key,earned=true)=>({key,earned});

test('settings default to cheers on, sound off, default theme',()=>{
  assert.equal(fx.cheersOn(),true);assert.equal(fx.soundOn(),false);assert.equal(fx.season(),'default');
  localStorage.setItem('hipos.sound','on');localStorage.setItem('hipos.season','nonsense');
  assert.equal(fx.soundOn(),true);assert.equal(fx.season(),'default');localStorage.removeItem('hipos.sound');
});
test('one treat per habit per day: ticking again cannot farm treats',()=>{
  assert.equal(fx.giveTreat(0,'2026-11-15'),true);assert.equal(fx.giveTreat(0,'2026-11-15'),false);
  assert.equal(fx.giveTreat(1,'2026-11-15'),true);assert.equal(fx.giveTreat(0,'2026-11-16'),true);
  assert.equal(fx.giveTreat(3,'2026-11-16'),false);assert.equal(fx.giveTreat(-1,'2026-11-16'),false);
  assert.equal(fx.stats().treats,3);
});
test('taps and finished sorting rounds are counted',()=>{
  for(let i=0;i<3;i++)fx.recordTap();fx.recordSort(4,6);fx.recordSort(6,6);
  const s=fx.stats();assert.equal(s.taps,3);assert.equal(s.sorts,2);assert.equal(s.perfect,1);
});
test('stickers come from badges and counters, are kept, and are announced once',()=>{
  const week={badges:[badge('first'),badge('habits',false)],challengeDays:0};
  const first=fx.syncStickers(week).map(t=>t.key).sort();
  assert.deepEqual(first,['first','perfect','sort1']);
  assert.deepEqual(fx.syncStickers(week),[],'already collected');
  for(let i=0;i<7;i++)fx.recordTap();
  assert.deepEqual(fx.syncStickers({badges:[],challengeDays:3}).map(t=>t.key).sort(),['challenge3','tap10']);
  assert.match(fx.stickerBook(),/5 of 11 stickers collected/);
});
test('damaged saved data falls back safely and is sanitized',async()=>{
  localStorage.setItem('hipos.buddy.v1','{"taps":-5,"treats":"x","sorts":2.5,"stickers":["nope","first"],"seasons":["wika","bad","default"],"treatDays":{"bad":1,"2026-11-15":9}}');
  const fresh=await import('../pwa/buddy-fx.js?fresh1');const s=fresh.stats();
  assert.deepEqual([s.taps,s.treats,s.sorts],[0,0,0]);assert.deepEqual(s.stickers,['first']);assert.deepEqual(s.seasons,['wika']);assert.deepEqual(s.treatDays,{});
  localStorage.setItem('hipos.buddy.v1','not json');
  assert.equal((await import('../pwa/buddy-fx.js?fresh2')).stats().taps,0);
});
test('mood follows time of day and streak',()=>{
  const day=h=>new Date(2026,10,15,h);
  assert.equal(fx.moodFor({streak:{count:5,todayDone:true}},day(14)),'excited');
  assert.equal(fx.moodFor({streak:{count:1,todayDone:true}},day(14)),'happy');
  assert.equal(fx.moodFor({streak:{count:0,todayDone:false}},day(14)),'calm');
  assert.equal(fx.moodFor({streak:{count:9,todayDone:true}},day(23)),'sleepy');assert.equal(fx.moodFor({},day(3)),'sleepy');
});
test('a sorting round has six items, balanced, and prefers fresh ones',()=>{
  for(let n=0;n<20;n++){const r=makeRound();assert.equal(r.length,6);assert.equal(r.filter(x=>x.suitable).length,3);assert.equal(new Set(r.map(x=>x.title)).size,6);}
  const first=makeRound(),second=makeRound(Math.random,first.map(x=>x.title));
  assert.equal(second.filter(x=>first.some(f=>f.title===x.title)).length,0,'no repeats when enough items remain');
});
test('background music is off by default and its volume is kept in range',()=>{
  assert.equal(fx.musicOn(),false);assert.equal(fx.musicLevel(),50);
  localStorage.setItem('hipos.music','on');localStorage.setItem('hipos.musicvol','900');
  assert.equal(fx.musicOn(),true);assert.equal(fx.musicLevel(),100);
  localStorage.setItem('hipos.musicvol','nonsense');assert.equal(fx.musicLevel(),50);
  localStorage.removeItem('hipos.music');localStorage.removeItem('hipos.musicvol');
});
test('audio engine imports safely without Web Audio and ignores sounds there',async()=>{
  const audio=await import('../pwa/audio.js');
  assert.ok(audio.SFX_NAMES.includes('win')&&audio.SFX_NAMES.includes('pop'));
  audio.playSfx('pop');audio.music.start();assert.equal(audio.music.playing,false);
});
