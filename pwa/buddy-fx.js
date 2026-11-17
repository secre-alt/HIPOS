// Buddy personality: speech bubbles, tap reactions, moods, treats, stickers, optional sounds,
// and a little haptic buzz. Everything is cosmetic and stays on this device (hipos.buddy.v1).
// No text here is ever part of a report, and nothing is sent anywhere.
import {renderAvatar,currentConfig} from './avatar.js';
import {translate,getLanguage} from './i18n.js';
import {createBuddyVoice} from './buddy-voice.js';
import {playSfx,music,MUSIC_STYLES,MUSIC_MOODS} from './audio.js';
import {createCheerPicker} from './cheers.js';

const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const STORE='hipos.buddy.v1',CHEERS='hipos.cheers',SOUND='hipos.sound',SEASON='hipos.season',MUSIC='hipos.music',MUSICVOL='hipos.musicvol',MUSICSTYLE='hipos.musicstyle';

// ---------- Settings (cheers, sound, season) ----------
const read=(key,fallback)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(key,value);return true;}catch{return false;}};
const voice = createBuddyVoice({ synth: globalThis.speechSynthesis, Utterance: globalThis.SpeechSynthesisUtterance, chirp: () => playSfx('buddy'), duck: () => music.duck() });
const voiceOn = () => read('hipos.voice','off') === 'on';
let voiceReady = false;
export const cheersOn=()=>read(CHEERS,'on')!=='off';
export const soundOn=()=>read(SOUND,'off')==='on';
export const musicOn=()=>read(MUSIC,'off')==='on';
export const musicLevel=()=>{const v=Number(read(MUSICVOL,'50'));return Number.isFinite(v)?Math.min(100,Math.max(0,v)):50;};
export const musicStyle=()=>{const v=read(MUSICSTYLE,'lofi');return MUSIC_STYLES.includes(v)?v:'lofi';};
export const SEASONS=['default','christmas','earth','wika'];
export const season=()=>{const v=read(SEASON,'default');return SEASONS.includes(v)?v:'default';};

export function initBuddySettings(){
  const unlockVoice = () => { voiceReady = true; };
  document.addEventListener('pointerdown', unlockVoice, { once: true });
  document.addEventListener('keydown', unlockVoice, { once: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) voice.stop(); });
  document.querySelector('#settings-dialog')?.addEventListener('close', () => voice.stop());
  document.querySelector('#language')?.addEventListener('change', () => voice.stop());
  document.querySelector('#voice-preview')?.addEventListener('click', () => {
    voiceReady = true;
    const result = voice.play(translate('Hi! Let us play!'), getLanguage(), { preview: true });
    document.querySelector('#voice-preview-status').textContent = translate(result === 'speech' ? 'Playing Buddy voice.' : result === 'quiet' ? 'Buddy is already speaking. Try again in a moment.' : 'Cute sounds only: no matching offline voice is installed.');
  });
  const preview=document.querySelector('#music-preview');let previewTimer=null;
  const endPreview=()=>{clearTimeout(previewTimer);previewTimer=null;if(preview){preview.textContent='Preview music';preview.setAttribute('aria-pressed','false');}if(!musicOn())music.stop();};
  preview?.addEventListener('click',()=>{
    if(previewTimer){endPreview();return;}
    music.setStyle(musicStyle());music.start();
    preview.textContent='Stop preview';preview.setAttribute('aria-pressed','true');
    previewTimer=setTimeout(endPreview,10000);
  });
  document.querySelector('#settings-dialog')?.addEventListener('close',endPreview);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)endPreview();});
  document.querySelector('#cheer-preview')?.addEventListener('click',()=>cheer('complete',{preview:true}));
  const bind=(id,get,key,valid,after)=>{
    const select=document.querySelector(id);if(!select)return;
    const isSwitch=select.type==='checkbox';
    if(isSwitch)select.checked=get()==='on';else select.value=get();
    select.addEventListener('change',()=>{
      const value=isSwitch?(select.checked?'on':'off'):select.value;
      const next=valid.includes(value)?value:valid[0];
      if(!write(key,next))document.querySelector('#notice').textContent=translate('Could not save this setting. Try again.');
      if(isSwitch)select.checked=next==='on';else select.value=next;after?.(next);
    });
  };
  const cheerPreview=document.querySelector('#cheer-preview');if(cheerPreview)cheerPreview.disabled=!cheersOn();
  bind('#cheers',()=>cheersOn()?'on':'off',CHEERS,['on','off'],v=>{if(cheerPreview)cheerPreview.disabled=v==='off';if(v==='off'){hideBubble();voice.stop();}else buddySay('Hi! I will cheer you on.');});
  bind('#voice',()=>voiceOn()?'on':'off','hipos.voice',['off','on'],v=>{if(v==='off')voice.stop();});
  bind('#sound',()=>soundOn()?'on':'off',SOUND,['off','on'],v=>{if(v==='on')sound('chime');});
  bind('#music',()=>musicOn()?'on':'off',MUSIC,['off','on'],v=>{endPreview();if(v==='on')music.start();else music.stop();});
  const describeMusic=style=>{const description=document.querySelector('#music-mood');if(description)description.textContent=translate(MUSIC_MOODS[style]);};
  bind('#musicstyle',musicStyle,MUSICSTYLE,MUSIC_STYLES,v=>{music.setStyle(v);describeMusic(v);});
  describeMusic(musicStyle());
  bind('#season',season,SEASON,SEASONS,v=>{applySeason();music.setTheme(v);if(v!=='default'){markSeason(v);buddySay(SEASON_LINES[v]);sound('unlock');}});
  const volume=document.querySelector('#musicvol');
  if(volume){const paint=()=>{volume.style.setProperty('--volume',volume.value+'%');volume.setAttribute('aria-valuetext',volume.value+'%');};volume.value=String(musicLevel());paint();volume.addEventListener('input',()=>{paint();write(MUSICVOL,volume.value);music.setLevel(musicLevel()/100);});}
  applySeason();initMusic();
}

