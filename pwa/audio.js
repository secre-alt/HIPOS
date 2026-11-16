// Game-style audio for HIPOS: synthesized sound effects and a choice of generative background music styles (lofi anime by default).
// Everything is generated with the Web Audio API, so there are no audio files to cache or license,
// it works offline, and nothing is sent anywhere. Safe to import where Web Audio does not exist.
let ctx=null,sfxBus=null,musicBus=null,duckBus=null,echo=null,mix=null,wobble=null,noiseBuf=null;
const levels={sfx:.85,music:.5};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const hz=m=>440*Math.pow(2,(m-69)/12);

function ensure(){
  if(ctx){if(ctx.state==='suspended')ctx.resume?.();return ctx;}
  const Ctx=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Ctx)return null;
  ctx=new Ctx();
  const master=ctx.createGain();master.gain.value=.9;master.connect(ctx.destination);
  sfxBus=ctx.createGain();sfxBus.gain.value=levels.sfx;sfxBus.connect(master);
  // A separate envelope keeps temporary ducking independent of volume and track fades.
  duckBus=ctx.createGain();duckBus.gain.value=1;duckBus.connect(master);
  musicBus=ctx.createGain();musicBus.gain.value=0;musicBus.connect(duckBus);
  // Lofi chain for music: instruments -> mix -> dull "tape" lowpass -> gentle compressor -> musicBus.
  const comp=ctx.createDynamicsCompressor();comp.threshold.value=-20;comp.ratio.value=3;comp.connect(musicBus);
  const tape=ctx.createBiquadFilter();tape.type='lowpass';tape.frequency.value=4200;tape.Q.value=.4;tape.connect(comp);
  mix=ctx.createGain();mix.connect(tape);
  // Soft dotted-eighth echo that only the music uses.
  const delay=ctx.createDelay(1),feedback=ctx.createGain(),lowpass=ctx.createBiquadFilter();
  delay.delayTime.value=.4;feedback.gain.value=.32;lowpass.type='lowpass';lowpass.frequency.value=1800;
  echo=ctx.createGain();echo.gain.value=.4;
  echo.connect(delay);delay.connect(lowpass);lowpass.connect(feedback);feedback.connect(delay);lowpass.connect(tape);
  // Slow tape wobble: a tiny pitch drift shared by every music voice.
  const lfo=ctx.createOscillator();wobble=ctx.createGain();lfo.frequency.value=.35;wobble.gain.value=9;lfo.connect(wobble);lfo.start();
  // One second of white noise for hats, snares and vinyl crackle.
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
  const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  return ctx;
}

function tone(bus,{f,t=0,len=.15,type='sine',vol=.2,to,send=false,attack=.008}){
  const start=ctx.currentTime+t,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(f,start);if(bus===mix&&wobble)wobble.connect(osc.detune);
  if(to)osc.frequency.exponentialRampToValueAtTime(to,start+len);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(vol,start+Math.min(attack,len/2));
  gain.gain.exponentialRampToValueAtTime(.0001,start+len);
  osc.connect(gain);gain.connect(bus);if(send&&echo)gain.connect(echo);
  osc.start(start);osc.stop(start+len+.03);
  osc.onended=()=>{if(bus===mix)wobble?.disconnect(osc.detune);osc.disconnect();gain.disconnect();};
}

