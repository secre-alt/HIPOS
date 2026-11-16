// "Compost Catch": food scraps fall from the top. Move the buddy's basket to catch only the
// compostable scraps; anything else (plastic, wrappers, juice boxes) stays out of the basket.
// Runs entirely on this device. Nothing is scored against a student or sent anywhere.
import {escapeHTML as e} from './core.js';
import {gameArt} from './game-art.js';
import {cheer,buddySay,sparkle,animate,buzz,sound,recordCompost,giveGameTreat,carePoints,gardenState} from './buddy-fx.js';
import {gardenGrowth} from './garden.js';

const ITEMS=[
  {name:'Banana peel',art:'peel',good:true},
  {name:'Apple core',art:'apple',good:true},
  {name:'Eggshell',art:'egg',good:true},
  {name:'Leftover rice',art:'rice',good:true},
  {name:'Vegetable scraps',art:'carrot',good:true},
  {name:'Juice box',art:'carton',good:false},
  {name:'Plastic spoon',art:'spoon',good:false},
  {name:'Plastic wrapper',art:'wrapper',good:false},
];
const TOTAL=18,SPAWN_MS=1100,FALL=21,BASKET_STEP=8,CATCH_Y=78,CATCH_RANGE=12;
let g=null,raf=0,last=0,gardenSummary={};

// Build a fair sequence: about two thirds compostable, never the same item twice in a row.
export function makeSequence(random=Math.random){
  const seq=[];let prev=null;
  for(let i=0;i<TOTAL;i++){
    const pool=ITEMS.filter(x=>x!==prev&&(random()<0.66?x.good:!x.good));
    const fallback=ITEMS.filter(x=>x!==prev);
    const list=pool.length?pool:fallback;
    const pick=list[Math.floor(random()*list.length)];seq.push(pick);prev=pick;
  }
  return seq;
}

export function compostGame(summary={}){
  gardenSummary=summary;
  return `<section class="card compost-game" id="compost-game" aria-labelledby="compost-heading">
  <h2 id="compost-heading">Compost Catch</h2>
  <div class="arcade-toolbar"><span class="arcade-patch">Catch · Keep · Grow</span></div>
  <p class="note">Catch only the scraps that can be composted. Use the arrow keys, the buttons, or drag across the field.</p>
  <div class="compost-hud" id="compost-hud" hidden><div class="compost-hud-row"><p class="compost-score" id="compost-score" aria-live="off"></p><button type="button" class="secondary" data-compost-pause hidden>Pause</button></div><progress id="compost-progress" max="18" value="0" aria-label="Round progress"></progress></div>
  <div class="compost-field" id="compost-field" tabindex="0" role="application" aria-label="Compost Catch field. Use left and right arrow keys to move the basket.">
    <div class="compost-start" id="compost-start"><div class="arcade-ready"><h3>Good scraps. Great catches.</h3><div class="compost-legend"><div>${gameArt('carrot')}<strong>Catch food scraps</strong></div><div>${gameArt('wrapper')}<strong>Let plastic pass</strong></div></div><button type="button" data-compost-start>Start</button></div></div>
    <div class="compost-basket" id="compost-basket" aria-hidden="true">${gameArt('basket')}</div>
  </div>
  <div class="compost-controls" id="compost-controls" hidden>
    <button type="button" class="secondary" data-compost-left aria-label="Move basket left">◀ Left</button>
    <button type="button" class="secondary" data-compost-right aria-label="Move basket right">Right ▶</button>
  </div>
  <p id="compost-status" class="feedback" role="status" aria-live="polite"></p>
</section>`;
}

function setStatus(text,kind='',item=''){const s=document.querySelector('#compost-status');if(s){s.replaceChildren();if(item){const name=document.createElement('strong');name.textContent=item;s.append(name,document.createTextNode(' · '));}const message=document.createElement('span');message.textContent=text;s.append(message);s.className='feedback '+kind;}}
function setScore(){const s=document.querySelector('#compost-score');if(s&&g)s.textContent=`Caught ${g.caught} of ${g.good} compostable scraps`;const progress=document.querySelector('#compost-progress');if(progress&&g)progress.value=g.resolved;}
function basketEl(){return document.querySelector('#compost-basket');}
function moveBasket(x){if(!g||g.paused)return;g.basket=Math.max(CATCH_RANGE,Math.min(100-CATCH_RANGE,x));const b=basketEl();if(b)b.style.left=g.basket+'%';}