const pickCheer=createCheerPicker();
export function cheer(kind,options){
  if(!cheersOn())return false;
  const chosen=pickCheer(kind,options);if(!chosen)return false;
  if(options?.preview){const status=document.querySelector('#cheer-preview-status');if(status)status.textContent=translate(chosen.text);}
  buddySay(options?.text||chosen.text,{ms:3000});animate(chosen.motion);sound(chosen.sound,{duckMusic:true});
  return true;
}
// Background music is off by default. Browsers only allow audio after a tap, so a saved "on" starts at the first touch.
function initMusic(){
  music.setTheme(season());music.setStyle(musicStyle());music.setLevel(musicLevel()/100);
  if(musicOn()){
    const go=()=>{if(musicOn())music.start();};
    addEventListener('pointerdown',go,{once:true});addEventListener('keydown',go,{once:true});
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)music.stop();else if(musicOn())music.start();});
}
const SEASON_LINES={christmas:'Merry! Festive mode is on.',earth:'Happy Earth Day! Small steps count.',wika:'Mabuhay ang wika! Festive mode is on.'};
export function applySeason(){const s=season();if(s==='default')delete document.documentElement.dataset.season;else document.documentElement.dataset.season=s;}

// ---------- Saved buddy progress ----------
const blank=()=>({taps:0,treats:0,treatDays:{},sorts:0,perfect:0,compost:0,compostPerfect:0,seasons:[],stickers:[]});
function load(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORE)||'null');if(!raw||typeof raw!=='object')return blank();
    const n=v=>Number.isInteger(v)&&v>=0&&v<1e6?v:0,out=blank();
    out.taps=n(raw.taps);out.treats=n(raw.treats);out.sorts=n(raw.sorts);out.perfect=n(raw.perfect);out.compost=n(raw.compost);out.compostPerfect=n(raw.compostPerfect);
    if(raw.treatDays&&typeof raw.treatDays==='object')for(const [k,v] of Object.entries(raw.treatDays).slice(-14))if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&Number.isInteger(v)&&v>=0&&v<32)out.treatDays[k]=v;
    if(Array.isArray(raw.seasons))out.seasons=raw.seasons.filter(s=>SEASONS.includes(s)&&s!=='default');
    if(Array.isArray(raw.stickers))out.stickers=raw.stickers.filter(k=>STICKERS.some(s=>s.key===k));
    return out;
  }catch{return blank();}
}
let state=null;
const get=()=>state||(state=load());
function save(){try{localStorage.setItem(STORE,JSON.stringify(get()));return true;}catch{return false;}}
export const stats=()=>({...get()});