// ---------- Sound effects ----------
// Names already used by the app (pop, boop, chime, tada, oops) keep working; the rest are new.
const arp=(midis,step,o)=>midis.map((m,i)=>({f:hz(m),t:i*step,...o}));
const SFX={
  tick:()=>[{f:hz(88),len:.05,type:'triangle',vol:.12}],
  pop:()=>[{f:520,to:1100,len:.09,vol:.22}],
  boop:()=>[{f:hz(64),len:.09,type:'triangle',vol:.2},{f:hz(71),t:.07,len:.1,type:'triangle',vol:.2}],
  chime:()=>arp([83,88],.09,{len:.22,vol:.18}),
  coin:()=>[{f:hz(83),len:.07,type:'square',vol:.07},{f:hz(88),t:.07,len:.22,type:'square',vol:.07}],
  whoosh:()=>[{f:260,to:1300,len:.2,type:'triangle',vol:.1}],
  undo:()=>[{f:800,to:380,len:.13,vol:.2}],
  oops:()=>[{f:hz(67),to:hz(67)*.9,len:.14,vol:.22},{f:hz(63),to:hz(63)*.88,t:.12,len:.22,vol:.22}],
  star:()=>arp([76,81,88],.07,{len:.28,vol:.18}),
  tada:()=>arp([72,76,79,84],.08,{len:.24,type:'triangle',vol:.22}),
  unlock:()=>arp([79,83,86,91],.06,{len:.26,type:'triangle',vol:.2}),
  win:()=>[...arp([72,76,79,84,79,84,88],.09,{len:.24,type:'triangle',vol:.22}),{f:hz(91),t:.66,len:.5,vol:.18}],
};
export const SFX_NAMES=Object.keys(SFX);
export function playSfx(name){
  if(!ensure())return;
  for(const n of (SFX[name]||SFX.pop)())tone(sfxBus,n);
}

// ---------- Music: several generative styles ----------
// Styles: lofi (anime), sakura, arcade, rain, city, musicbox. Chords are [bass note, voicing].
// The season theme still recolors the progressions of the "lofi" and "musicbox" styles.
const FM9=[41,[57,60,64,67]],G9=[43,[59,62,65,69]],Em9=[40,[55,59,62,66]],Am9=[45,[55,59,60,64]],CM9=[48,[59,62,64,67]],Dm9=[50,[60,64,65,69]];
const C3=[48,[60,64,67]],G3=[43,[59,62,67]],Am3=[45,[57,60,64]],F3=[41,[57,60,65]];
const LOFI_THEMES={
  default:{bpm:74,prog:[FM9,G9,Em9,Am9]},
  earth:{bpm:70,prog:[CM9,Am9,Dm9,G9]},
  christmas:{bpm:78,prog:[FM9,Em9,Dm9,CM9]},
  wika:{bpm:72,prog:[Am9,Dm9,G9,CM9]},
};
const BC=[48,[60,64,67,72]],BAm=[45,[57,60,64,69]],BF=[41,[57,60,65,69]],BG=[43,[59,62,67,71]];
const BOX_THEMES={
  default:{bpm:92,prog:[BC,BAm,BF,BG]},
  earth:{bpm:84,prog:[BC,BG,BAm,BF]},
  christmas:{bpm:104,prog:[BC,BF,BG,BC]},
  wika:{bpm:100,prog:[BC,BF,BAm,BG]},
};
const HIRA=[64,65,69,71,72,76,77,81];   // hirajoshi on A (E F A B C E F A)
const PENTA=[72,74,76,79,81,84];        // C major pentatonic
const BOX_PATTERN=[0,2,1,3,2,3,1,2];
let style='lofi',theme='default',playing=false,timer=null,nextTime=0,step=0,melody=2;

const pick=a=>a[Math.floor(Math.random()*a.length)];
const walk=(len,moves=[-2,-1,0,1,2])=>{melody=clamp(melody+pick(moves),0,len-1);return melody;};

