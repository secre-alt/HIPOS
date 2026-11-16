import test from 'node:test';
import assert from 'node:assert/strict';
import {music} from '../pwa/audio.js';

test('cheer ducking restores its own envelope, preserves user volume, and stays silent when stopped',()=>{
  const gains=[];
  const param=()=>({value:0,events:[],setValueAtTime(...args){this.events.push(['value',...args]);},setTargetAtTime(...args){this.events.push(['target',...args]);},exponentialRampToValueAtTime(){},cancelScheduledValues(){},cancelAndHoldAtTime(time){this.events.push(['hold',time]);}});
  const node=()=>({connect(){},disconnect(){},start(){},stop(){},gain:param(),frequency:param(),detune:param(),Q:param(),delayTime:param(),threshold:param(),ratio:param()});
  class AudioContext{
    currentTime=10;sampleRate=100;state='running';destination=node();
    createGain(){const n=node();gains.push(n);return n;}
    createOscillator(){return node();}createBiquadFilter(){return node();}
    createDynamicsCompressor(){return node();}createDelay(){return node();}
    createBuffer(){return {getChannelData:()=>new Float32Array(100)};}
    createBufferSource(){return node();}
  }
  const previous=globalThis.AudioContext;globalThis.AudioContext=AudioContext;
  try{
    music.duck();assert.equal(gains.length,0,'ducking never starts audio');
    music.setLevel(.7);music.start();
    const duck=gains[2].gain,volume=gains[3].gain;
    const volumeBefore=structuredClone(volume.events);
    music.duck();
    assert.deepEqual(duck.events.slice(-3),[['hold',10],['target',.3,10,.04],['target',1,11.1,.3]]);
    assert.deepEqual(volume.events,volumeBefore,'ducking leaves user volume automation alone');
    music.setLevel(.2);assert.equal(volume.events.at(-1)[1],.2);
    music.duck();assert.equal(duck.events.filter(e=>e[0]==='hold').length,2,'repeated cheers replace the envelope');
    music.stop();const count=duck.events.length;music.duck();assert.equal(duck.events.length,count);
    assert.equal(volume.events.at(-1)[1],0,'restoring the duck envelope cannot restart stopped music');
  }finally{music.stop();if(previous)globalThis.AudioContext=previous;else delete globalThis.AudioContext;}
});