function spawn(){
  const item=g.seq[g.spawned++];
  const el=document.createElement('div');
  el.className='compost-item';el.setAttribute('aria-hidden','true');
  el.innerHTML=gameArt(item.art);
  el.setAttribute('title',item.name);
  el.style.left=(8+Math.random()*84)+'%';el.style.top='-12%';
  document.querySelector('#compost-field')?.appendChild(el);
  g.falling.push({item,el,x:parseFloat(el.style.left),y:-12});
}

function finish(){
  document.querySelector('#compost-game')?.classList.remove('is-playing');
  const playfield=document.querySelector('#compost-field');playfield?.style.removeProperty('height');
  document.querySelector('[data-compost-pause]')?.setAttribute('hidden','');
  cancelAnimationFrame(raf);raf=0;
  const field=document.querySelector('#compost-field'),controls=document.querySelector('#compost-controls');
  const perfect=g.caught===g.good;
  const line=perfect?'Perfect! Every compostable scrap caught.':g.caught>=g.good-3?'Great catching!':'Good practice. Try another round.';
  const before=gardenState(carePoints(gardenSummary));
  recordCompost(g.caught,g.good);giveGameTreat('compost');
  const growth=gardenGrowth(before,gardenState(carePoints(gardenSummary)));
  if(field)field.innerHTML=`<div class="compost-done"><h3>You caught ${g.caught} of ${g.good} compostable scraps.</h3><p>${e(line)}</p>${growth}<p class="compost-takeaway">Catch food scraps. Let plastic pass.</p><div class="actions"><button type="button" data-compost-start>Play again</button><a class="button-link secondary" href="#garden">Visit your garden</a></div></div>`;
  controls&&(controls.hidden=true);
  document.dispatchEvent(new CustomEvent('hipos-game-done'));
  cheer('complete');
  setStatus('');
  document.querySelector('#compost-field .compost-done button')?.focus({preventScroll:true});
  g=null;
}

function frame(now){
  if(!g||!document.querySelector('#compost-field')){raf=0;g=null;return;}
  if(g.paused){raf=0;return;}
  const dt=Math.min(0.05,(now-last)/1000);last=now;
  g.clock+=dt*1000;
  if(g.spawned<TOTAL&&g.clock>=(g.spawned)*SPAWN_MS)spawn();
  const keep=[];
  for(const f of g.falling){
    f.y+=FALL*dt;f.el.style.top=f.y+'%';
    const onBasket=f.y>=CATCH_Y&&f.y<=CATCH_Y+8&&Math.abs(f.x-g.basket)<CATCH_RANGE;
    if(onBasket&&!f.done){
      f.done=true;f.el.remove();g.resolved++;
      if(f.item.good){g.caught++;setStatus('Into the compost!','success-feedback',f.item.name);sparkle(basketEl(),5);buzz(8);if(!cheer('catch'))sound('coin');}
      else{setStatus('Keep plastic out of compost. Use a dry-waste pouch only when clean and dry.','',f.item.name);if(!cheer('miss'))sound('oops');}
      setScore();
      continue;
    }
    if(f.y>100){
      f.el.remove();g.resolved++;setScore();
      if(f.item.good&&!f.done)setStatus('This scrap can be composted. Try catching it next time.','',f.item.name);
      continue;
    }
    keep.push(f);
  }
  g.falling=keep;
  if(g.spawned>=TOTAL&&g.falling.length===0){finish();return;}
  raf=requestAnimationFrame(frame);
}