function noise(dest,{t=0,len=.1,vol=.1,type='highpass',freq=6000,q=.7,attack=.002}){
  const start=ctx.currentTime+t,src=ctx.createBufferSource(),filt=ctx.createBiquadFilter(),gain=ctx.createGain();
  src.buffer=noiseBuf;src.loop=true;filt.type=type;filt.frequency.value=freq;filt.Q.value=q;
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(vol,start+attack);
  gain.gain.exponentialRampToValueAtTime(.0001,start+len);
  src.connect(filt);filt.connect(gain);gain.connect(dest);
  src.start(start,Math.random()*.5);src.stop(start+len+.03);
  src.onended=()=>{src.disconnect();filt.disconnect();gain.disconnect();};
}
// Koto-style pluck: bright saw that closes into a soft lowpass, with a tiny pitch dip on the attack.
function pluck({f,t=0,len=1,vol=.09}){
  const start=ctx.currentTime+Math.max(0,t),osc=ctx.createOscillator(),filt=ctx.createBiquadFilter(),gain=ctx.createGain();
  osc.type='sawtooth';osc.frequency.setValueAtTime(f*1.012,start);osc.frequency.exponentialRampToValueAtTime(f,start+.05);
  if(wobble)wobble.connect(osc.detune);
  filt.type='lowpass';filt.Q.value=2;
  filt.frequency.setValueAtTime(3200,start);filt.frequency.exponentialRampToValueAtTime(420,start+.28);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(vol,start+.004);
  gain.gain.exponentialRampToValueAtTime(.0001,start+len);
  osc.connect(filt);filt.connect(gain);gain.connect(mix);if(echo)gain.connect(echo);
  osc.start(start);osc.stop(start+len+.03);
  osc.onended=()=>{wobble?.disconnect(osc.detune);osc.disconnect();filt.disconnect();gain.disconnect();};
}
// Rhodes-ish key: soft sine body plus a quick "tine" overtone.
function key(f,t,len,vol,send=false){
  tone(mix,{f,t,len,vol,attack:.012,send});
  tone(mix,{f:f*2,t,len:len*.45,type:'triangle',vol:vol*.18,attack:.006});
  tone(mix,{f:f*4,t,len:.18,vol:vol*.1,attack:.004});
}
function chord(notes,t,len,vol){notes.forEach((m,i)=>key(hz(m),t+i*.014,len,vol));}
// Slow soft pad.
function pad(notes,t,len,vol){
  const attack=Math.min(.7,len/2);
  notes.forEach(m=>{
    tone(mix,{f:hz(m),t,len,vol,attack});
    tone(mix,{f:hz(m)*1.004,t,len,type:'triangle',vol:vol*.5,attack});
  });
}
// Music-box bell.
function bell(f,t,len,vol){
  tone(mix,{f,t,len,vol,send:true});
  tone(mix,{f:f*3,t,len:len*.3,vol:vol*.15});
}
const kick=(t,vol=.5)=>tone(mix,{f:130,to:42,t,len:.2,vol,attack:.003});

// ----- Lofi Anime: swung beat, Rhodes chords, koto plucks, vinyl crackle -----
function lofiStep(s,t,stepLen,[bass,notes]){
  if(s===0)chord(notes,t,2.1,.075);
  else if(s===3&&Math.random()<.75)chord(notes,t,.55,.045);
  else if(s===6&&Math.random()<.45)chord(notes,t,.4,.04);
  if(s===0)tone(mix,{f:hz(bass),t,len:1.3,vol:.26,attack:.02});
  if(s===5&&Math.random()<.6)tone(mix,{f:hz(bass+12),t,len:.5,vol:.16,attack:.02});
  if(s===0||(s===5&&Math.random()<.7)||(s===3&&Math.random()<.25))kick(t);
  if(s===2||s===6){
    noise(mix,{t:t+.01,len:.17,vol:.14,type:'bandpass',freq:1900,q:.8});
    tone(mix,{f:200,to:140,t:t+.01,len:.1,type:'triangle',vol:.1});
  }
  noise(mix,{t,len:s===7&&Math.random()<.2?.18:.04,vol:s%2?.02:.035,freq:7000});
  if(s%2===0&&Math.random()<.32){
    const m=walk(HIRA.length,[-2,-1,-1,0,1,1,2]);
    if(Math.random()<.2&&m<HIRA.length-1)pluck({f:hz(HIRA[m+1]),t:t-.06,len:.18,vol:.05});
    pluck({f:hz(HIRA[m]),t,len:1.1,vol:.085});
  }
  const clicks=Math.random()<.5?1+Math.floor(Math.random()*3):0;
  for(let k=0;k<clicks;k++)noise(musicBus,{t:t+Math.random()*stepLen,len:.006,vol:.02+Math.random()*.03,freq:2500,attack:.0005});
}