export function recordTap(){const s=get();s.taps=Math.min(s.taps+1,999999);save();return s.taps;}
export function recordSort(score,total){const s=get();s.sorts=Math.min(s.sorts+1,999999);if(score===total)s.perfect=Math.min(s.perfect+1,999999);save();}
export function recordCompost(caught,good){const s=get();s.compost=Math.min(s.compost+1,999999);if(good>0&&caught===good)s.compostPerfect=Math.min(s.compostPerfect+1,999999);save();}
function markSeason(v){const s=get();if(!s.seasons.includes(v)){s.seasons.push(v);save();}}
// One treat per habit per day, so ticking and unticking cannot farm them.
export function giveTreat(index,day){
  const s=get(),bit=1<<index;if(!Number.isInteger(index)||index<0||index>4)return false;
  if((s.treatDays[day]||0)&bit)return false;
  s.treatDays[day]=(s.treatDays[day]||0)|bit;s.treats=Math.min(s.treats+1,999999);
  const keys=Object.keys(s.treatDays).sort();while(keys.length>14)delete s.treatDays[keys.shift()];
  save();return true;
}

// Finishing a game round earns one treat per game per day (bits 3 and 4 beside the three habits).
const GAME_BIT={sort:3,compost:4};
export const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export const giveGameTreat=(game,day=todayKey())=>game in GAME_BIT?giveTreat(GAME_BIT[game],day):false;

// ---------- Buddy garden ----------
// The garden grows from care you have already given: habit treats, sorting and compost rounds, and challenge days.
// Nine plots, three care points each (seed, sprout, bloom). Nothing wilts and nothing is lost.
export const PLOTS=[['🌻','Sunflower'],['🌷','Tulip'],['🌼','Daisy'],['🌸','Cherry blossom'],['🌹','Rose'],['🪻','Lavender'],['🌺','Hibiscus'],['🍓','Strawberry'],['🍅','Tomato']];
export const POINTS_PER_PLOT=3;
export const carePoints=(summary)=>{const s=get();return s.treats+s.sorts+s.compost+(summary?.challengeDays||0);};
export function gardenState(points){
  const total=Math.max(0,Math.floor(points)||0);
  const plots=PLOTS.map(([bloom,name],i)=>{const stage=Math.max(0,Math.min(POINTS_PER_PLOT,total-i*POINTS_PER_PLOT));return {bloom,name,stage};});
  const blooms=plots.filter(p=>p.stage===POINTS_PER_PLOT).length;
  return {plots,blooms,points:total,complete:blooms===PLOTS.length,toNext:blooms===PLOTS.length?0:POINTS_PER_PLOT-((total)%POINTS_PER_PLOT)};
}