let cleanupCompost=()=>{};
export function initCompost(){
  cleanupCompost();
  const field=document.querySelector('#compost-field');if(!field)return;
  const fit=()=>{
    if(!g)return;
    const hud=document.querySelector('#compost-hud'),controls=document.querySelector('#compost-controls');
    const top=(document.querySelector('aside')?.getBoundingClientRect().height||0)+8;
    const nav=document.querySelector('.mobile-bottom-nav')?.getBoundingClientRect();
    const bottom=(nav?.height?nav.top:innerHeight)-8;
    const sideControls=matchMedia('(max-height:600px) and (min-width:500px)').matches;
    const extra=sideControls?field.getBoundingClientRect().top-hud.getBoundingClientRect().top:controls.getBoundingClientRect().bottom-hud.getBoundingClientRect().top-field.getBoundingClientRect().height;
    field.style.height=Math.max(96,Math.min(400,innerHeight*.52,bottom-top-extra))+'px';
    hud.scrollIntoView({block:'start',behavior:'instant'});
  };
  let fitFrame=0;
  const fitAfterText=()=>{fit();cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(fit);};
  const togglePause=(force=false)=>{
    if(!g)return;
    g.paused=force||!g.paused;
    document.querySelector('[data-compost-pause]').textContent=g.paused?'Resume':'Pause';
    field.classList.toggle('is-paused',g.paused);
    field.querySelector('.compost-paused')?.remove();
    if(g.paused){
      cancelAnimationFrame(raf);raf=0;
      const overlay=document.createElement('div');overlay.className='compost-paused';
      overlay.innerHTML='<button type="button" data-compost-pause>Resume</button>';field.appendChild(overlay);
      if(!document.hidden)overlay.querySelector('button').focus();
    }else{last=performance.now();raf=requestAnimationFrame(frame);field.focus({preventScroll:true});}
  };
  const visibility=()=>{if(document.hidden)togglePause(true);};
  const leave=()=>{cancelAnimationFrame(raf);cancelAnimationFrame(fitFrame);raf=0;g=null;document.removeEventListener('visibilitychange',visibility);window.removeEventListener('hashchange',leave);window.removeEventListener('resize',fitAfterText);};
  document.addEventListener('visibilitychange',visibility);window.addEventListener('hashchange',leave);cleanupCompost=leave;
  window.addEventListener('resize',fitAfterText);
  const start=()=>{
    cancelAnimationFrame(raf);
    const seq=makeSequence();
    g={paused:false,seq,good:seq.filter(x=>x.good).length,spawned:0,resolved:0,falling:[],caught:0,basket:50,clock:0};
    field.classList.remove('is-paused');
    field.innerHTML=`<div class="compost-basket" id="compost-basket" aria-hidden="true">${gameArt('basket')}</div>`;
    const pause=document.querySelector('[data-compost-pause]');pause.hidden=false;pause.textContent='Pause';
    moveBasket(50);setScore();setStatus('');
    document.querySelector('#compost-controls').hidden=false;
    document.querySelector('#compost-hud').hidden=false;
    document.querySelector('#compost-game').classList.add('is-playing');
    fitAfterText();
    field.focus({preventScroll:true});
    last=performance.now();raf=requestAnimationFrame(frame);
    buddySay('Catch the compost!',{ms:2500});
  };
  document.querySelector('#compost-game')?.addEventListener('click',event=>{
    if(event.target.closest('[data-compost-start]'))start();
    else if(event.target.closest('[data-compost-pause]'))togglePause();
    else if(event.target.closest('[data-compost-left]'))moveBasket((g?.basket??50)-BASKET_STEP);
    else if(event.target.closest('[data-compost-right]'))moveBasket((g?.basket??50)+BASKET_STEP);
  });
  field.addEventListener('keydown',event=>{
    if(!g)return;
    if(event.key==='ArrowLeft'){event.preventDefault();moveBasket(g.basket-BASKET_STEP);}
    if(event.key==='ArrowRight'){event.preventDefault();moveBasket(g.basket+BASKET_STEP);}
  });
  field.addEventListener('pointermove',event=>{
    if(!g||event.buttons===0&&event.pointerType==='mouse')return;
    const r=field.getBoundingClientRect();moveBasket(((event.clientX-r.left)/r.width)*100);
  });
  field.addEventListener('pointerdown',event=>{
    if(!g)return;const r=field.getBoundingClientRect();moveBasket(((event.clientX-r.left)/r.width)*100);
  });
}