// ----- Sakura Garden: slow, drumless, koto and a breathy flute over a soft pad -----
function sakuraStep(s,t,stepLen,[bass,notes]){
  if(s===0){pad(notes,t,stepLen*8,.045);tone(mix,{f:hz(bass),t,len:3.2,vol:.2,attack:.05});}
  if(Math.random()<(s%2?.12:.45)){
    const m=walk(HIRA.length);
    pluck({f:hz(HIRA[m]),t,len:1.6,vol:.09});
  }
  if(s===0&&Math.random()<.5)tone(mix,{f:hz(HIRA[clamp(melody+3,0,HIRA.length-1)]),t:t+.05,len:2.6,vol:.045,attack:.35,send:true});
  if(s===4&&Math.random()<.35)pluck({f:hz(notes[0]-12),t,len:1.4,vol:.1});
}

// ----- Pixel Adventure: chiptune square waves, bouncy bass, arcade JRPG feel -----
function arcadeStep(s,t,stepLen,[bass,notes]){
  const sq=(m,len,vol,send=false)=>tone(mix,{f:hz(m),t,len,type:'square',vol,send,attack:.004});
  tone(mix,{f:hz(s%2?bass+12:bass),t,len:stepLen*.9,type:'triangle',vol:.22,attack:.004});
  sq(notes[s%notes.length]+12,stepLen*.6,.035);
  if(s%2===0&&Math.random()<.6)sq(PENTA[walk(PENTA.length)],stepLen*1.6,.05,true);
  if(s===0||s===4)tone(mix,{f:150,to:45,t,len:.14,vol:.4,attack:.002});
  if(s===2||s===6)noise(mix,{t,len:.1,vol:.07,type:'bandpass',freq:2400,q:.8});
  if(s%2)noise(mix,{t,len:.03,vol:.03,freq:7500});
}

// ----- Rainy Study: slow and quiet, soft chords, a few bells, rain texture -----
function rainStep(s,t,stepLen,[bass,notes]){
  if(s===0){chord(notes,t,3.2,.055);tone(mix,{f:hz(bass),t,len:2.4,vol:.22,attack:.03});}
  if(s===4&&Math.random()<.6)chord(notes,t,1.3,.035);
  if((s===0&&Math.random()<.5)||(s===5&&Math.random()<.25))kick(t,.3);
  if(s===2||s===6)noise(mix,{t,len:.05,vol:.03,type:'bandpass',freq:1800,q:1});
  if(s%2===0&&Math.random()<.18)bell(hz(PENTA[walk(PENTA.length)]),t,1.4,.07);
  noise(musicBus,{t,len:stepLen*2.2,vol:.03,type:'bandpass',freq:3500,q:.4,attack:.25});
  if(Math.random()<.3)noise(musicBus,{t,len:stepLen*2.2,vol:.05,type:'lowpass',freq:500,attack:.3});
}

// ----- City Night: 80s city-pop groove, funky bass, staccato keys -----
function cityStep(s,t,stepLen,[bass,notes]){
  if(s===0)chord(notes,t,1.6,.07);
  if((s===3||s===5)&&Math.random()<.85)chord(notes,t,.28,.045);
  if(s===7&&Math.random()<.4)chord(notes,t,.3,.04);
  if(s===0)tone(mix,{f:hz(bass),t,len:.4,type:'triangle',vol:.24,attack:.01});
  if(s===3)tone(mix,{f:hz(bass+12),t,len:.2,type:'triangle',vol:.2,attack:.01});
  if(s===5)tone(mix,{f:hz(bass+7),t,len:.25,type:'triangle',vol:.2,attack:.01});
  if(s===6&&Math.random()<.6)tone(mix,{f:hz(bass),t,len:.2,type:'triangle',vol:.18,attack:.01});
  if(s===0||s===4||(s===3&&Math.random()<.3))kick(t,.45);
  if(s===2||s===6){
    noise(mix,{t,len:.13,vol:.18,type:'bandpass',freq:2200,q:.8});
    tone(mix,{f:210,to:150,t,len:.09,type:'triangle',vol:.1});
  }
  noise(mix,{t,len:s%4===3?.14:.035,vol:s%2?.02:.03,freq:7000});
  if(s%2===0&&Math.random()<.38)key(hz(PENTA[walk(PENTA.length)]),t,.55,.07,true);
}

