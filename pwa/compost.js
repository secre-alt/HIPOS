// "Compost Catch": food scraps fall from the top. Move the buddy's basket to catch only the
// compostable scraps; anything else (plastic, wrappers, juice boxes) stays out of the basket.
// Runs entirely on this device. Nothing is scored against a student or sent anywhere.
import {escapeHTML as e} from './core.js';
import {gameArt} from './game-art.js';
import {cheer,buddySay,sparkle,animate,buzz,sound,recordCompost,giveGameTreat} from './buddy-fx.js';

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
let g=null,raf=0,last=0;

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

export function compostGame(){
  return `<section class="card compost-game" id="compost-game" aria-labelledby="compost-heading">
  <h2 id="compost-heading">Compost Catch</h2>
  <div class="arcade-toolbar"><span class="arcade-patch">Catch · Keep · Grow</span><button type="button" class="secondary" data-compost-pause hidden>Pause</button></div>
  <p class="note">Catch only the scraps that can be composted. Use the arrow keys, the buttons, or drag across the field.</p>
  <div class="compost-field" id="compost-field" tabindex="0" role="application" aria-label="Compost Catch field. Use left and right arrow keys to move the basket.">
    <div class="compost-start" id="compost-start"><div class="arcade-ready">${gameArt('carrot')}<h3>Good scraps. Great catches.</h3><p>Catch food scraps. Let plastic pass.</p><button type="button" data-compost-start>Start</button></div></div>
    <div class="compost-basket" id="compost-basket" aria-hidden="true">${gameArt('basket')}</div>
  </div>
  <div class="compost-controls" id="compost-controls" hidden>
    <button type="button" class="secondary" data-compost-left aria-label="Move basket left">◀ Left</button>
    <button type="button" class="secondary" data-compost-right aria-label="Move basket right">Right ▶</button>
  </div>
  <p id="compost-status" class="feedback" role="status" aria-live="polite"></p>
  <p class="compost-score" id="compost-score" aria-live="off"></p>
</section>`;
}

function setStatus(text,kind=''){const s=document.querySelector('#compost-status');if(s){s.textContent=text;s.className='feedback '+kind;}}
function setScore(){const s=document.querySelector('#compost-score');if(s&&g)s.textContent=`Caught ${g.caught} of ${g.good} compostable scraps`;}
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
  document.querySelector('[data-compost-pause]')?.setAttribute('hidden','');
  cancelAnimationFrame(raf);raf=0;
  const field=document.querySelector('#compost-field'),controls=document.querySelector('#compost-controls');
  const perfect=g.caught===g.good;
  const line=perfect?'Perfect! Every compostable scrap caught.':g.caught>=g.good-3?'Great catching!':'Good practice. Watch the labels as they fall.';
  if(field)field.innerHTML=`<div class="compost-done">${gameArt('flower')}<h3>You caught ${g.caught} of ${g.good} compostable scraps.</h3><p>${e(line)}</p><div class="actions"><button type="button" data-compost-start>Play again</button><a class="button-link secondary" href="#garden">Visit your garden</a></div></div>`;
  controls&&(controls.hidden=true);
  recordCompost(g.caught,g.good);giveGameTreat('compost');
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
      f.done=true;f.el.remove();
      if(f.item.good){g.caught++;setScore();setStatus('Into the compost!','success-feedback');sparkle(basketEl(),5);sound('coin');buzz(8);animate('hop');}
      else{setStatus('Not compost. That goes in the dry-waste pouch.');sound('oops');}
      continue;
    }
    if(f.y>100){
      f.el.remove();
      if(f.item.good&&!f.done)setStatus('Oops, that one could have been composted.');
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
  const leave=()=>{cancelAnimationFrame(raf);raf=0;g=null;document.removeEventListener('visibilitychange',visibility);window.removeEventListener('hashchange',leave);};
  document.addEventListener('visibilitychange',visibility);window.addEventListener('hashchange',leave);cleanupCompost=leave;
  const start=()=>{
    cancelAnimationFrame(raf);
    const seq=makeSequence();
    g={paused:false,seq,good:seq.filter(x=>x.good).length,spawned:0,falling:[],caught:0,basket:50,clock:0};
    field.classList.remove('is-paused');
    field.innerHTML=`<div class="compost-basket" id="compost-basket" aria-hidden="true">${gameArt('basket')}</div>`;
    const pause=document.querySelector('[data-compost-pause]');pause.hidden=false;pause.textContent='Pause';
    moveBasket(50);setScore();setStatus('');
    document.querySelector('#compost-controls').hidden=false;
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
