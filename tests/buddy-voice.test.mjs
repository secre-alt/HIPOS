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