// ----- Music Box (the original): gentle arpeggio that never repeats exactly -----
function boxStep(s,t,stepLen,[bass,notes]){
  tone(mix,{f:hz(notes[BOX_PATTERN[s]]),t,len:.55,vol:.15,send:true});
  if(s===0||s===4)tone(mix,{f:hz(bass),t,len:.9,type:'triangle',vol:.2});
  if(s===0)tone(mix,{f:hz(notes[0]-12),t,len:1.6,vol:.08});
  if(s%2===0&&Math.random()<.6)tone(mix,{f:hz(PENTA[walk(PENTA.length)]),t,len:.4,type:'triangle',vol:.11,send:true});
}

const STYLES={
  festival:{label:'School Festival',swing:.04,bpm:126,prog:[F3,G3,Am3,C3],play:festivalStep},
  magical:{label:'Magical Garden',swing:0,bpm:82,prog:[CM9,FM9,Dm9,G9],play:magicalStep},
  chibi:{label:'Chibi Adventure',swing:.08,bpm:118,prog:[C3,Am3,F3,G3],play:chibiStep},
  sunset:{label:'Sunset Walk',swing:.1,bpm:86,prog:[CM9,Am9,FM9,G9],play:sunsetStep},
  lofi:{label:'Lofi Anime',swing:.2,themes:LOFI_THEMES,play:lofiStep},
  sakura:{label:'Sakura Garden',swing:0,bpm:62,prog:[Am9,FM9,CM9,G9],play:sakuraStep},
  arcade:{label:'Pixel Adventure',swing:0,human:.002,bpm:112,prog:[C3,G3,Am3,F3],play:arcadeStep},
  rain:{label:'Rainy Study',swing:.1,bpm:60,prog:[Dm9,G9,CM9,Am9],play:rainStep},
  city:{label:'City Night',swing:.12,bpm:96,prog:[Dm9,G9,CM9,FM9],play:cityStep},
  musicbox:{label:'Music Box',swing:0,themes:BOX_THEMES,play:boxStep},
};
export const MUSIC_STYLES=Object.keys(STYLES);
export const MUSIC_STYLE_LABELS=Object.fromEntries(MUSIC_STYLES.map(id=>[id,STYLES[id].label]));
const cfg=()=>{const st=STYLES[style];return st.themes?(st.themes[theme]||st.themes.default):st;};

