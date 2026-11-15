// Game-style audio for HIPOS: synthesized sound effects and a lofi Japanese-anime-game style generative music loop.
// Everything is generated with the Web Audio API, so there are no audio files to cache or license,
// it works offline, and nothing is sent anywhere. Safe to import where Web Audio does not exist.
let ctx=null,sfxBus=null,musicBus=null,echo=null,mix=null,wobble=null,noiseBuf=null;
const levels={sfx:.85,music:.5};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const hz=m=>440*Math.pow(2,(m-69)/12);

function ensure(){
  if(ctx){if(ctx.state==='suspended')ctx.resume?.();return ctx;}
  const Ctx=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Ctx)return null;
  ctx=new Ctx();
  const master=ctx.createGain();master.gain.value=.9;master.connect(ctx.destination);
  sfxBus=ctx.createGain();sfxBus.gain.value=levels.sfx;sfxBus.connect(master);
  musicBus=ctx.createGain();musicBus.gain.value=0;musicBus.connect(master);
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

// ---------- Music: lofi Japanese anime game style ----------
// Swung beat, warm Rhodes-style 9th chords, koto-style plucks in the hirajoshi scale, tape wobble and vinyl crackle.
// Chords are [bass note, voicing]. Progressions use the J-pop "royal road" shape and jazzy ii-V turnarounds.
const FM9=[41,[57,60,64,67]],G9=[43,[59,62,65,69]],Em9=[40,[55,59,62,66]],Am9=[45,[55,59,60,64]],CM9=[48,[59,62,64,67]],Dm9=[50,[60,64,65,69]];
const THEMES={
  default:{bpm:74,prog:[FM9,G9,Em9,Am9]},
  earth:{bpm:70,prog:[CM9,Am9,Dm9,G9]},
  christmas:{bpm:78,prog:[FM9,Em9,Dm9,CM9]},
  wika:{bpm:72,prog:[Am9,Dm9,G9,CM9]},
};
const HIRA=[64,65,69,71,72,76,77,81]; // E F A B C E F A: hirajoshi on A, fits all the chords above
const SWING=.2;
let theme='default',playing=false,timer=null,nextTime=0,step=0,melody=3;

function noise(dest,{t=0,len=.1,vol=.1,type='highpass',freq=6000,q=.7,attack=.002}){
  const start=ctx.currentTime+t,src=ctx.createBufferSource(),filt=ctx.createBiquadFilter(),gain=ctx.createGain();
  src.buffer=noiseBuf;filt.type=type;filt.frequency.value=freq;filt.Q.value=q;
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(vol,start+attack);
  gain.gain.exponentialRampToValueAtTime(.0001,start+len);
  src.connect(filt);filt.connect(gain);gain.connect(dest);
  src.start(start,Math.random()*.5);src.stop(start+len+.03);
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
}
// Rhodes-ish key: soft sine body plus a quick "tine" overtone, lightly strummed.
function chord(notes,t,len,vol){
  notes.forEach((m,i)=>{
    const f=hz(m),at=t+i*.014;
    tone(mix,{f,t:at,len,vol,attack:.012});
    tone(mix,{f:f*2,t:at,len:len*.45,type:'triangle',vol:vol*.18,attack:.006});
    tone(mix,{f:f*4,t:at,len:.18,vol:vol*.1,attack:.004});
  });
}

function scheduleStep(i,when,stepLen){
  const [bass,notes]=THEMES[theme].prog[Math.floor(i/8)%4],s=i%8;
  // Swing the off-beats and humanize the timing a little.
  const t=when-ctx.currentTime+(s%2?stepLen*SWING:0)+(Math.random()-.5)*.012;

  // Chords: a long hit on the downbeat, soft off-beat stabs.
  if(s===0)chord(notes,t,2.1,.075);
  else if(s===3&&Math.random()<.75)chord(notes,t,.55,.045);
  else if(s===6&&Math.random()<.45)chord(notes,t,.4,.04);

  // Bass: warm sine on the root, octave bounce later in the bar.
  if(s===0)tone(mix,{f:hz(bass),t,len:1.3,vol:.26,attack:.02});
  if(s===5&&Math.random()<.6)tone(mix,{f:hz(bass+12),t,len:.5,vol:.16,attack:.02});

  // Drums: lazy kick, laid-back snare on 2 and 4, dusty hats.
  if(s===0||(s===5&&Math.random()<.7)||(s===3&&Math.random()<.25))tone(mix,{f:130,to:42,t,len:.2,vol:.5,attack:.003});
  if(s===2||s===6){
    noise(mix,{t:t+.01,len:.17,vol:.14,type:'bandpass',freq:1900,q:.8});
    tone(mix,{f:200,to:140,t:t+.01,len:.1,type:'triangle',vol:.1});
  }
  noise(mix,{t,len:s===7&&Math.random()<.2?.18:.04,vol:s%2?.02:.035,freq:7000});

  // Koto-style melody: sparse random walk through the hirajoshi scale, sometimes with a grace note.
  if(s%2===0&&Math.random()<.32){
    melody=clamp(melody+[-2,-1,-1,0,1,1,2][Math.floor(Math.random()*7)],0,HIRA.length-1);
    if(Math.random()<.2&&melody<HIRA.length-1)pluck({f:hz(HIRA[melody+1]),t:t-.06,len:.18,vol:.05});
    pluck({f:hz(HIRA[melody]),t,len:1.1,vol:.085});
  }

  // Vinyl crackle: a few tiny clicks per step.
  const clicks=Math.random()<.5?1+Math.floor(Math.random()*3):0;
  for(let k=0;k<clicks;k++)noise(musicBus,{t:t+Math.random()*stepLen,len:.006,vol:.02+Math.random()*.03,freq:2500,attack:.0005});
}
function pump(){
  if(!playing||!ctx)return;
  const stepLen=60/THEMES[theme].bpm/2;
  while(nextTime<ctx.currentTime+.4){scheduleStep(step++,nextTime,stepLen);nextTime+=stepLen;}
  timer=setTimeout(pump,100);
}
export const music={
  start(){
    if(playing||!ensure())return;
    playing=true;nextTime=ctx.currentTime+.15;
    musicBus.gain.setTargetAtTime(levels.music,ctx.currentTime,.2);
    pump();
  },
  stop(){
    playing=false;clearTimeout(timer);
    if(ctx)musicBus.gain.setTargetAtTime(0,ctx.currentTime,.15);
  },
  get playing(){return playing;},
  setLevel(v){levels.music=clamp(Number(v)||0,0,1);if(ctx&&playing)musicBus.gain.setTargetAtTime(levels.music,ctx.currentTime,.05);},
  setTheme(name){theme=THEMES[name]?name:'default';},
};