// ---------- Stickers ----------
export const STICKERS=[
  {key:'first',name:'First step',hint:'Complete your first action.',color:'#b9f26b',icon:'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z'},
  {key:'habits',name:'Habit hero',hint:'Check off all three habits in one day.',color:'#ff9f8a',icon:'M5 13l4 4L19 7'},
  {key:'streak3',name:'Three-day streak',hint:'Be active three days in a row.',color:'#ffd36b',icon:'M12 2c1 4 6 6 6 11a6 6 0 0 1-12 0c0-2.4 1-3.8 2.5-5 .2 2 1 3 2.2 3.4C10 8.6 10.5 5.4 12 2z'},
  {key:'streak7',name:'Seven-day streak',hint:'Be active seven days in a row.',color:'#ffb347',icon:'M3 17l5-9 4 6 3-4 6 7z'},
  {key:'challenge3',name:'Challenge champ',hint:'Complete the daily challenge on three different days.',color:'#9fc9f5',icon:'M12 3l8 4v5c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V7z'},
  {key:'sort1',name:'Sorting star',hint:'Finish a sorting game round.',color:'#b6e3a0',icon:'M4 6h16M7 6l1 14h8l1-14M10 3h4'},
  {key:'sort5',name:'Sorting pro',hint:'Finish five sorting game rounds.',color:'#8fd3c1',icon:'M4 6h16M7 6l1 14h8l1-14M10 3h4M9 12h6'},
  {key:'perfect',name:'Perfect round',hint:'Sort every item right in one round.',color:'#f7b6d2',icon:'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z'},
  {key:'tap10',name:'Best friends',hint:'Tap your buddy ten times.',color:'#c9b6f7',icon:'M8 11V6a2 2 0 0 1 4 0v4m0-1a2 2 0 0 1 4 0v3a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-2-3a2 2 0 0 1 3-2l1 1'},
  {key:'treat10',name:'Snack time',hint:'Share ten treats with your buddy by checking off habits.',color:'#ffc78a',icon:'M12 8c-2-2-6-1-6 3 0 5 4 9 6 9s6-4 6-9c0-4-4-5-6-3zM12 8c0-2 1-4 3-5'},
  {key:'compost1',name:'Compost helper',hint:'Finish a Compost Catch round.',color:'#c8e6a0',icon:'M5 14c0-5 4-9 14-9 0 10-4 14-9 14-3 0-5-2-5-5zM9 15c2-3 4-5 7-7'},
  {key:'compostperfect',name:'Compost champ',hint:'Catch every compostable scrap in one round.',color:'#a9d99b',icon:'M12 3c4 3 6 6 6 10a6 6 0 0 1-12 0c0-4 2-7 6-10zM12 21v-8'},
  {key:'garden1',name:'Green thumb',hint:'Grow your first flower in the Buddy garden.',color:'#ffc2d4',icon:'M12 21v-9M12 12c-4 0-6-3-6-6 4 0 6 2 6 6zM12 12c4 0 6-3 6-6-4 0-6 2-6 6z'},
  {key:'garden9',name:'Garden party',hint:'Grow all nine flowers in the Buddy garden.',color:'#ffe08a',icon:'M12 3l2 5 5 .5-4 3.5 1.5 5L12 14.5 7.5 17 9 12 5 8.5 10 8z'},
  {key:'festive',name:'Festive friend',hint:'Try a seasonal theme in Settings.',color:'#ff8e8e',icon:'M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3'},
];
export const stickerName=key=>STICKERS.find(s=>s.key===key)?.name||'';
// Everything earned so far, from the week summary plus the buddy's own counters.
export function earnedKeys(summary){
  const s=get(),keys=new Set((summary?.badges||[]).filter(b=>b.earned).map(b=>b.key));
  if((summary?.challengeDays||0)>=3)keys.add('challenge3');
  if(s.sorts>=1)keys.add('sort1');if(s.sorts>=5)keys.add('sort5');if(s.perfect>=1)keys.add('perfect');
  if(s.compost>=1)keys.add('compost1');if(s.compostPerfect>=1)keys.add('compostperfect');
  const g=gardenState(carePoints(summary));if(g.blooms>=1)keys.add('garden1');if(g.complete)keys.add('garden9');
  if(s.taps>=10)keys.add('tap10');if(s.treats>=10)keys.add('treat10');if(s.seasons.length)keys.add('festive');
  return keys;
}
// Stickers are kept once earned. Returns the ones earned just now.
export function syncStickers(summary){
  const s=get(),keys=earnedKeys(summary),fresh=STICKERS.filter(t=>keys.has(t.key)&&!s.stickers.includes(t.key));
  if(fresh.length){s.stickers.push(...fresh.map(t=>t.key));save();}
  return fresh;
}
const stickerArt=t=>`<svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="22" fill="${t.color}"/><circle cx="24" cy="24" r="22" fill="none" stroke="#ffffffaa" stroke-width="3" stroke-dasharray="3 5"/><g transform="translate(12 12)" fill="none" stroke="#143026" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${t.icon}"/></g></svg>`;
export function stickerBook(){
  const have=new Set(get().stickers),count=STICKERS.filter(t=>have.has(t.key)).length;
  return `<section class="card sticker-book" aria-labelledby="sticker-heading"><h2 id="sticker-heading">Sticker book</h2><p class="note">${count} of ${STICKERS.length} stickers collected. Stickers stay yours once you earn them.</p><ul class="stickers">${STICKERS.map(t=>{const on=have.has(t.key);return `<li class="sticker${on?' earned':''}">${stickerArt(t)}<span class="sticker-name">${t.name}</span><span class="sticker-hint">${on?'Collected':t.hint}</span></li>`;}).join('')}</ul></section>`;
}

