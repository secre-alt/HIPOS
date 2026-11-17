import test from 'node:test';
import assert from 'node:assert/strict';
import {createBuddyVoice} from '../pwa/buddy-voice.js';
function setup(voices) {
 let time=0,chirps=0,cancelled=0;const lines=[];
 const synth={getVoices:()=>voices,speak:line=>lines.push(line),cancel:()=>cancelled++};
 const buddy=createBuddyVoice({synth,Utterance:class {constructor(text){this.text=text;}},chirp:()=>chirps++,duck:()=>{},now:()=>time});
 return {buddy,lines,synth,tick:()=>time+=7000,get chirps(){return chirps;},get cancelled(){return cancelled;}};
}
test('uses only local language matches, alternates chirps, and throttles reactions',()=>{
 const x=setup([{lang:'en-US',localService:false},{lang:'en-GB',localService:true}]);
 assert.equal(x.buddy.play('Hi!','en'),'speech');assert.equal(x.lines[0].voice.localService,true);
 assert.equal(x.buddy.play('Hi!','en'),'quiet');x.lines[0].onend();x.tick();
 assert.equal(x.buddy.play('Yay!','en'),'chirp');assert.equal(x.chirps,1);
 x.tick();assert.equal(x.buddy.play('Hi!','fil'),'chirp');x.buddy.stop();
});
test('falls back safely without local speech and never queues over existing speech',()=>{
 const x=setup([{lang:'fil-PH',localService:false}]);assert.equal(x.buddy.play('Hi!','fil'),'chirp');
 x.tick();x.synth.speaking=true;assert.equal(x.buddy.play('Hi!','en'),'quiet');assert.equal(x.lines.length,0);
});
test('preview does not need enabled preference and cancellation clears owned speech',()=>{
 const x=setup([{lang:'tl-PH',localService:true}]);assert.equal(x.buddy.play('Hi!','fil',{preview:true}),'speech');
 x.buddy.stop();assert.equal(x.cancelled,1);x.buddy.stop();assert.equal(x.cancelled,1);
});
import {pickVoice,cleanForSpeech,prosody} from '../pwa/buddy-voice.js';
test('picks a friendly local voice and avoids novelty or online ones',()=>{
 const voices=[
  {name:'Zarvox',lang:'en-US',localService:true},
  {name:'Online Natural',lang:'en-US',localService:false},
  {name:'Fred',lang:'en-US',localService:true},
  {name:'Samantha',lang:'en-US',localService:true},
  {name:'Daniel',lang:'en-GB',localService:true},
 ];
 assert.equal(pickVoice(voices,'en').name,'Samantha');
 assert.equal(pickVoice([{name:'Online',lang:'fil-PH',localService:false}],'fil'),null,'no network voices');
 assert.equal(pickVoice([{name:'Blessica',lang:'fil-PH',localService:true},{name:'Other',lang:'tl',localService:true}],'fil').name,'Blessica');
 assert.equal(pickVoice([],'en'),null);
});
test('speech text drops emoji and symbols that engines read aloud',()=>{
 assert.equal(cleanForSpeech('Nice catch! 🍌  Play the game →'),'Nice catch! Play the game');
 assert.equal(cleanForSpeech('Pouch / staff · now'),'Pouch staff now');
});
test('pitch and pace follow the sentence and the chosen tone',()=>{
 const mid=()=>0.5;
 const cheer=prosody('You did it!','sweet',mid),retry=prosody('Almost! Try again.','sweet',mid),calm=prosody('You did it!','calm',mid),bright=prosody('You did it!','bright',mid);
 assert.ok(cheer.pitch>retry.pitch,'a retry is gentler than a cheer');
 assert.ok(calm.rate<cheer.rate&&bright.rate>cheer.rate,'tones change pace');
 for(const t of ['sweet','calm','bright','nope']){const p=prosody('Hi?',t,()=>1);assert.ok(p.pitch>=.8&&p.pitch<=1.6&&p.rate>=.85&&p.rate<=1.2);}
});
test('spoken text is cleaned and the tone is applied',()=>{
 const x=setup([{name:'Samantha',lang:'en-US',localService:true}]);
 assert.equal(x.buddy.play('Hooray 🎉 you did it!','en',{tone:'calm'}),'speech');
 assert.equal(x.lines[0].text,'Hooray you did it!');
 assert.ok(x.lines[0].pitch<1.2,'calm tone is lower');
});
import {babbleNotes,babbleDuration,VOICE_PACK_NAMES} from '../pwa/audio.js';
test('every cute pack turns a line into a short run of blips, in English or Filipino',()=>{
 for(const pack of VOICE_PACK_NAMES){
  const en=babbleNotes('You did it! Great catch!',pack),fil=babbleNotes('Magaling! Nakuha mo!',pack);
  assert.ok(en.length>=4&&en.length<=16,pack+' English');assert.ok(fil.length>=3,pack+' Filipino');
  assert.ok(babbleDuration(en)<3,'stays short');
  for(const n of en)assert.ok(n.f>150&&n.f<3000&&n.len>0&&n.t>=0);
 }
 assert.deepEqual(babbleNotes('',  'bubbly'),[]);assert.deepEqual(babbleNotes('Hi','nope'),[]);
 assert.deepEqual(babbleNotes('Hello there','bubbly'),babbleNotes('Hello there','bubbly'),'same line, same sound');
 const long=babbleNotes('a e i o u '.repeat(20),'sleepy');assert.equal(long.length,16,'long lines are capped');
});
test('packs sound different, and a question lifts while a calm line settles',()=>{
 const f=pack=>babbleNotes('Hello friend',pack)[0].f;
 assert.ok(f('squeaky')>f('bubbly')&&f('bubbly')>f('sleepy'));
 const up=babbleNotes('Ready?','bubbly'),down=babbleNotes('Ready.','bubbly');
 assert.ok(up.at(-1).to>up.at(-1).f&&down.at(-1).to<down.at(-1).f);
});
test('a babble pack plays on any device, throttles, and never overlaps itself',()=>{
 let time=0,made=[],chirps=0;
 const buddy=createBuddyVoice({synth:null,Utterance:null,chirp:()=>chirps++,duck:()=>{},babble:(t,p)=>{made.push([t,p]);return 1.2;},now:()=>time});
 assert.equal(buddy.play('Hooray 🎉 you did it!','en',{pack:'bubbly'}),'babble');assert.deepEqual(made[0],['Hooray you did it!','bubbly']);
 time=2000;assert.equal(buddy.play('Again','en',{pack:'bubbly'}),'quiet','throttled');
 time=5000;assert.equal(buddy.play('Again','en',{pack:'sleepy'}),'babble');assert.equal(made.length,2);
 time=5200;assert.equal(buddy.play('Hi','en',{pack:'bubbly',preview:true}),'quiet','does not overlap the running babble');
 assert.equal(chirps,0);
});