function scheduleStep(i,when,stepLen){
  const st=STYLES[style],chordAt=cfg().prog[Math.floor(i/8)%4],s=i%8;
  // Swing the off-beats and humanize the timing a little.
  const t=when-ctx.currentTime+(s%2?stepLen*st.swing:0)+(Math.random()-.5)*(st.human??.012);
  st.play(s,Math.max(0,t),stepLen,chordAt,Math.floor(i/8));
}
function pump(){
  if(!playing||!ctx)return;
  const stepLen=60/cfg().bpm/2;
  while(nextTime<ctx.currentTime+.4){scheduleStep(step++,nextTime,stepLen);nextTime+=stepLen;}
  timer=setTimeout(pump,100);
}
export const music={
  duck(){
    if(!playing||!ctx)return;
    const now=ctx.currentTime,gain=duckBus.gain;
    if(gain.cancelAndHoldAtTime)gain.cancelAndHoldAtTime(now);
    else{const current=gain.value;gain.cancelScheduledValues(now);gain.setValueAtTime(current,now);}
    gain.setTargetAtTime(.3,now,.04);
    gain.setTargetAtTime(1,now+1.1,.3);
  },
  start(){
    if(playing||!ensure())return;
    playing=true;nextTime=ctx.currentTime+.15;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(levels.music,ctx.currentTime,.2);
    pump();
  },
  stop(){
    playing=false;clearTimeout(timer);
    if(ctx){musicBus.gain.cancelScheduledValues(ctx.currentTime);musicBus.gain.setTargetAtTime(0,ctx.currentTime,.15);}
  },
  get playing(){return playing;},
  get style(){return style;},
  setLevel(v){levels.music=clamp(Number(v)||0,0,1);if(ctx&&playing){musicBus.gain.cancelScheduledValues(ctx.currentTime);musicBus.gain.setTargetAtTime(levels.music,ctx.currentTime,.05);}},
  setTheme(name){theme=LOFI_THEMES[name]?name:'default';},
  // Switching style starts the new one on the next beat (notes already scheduled finish naturally).
  setStyle(name){
    style=STYLES[name]?name:'lofi';step=0;melody=2;
    if(playing&&ctx){
      clearTimeout(timer);
      // Let scheduled notes settle under a short fade before the new arrangement.
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setTargetAtTime(0,ctx.currentTime,.08);
      nextTime=ctx.currentTime+.65;
      musicBus.gain.setTargetAtTime(levels.music,nextTime,.2);
      pump();
    }
  },
};

// Original short motifs with alternating phrases and chord-following accompaniment.
function festivalStep(s,t,len,[bass,notes],bar){
  if(s===0||s===4)chord(notes,t,len*1.7,.05);
  if(s%2===0)tone(mix,{f:hz(bass+(s===4?12:0)),t,len:len*.8,type:'triangle',vol:.17});
  if(s===0||s===4)kick(t,.28);
  if(s===2||s===6)noise(mix,{t,len:.09,vol:.065,type:'bandpass',freq:1600});
  noise(mix,{t,len:.025,vol:.012,freq:6500});
  const motif=bar%8<4?[0,2,1,2,3,2,1,0]:[2,3,2,1,0,1,2,3];
  key(hz(notes[motif[s]%notes.length]+12),t,len*1.2,.065,true);
  if(s===7&&bar%4===3)bell(hz(notes[0]+24),t,len*2,.035);
}
function magicalStep(s,t,len,[bass,notes],bar){
  if(s===0){pad(notes,t,len*8,.025);tone(mix,{f:hz(bass),t,len:len*6,vol:.12,attack:.08});}
  const index=(bar%2?s:7-s)%notes.length;
  pluck({f:hz(notes[index]+(s%3===0?12:0)),t,len:len*2.4,vol:.045});
  if(s===0||s===3||s===6)bell(hz(notes[(s+bar)%notes.length]+12),t,len*3,.045);
}
function chibiStep(s,t,len,[bass,notes],bar){
  tone(mix,{f:hz(bass+(s%2?12:0)),t,len:len*.55,type:'triangle',vol:.16});
  if(s===0||s===4)kick(t,.23);
  if(s===2||s===6)noise(mix,{t,len:.06,vol:.05,type:'bandpass',freq:2400});
  const motif=bar%2?[2,1,0,1,2,2,1,0]:[0,0,2,1,2,3,2,1];
  const f=hz(notes[motif[s]%notes.length]+12);
  tone(mix,{f,t,len:len*.7,type:'square',vol:.025});
  key(f/2,t,len*.6,.05);
  if(s===7&&bar%4===3)bell(f*2,t,len,.025);
}
function sunsetStep(s,t,len,[bass,notes],bar){
  if(s===0){chord(notes,t,len*6,.035);tone(mix,{f:hz(bass),t,len:len*3,vol:.15});}
  pluck({f:hz(notes[(s+(bar%2))%notes.length]-12),t,len:len*1.8,vol:.035});
  if(s===2||s===6)noise(mix,{t,len:.07,vol:.025,type:'bandpass',freq:1200});
  if(s===0)kick(t,.16);
  if(s===1||s===4||s===7)key(hz(notes[(s+bar)%notes.length]+12),t,len*2,.045,true);
}