// ---------- Mood ----------
export function moodFor(summary,now=new Date()){
  const h=now.getHours();if(h>=22||h<5)return 'sleepy';
  const streak=summary?.streak||{count:0,todayDone:false};
  if(streak.todayDone&&streak.count>=3)return 'excited';
  if(streak.todayDone)return 'happy';
  return 'calm';
}
const MOOD_LINES={sleepy:'Zzz… tap me to wake me up.',excited:'Streak power! Tap me!',happy:'Great day so far. Tap me!',calm:'Hi! Tap me for a tip.'};
export const moodLine=mood=>MOOD_LINES[mood]||MOOD_LINES.calm;
const BUDDY_BOXES='#avatar-link,.buddy-strip-art,.buddy-stage-art,.mini-buddy';
let lastMood='calm';
export function applyMood(summary){
  const mood=summary?moodFor(summary):lastMood;lastMood=mood;
  document.querySelectorAll(BUDDY_BOXES).forEach(el=>{el.dataset.mood=mood;});
  const line=document.querySelector('.buddy-mood');if(line)line.textContent=translate(moodLine(mood));
  return mood;
}

// ---------- Helper buddy that sits inside activity cards ----------
export function miniBuddy(kind){
  return `<button type="button" class="mini-buddy secondary" data-buddy-tap data-hint="${kind}" aria-label="Ask your buddy for a hint"><span class="mini-buddy-art">${renderAvatar(currentConfig(),{size:40,decorative:true})}</span></button>`;
}
const HINTS={
  quiz:['Is it clean and dry? Then it may fit the pouch.','Wet, sharp or chemical? Keep it out and ask staff.','Read the tip after each answer. It is the best part!'],
  habits:['Tiny habits add up. Pick one you can do today.','A clean bottle is a great place to start.'],
  challenge:['A small challenge is enough. You choose what works.','Skipping is okay. I will be here tomorrow!'],
  guide:['Type a word to search. Try “juice box” or “baterya”.','Not sure? Ask school staff.'],
  sort:['Drag the item to a bin, or tap a bin.','Clean, dry and nonhazardous goes in the pouch.'],
  garden:['Every habit and game round helps your flowers grow.','Tap a flower to say hello!'],
};
const TIPS=[
  'Tip: Bring your own bottle and skip the single-use one.',
  'Tip: Keep wrappers clean and dry if you carry them out.',
  'Tip: Wet or sharp items? Ask school staff.',
  'Tip: Say no to extra straws and utensils.',
  'Tip: Reuse clean paper before it goes anywhere.',
];
const FACTS=[
  'Did you know? Using a bottle again means one less thing to throw away.',
  'Did you know? Paper stays useful longer when it is kept dry.',
  'Did you know? Small habits repeated every day add up.',
  'Did you know? Planning your snack can mean less packaging.',
];
let tapStep=0;
// A tap cycles through a giggle, a spin, a tip and a fun fact.
export function tapBuddy(el){
  const hint=el?.dataset?.hint;
  const taps=recordTap();
  if(hint&&HINTS[hint]){const pool=HINTS[hint];buddySay(pool[taps%pool.length]);animate('hop');sound('boop');return;}
  const step=tapStep++%4;
  if(taps===10){buddySay('We are best friends now!');animate('spin');sparkle(el);sound('tada');return;}
  if(step===0){buddySay('Hehe! That tickles.');animate('hop');sound('boop');}
  else if(step===1){buddySay('Wheee!');animate('spin');sound('pop');}
  else if(step===2){buddySay(TIPS[taps%TIPS.length]);animate('hop');sound('boop');}
  else{buddySay(FACTS[taps%FACTS.length]);animate('hop');sound('chime');}
  sparkle(el);
}

