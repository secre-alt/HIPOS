// Game-style audio for HIPOS: synthesized sound effects and a gentle generative music loop.
// Everything is generated with the Web Audio API, so there are no audio files to cache or license,
// it works offline, and nothing is sent anywhere. Safe to import where Web Audio does not exist.
let ctx=null,sfxBus=null,musicBus=null,echo=null;
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
  // Soft sparkly echo that only the music uses.
  const delay=ctx.createDelay(1),feedback=ctx.createGain(),lowpass=ctx.createBiquadFilter();
  delay.delayTime.value=.3;feedback.gain.value=.3;lowpass.type='lowpass';lowpass.frequency.value=2200;
  echo=ctx.createGain();echo.gain.value=.35;
  echo.connect(delay);delay.connect(lowpass);lowpass.connect(feedback);feedback.connect(delay);lowpass.connect(musicBus);
  return ctx;
}

function tone(bus,{f,t=0,len=.15,type='sine',vol=.2,to,send=false,attack=.008}){
  const start=ctx.currentTime+t,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(f,start);
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

// ---------- Music: a gentle music-box loop that never repeats exactly ----------
const C=[48,[60,64,67,72]],Am=[45,[57,60,64,69]],F=[41,[57,60,65,69]],G=[43,[59,62,67,71]];
const THEMES={
  default:{bpm:92,prog:[C,Am,F,G]},
  earth:{bpm:84,prog:[C,G,Am,F]},
  christmas:{bpm:104,prog:[C,F,G,C]},
  wika:{bpm:100,prog:[C,F,Am,G]},
};
const PENTA=[72,74,76,79,81,84],PATTERN=[0,2,1,3,2,3,1,2];
let theme='default',playing=false,timer=null,nextTime=0,step=0,melody=2;

function scheduleStep(i,when){
  const [bass,notes]=THEMES[theme].prog[Math.floor(i/8)%4],s=i%8,t=when-ctx.currentTime;
  tone(musicBus,{f:hz(notes[PATTERN[s]]),t,len:.55,vol:.15,send:true});
  if(s===0||s===4)tone(musicBus,{f:hz(bass),t,len:.9,type:'triangle',vol:.2});
  if(s===0)tone(musicBus,{f:hz(notes[0]-12),t,len:1.6,type:'sine',vol:.08});
  if(s%2===0&&Math.random()<.6){
    melody=clamp(melody+[-2,-1,0,1,2][Math.floor(Math.random()*5)],0,PENTA.length-1);
    tone(musicBus,{f:hz(PENTA[melody]),t,len:.4,type:'triangle',vol:.11,send:true});
  }
}
function pump(){
  if(!playing||!ctx)return;
  const stepLen=60/THEMES[theme].bpm/2;
  while(nextTime<ctx.currentTime+.4){scheduleStep(step++,nextTime);nextTime+=stepLen;}
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