// ---------- Speech bubble ----------
let bubble=null,hideTimer=0,fadeTimer=0;
function ensureBubble(){
  if(bubble?.isConnected)return bubble;
  bubble=document.querySelector('#buddy-say');if(bubble)return bubble;
  bubble=document.createElement('div');bubble.id='buddy-say';bubble.className='buddy-say';bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');bubble.hidden=true;
  bubble.innerHTML='<span class="buddy-say-art" aria-hidden="true"></span><span class="buddy-say-text"></span>';
  document.body.append(bubble);return bubble;
}
export function hideBubble(){clearTimeout(hideTimer);clearTimeout(fadeTimer);if(bubble){bubble.hidden=true;bubble.classList.remove("is-leaving");}}
export function buddySay(text,{force=false,ms=4200,delay=0}={}){
  if(!text||(!force&&!cheersOn()))return;
  if(delay){setTimeout(()=>buddySay(text,{force,ms}),delay);return;}
  if(voiceOn() && voiceReady && !document.hidden) {
    try { voice.play(translate(text),getLanguage()); } catch { /* Optional audio never interrupts guidance. */ }
  }
  const box=ensureBubble();
  box.querySelector('.buddy-say-text').textContent=translate(text);
  clearTimeout(fadeTimer);box.classList.remove('is-leaving');
  box.hidden=false;box.classList.remove('show');void box.offsetWidth;box.classList.add('show');
  clearTimeout(hideTimer);hideTimer=setTimeout(()=>{box.classList.add("is-leaving");fadeTimer=setTimeout(()=>{box.hidden=true;box.classList.remove("is-leaving");},180);},ms);
}
// Small animations on every buddy on the page.
export function animate(kind){
  if(!cheersOn()||reduced())return;
  document.querySelectorAll('.hipos-avatar').forEach(svg=>{
    if(svg.closest('.buddy-chip,.buddy-say,.sticker'))return;
    svg.classList.remove('do-hop','do-spin','do-nod');void svg.getBoundingClientRect();svg.classList.add(kind==='spin'?'do-spin':kind==='nod'?'do-nod':'do-hop');
    setTimeout(()=>svg.classList.remove('do-hop','do-spin','do-nod'),900);
  });
}
// A few sparkles from an element. Skipped for reduced motion.
export function sparkle(el,count=8){
  if(!cheersOn()||reduced()||!el?.getBoundingClientRect||!document.body.animate)return;
  const r=el.getBoundingClientRect(),colors=['#b9f26b','#ffd36b','#ff8e72','#9fc9f5','#f7b6d2'],layer=document.createElement('div');
  layer.className='sparkle-layer';layer.setAttribute('aria-hidden','true');
  for(let i=0;i<count;i++){
    const s=document.createElement('i');s.className='spark';s.style.left=(r.left+r.width/2)+'px';s.style.top=(r.top+r.height/2)+'px';s.style.setProperty('--c',colors[i%colors.length]);layer.append(s);
    const a=(Math.PI*2*i)/count+Math.random()*.5,d=28+Math.random()*26;
    s.animate([{transform:'translate(-50%,-50%) scale(.4)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(a)*d}px),calc(-50% + ${Math.sin(a)*d-10}px)) scale(1)`,opacity:0}],{duration:650+Math.random()*250,easing:'cubic-bezier(.2,.8,.3,1)',fill:'forwards'});
  }
  document.body.append(layer);setTimeout(()=>layer.remove(),1100);
}
export function buzz(ms=12){if(cheersOn())try{navigator.vibrate?.(ms);}catch{/* not supported */}}

// ---------- Sounds (off by default) ----------
// Names: tick pop boop chime coin whoosh undo oops star tada unlock win (synthesized in audio.js).
export function sound(name,{duckMusic=false}={}){
  if(!soundOn())return;
  try{playSfx(name);if(duckMusic)music.duck();}catch{/* sound is optional */}
}
