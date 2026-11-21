// "Compost Catch": food scraps fall from the top. Move the buddy's basket to catch only the
// compostable scraps; anything else (plastic, wrappers, juice boxes) stays out of the basket.
// Runs entirely on this device. Nothing is scored against a student or sent anywhere.
import {escapeHTML as e} from './core.js';
import {gameArt} from './game-art.js';
import {cheer,buddySay,sparkle,animate,buzz,sound,recordCompost,giveGameTreat,carePoints,gardenState} from './buddy-fx.js';
import {gardenGrowth} from './garden.js';

const compostArt=kind=>gameArt(kind);
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
const TOTAL=18,BASKET_STEP=8,CATCH_Y=78,CATCH_RANGE=12,MOVE_SPEED=70;
const PACES={regular:{spawn:1100,fall:21},practice:{spawn:1500,fall:14}};
const PACE_KEY='hipos.compost.pace';
const savedPace=()=>{try{const v=localStorage.getItem(PACE_KEY);return v==='practice'?'practice':'regular';}catch{return 'regular';}};
let g=null,raf=0,last=0,gardenSummary={},pace=savedPace(),feedbackTimer=0;

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

const controlHint=()=>matchMedia('(pointer:coarse)').matches?'Drag the basket, or hold the movement buttons.':'Hold the arrow keys or drag the basket. Press Space to pause.';
const startPanel=()=>`<div class="compost-start" id="compost-start"><div class="arcade-ready"><div class="compost-ready-buddy" aria-hidden="true">${compostArt('basket')}</div><h3>Help your buddy catch!</h3><div class="compost-legend"><div>${compostArt('carrot')}<strong>Catch food scraps</strong></div><div>${compostArt('wrapper')}<strong>Let plastic pass</strong></div></div><p class="compost-control-hint">${controlHint()}</p><button type="button" data-compost-start>Start</button></div></div>`;
export function compostGame(summary={}){
  gardenSummary=summary;
  return `<section class="card compost-game" id="compost-game" aria-labelledby="compost-heading">
  <h2 id="compost-heading">Compost Catch</h2>
  <div class="arcade-toolbar"><span class="arcade-patch">Catch · Keep · Grow</span><label class="compost-pace" for="compost-pace"><span>Round pace</span><select id="compost-pace"><option value="regular" ${pace==='regular'?'selected':''}>Regular</option><option value="practice" ${pace==='practice'?'selected':''}>Practice (slower)</option></select></label></div>
  <p class="note" id="compost-instructions">Catch only food scraps. Hold the arrow keys or movement buttons, or drag the basket. Press Space or Escape to pause.</p>
  <div class="compost-hud" id="compost-hud" hidden><div class="compost-hud-row"><p class="compost-score" id="compost-score" aria-live="off"></p><button type="button" class="secondary" data-compost-pause hidden>Pause</button></div><div class="compost-progress-label"><span>Items completed</span><span id="compost-count" data-no-translate>0/18</span></div><progress id="compost-progress" max="18" value="0" aria-label="Round progress"></progress></div>
  <div class="compost-field" id="compost-field" tabindex="0" role="application" aria-describedby="compost-instructions" aria-label="Compost Catch field. Use left and right arrow keys to move the basket.">
    ${startPanel()}
    <div class="compost-basket" id="compost-basket" aria-hidden="true">${compostArt('basket')}</div>
  </div>
  <div class="compost-controls" id="compost-controls" hidden>
    <button type="button" class="secondary" data-compost-left aria-label="Move basket left">◀ Left</button>
    <button type="button" class="secondary" data-compost-right aria-label="Move basket right">Right ▶</button>
  </div>
  <p id="compost-status" class="feedback" role="status" aria-live="polite"></p>
</section>`;
}

function setStatus(text,kind='',item=''){const s=document.querySelector('#compost-status');if(s){s.replaceChildren();if(item){const name=document.createElement('strong');name.textContent=item;s.append(name,document.createTextNode(' · '));}const message=document.createElement('span');message.textContent=text;s.append(message);s.className='feedback '+kind;}}
function setScore(){const s=document.querySelector('#compost-score');if(s&&g)s.textContent=`Caught ${g.caught} of ${g.good} compostable scraps`;const progress=document.querySelector('#compost-progress');if(progress&&g)progress.value=g.resolved;const count=document.querySelector('#compost-count');if(count&&g)count.textContent=g.resolved+'/'+TOTAL;}
function basketEl(){return document.querySelector('#compost-basket');}
function moveBasket(x){if(!g||g.paused)return;g.basket=Math.max(CATCH_RANGE,Math.min(100-CATCH_RANGE,x));const b=basketEl();if(b)b.style.left=g.basket+'%';}
function catchFeedback(good){
  clearTimeout(feedbackTimer);
  const basket=basketEl();if(!basket)return;
  basket.classList.remove('caught-food','caught-plastic');
  basket.classList.add(good?'caught-food':'caught-plastic');
  feedbackTimer=setTimeout(()=>basket.classList.remove('caught-food','caught-plastic'),350);
}

function spawn(){
  const item=g.seq[g.spawned++];
  const el=document.createElement('div');
  el.className='compost-item';el.setAttribute('aria-hidden','true');
  el.innerHTML=compostArt(item.art);
  el.setAttribute('title',item.name);
  el.style.left=(8+Math.random()*84)+'%';el.style.top='-12%';
  document.querySelector('#compost-field')?.appendChild(el);
  g.falling.push({item,el,x:parseFloat(el.style.left),y:-12});
}

function finish(){
  document.querySelector('#compost-pace').disabled=false;
  document.querySelector('#compost-game')?.classList.remove('is-playing');
  const playfield=document.querySelector('#compost-field');playfield?.style.removeProperty('height');
  document.querySelector('[data-compost-pause]')?.setAttribute('hidden','');
  cancelAnimationFrame(raf);raf=0;
  const field=document.querySelector('#compost-field'),controls=document.querySelector('#compost-controls');
  const perfect=g.caught===g.good&&g.plasticCaught===0;
  const line=perfect?'Great work! Food scraps in, plastic out.':g.caught>0&&g.caught>=g.good-3?'Great catching!':'Good practice. Try another round.';
  const tip=g.plasticCaught>0?'Watch for wrappers and spoons. Let them fall past the basket.':g.caught<g.good?'Try practice pace for more time to reach each food scrap.':'You kept food scraps and plastic apart. Keep it up!';
  const plasticResult=TOTAL>g.good?`<p class="compost-plastic-result"><span>Plastic kept out</span><strong data-no-translate>${g.plasticAvoided}/${TOTAL-g.good}</strong></p>`:'';
  const before=gardenState(carePoints(gardenSummary));
  recordCompost(g.caught,g.good,g.plasticCaught);giveGameTreat('compost');
  const growth=gardenGrowth(before,gardenState(carePoints(gardenSummary)));
  if(field)field.innerHTML=startPanel()+`<div class="compost-basket" id="compost-basket" aria-hidden="true">${compostArt('basket')}</div>`;
  const result=document.createElement('dialog');result.className='compost-result';result.setAttribute('aria-labelledby','compost-result-title');
  result.innerHTML=`<div class="compost-done"><h3 id="compost-result-title">You caught ${g.caught} of ${g.good} compostable scraps.</h3><p>${e(line)}</p>${plasticResult}<p class="compost-takeaway">${g.pace==='practice'?'Practice pace':'Regular pace'}</p>${growth}<p class="compost-result-tip">${e(tip)}</p><div class="actions"><button type="button" data-compost-start>Play again</button><a class="button-link secondary" href="#garden">Proceed to Buddy garden</a></div></div><button type="button" class="secondary compost-result-close" aria-label="Close">×</button>`;
  document.querySelector('#compost-game')?.append(result);
  result.querySelector('.compost-result-close').addEventListener('click',()=>result.close());
  result.addEventListener('close',()=>{result.remove();document.querySelector('[data-compost-start]')?.focus({preventScroll:true});});
  if(typeof result.showModal==='function')result.showModal();else result.setAttribute('open','');
  controls&&(controls.hidden=true);
  document.dispatchEvent(new CustomEvent('hipos-game-done'));
  cheer('complete');
  setStatus('');
  result.querySelector('[data-compost-start]')?.focus({preventScroll:true});
  g=null;
}

function frame(now){
  if(!g||!document.querySelector('#compost-field')){raf=0;g=null;return;}
  if(g.paused){raf=0;return;}
  const dt=Math.min(0.05,(now-last)/1000);last=now;
  if(g.direction)moveBasket(g.basket+g.direction*MOVE_SPEED*dt);
  g.clock+=dt*1000;
  if(g.spawned<TOTAL&&g.clock>=(g.spawned)*g.spawn)spawn();
  const keep=[];
  for(const f of g.falling){
    f.y+=g.fall*dt;f.el.style.top=f.y+'%';
    const onBasket=f.y>=CATCH_Y&&f.y<=CATCH_Y+8&&Math.abs(f.x-g.basket)<CATCH_RANGE;
    if(onBasket&&!f.done){
      f.done=true;f.el.remove();g.resolved++;
      catchFeedback(f.item.good);
      if(f.item.good){g.caught++;setStatus('Into the compost!','success-feedback',f.item.name);sparkle(basketEl(),5);buzz(8);if(!cheer('catch'))sound('coin');}
      else{g.plasticCaught++;setStatus('Keep plastic out of compost. Use a dry-waste pouch only when clean and dry.','',f.item.name);if(!cheer('miss'))sound('oops');}
      setScore();
      continue;
    }
    if(f.y>100){
      f.el.remove();g.resolved++;if(!f.item.good)g.plasticAvoided++;setScore();
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
export const compostActive=()=>Boolean(g)&&Boolean(document.querySelector('#compost-field'));
export function initCompost(){
  cleanupCompost();
  const field=document.querySelector('#compost-field');if(!field)return;
  const root=document.querySelector('#compost-game'),keys=new Set();
  let hold=null,drag=null,resumeTimer=0;
  const direction=()=>{if(g)g.direction=hold?hold.direction:Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));};
  const clearInput=()=>{
    keys.clear();
    const previousHold=hold,previousDrag=drag;hold=null;drag=null;direction();
    if(previousHold?.button.hasPointerCapture?.(previousHold.id))previousHold.button.releasePointerCapture(previousHold.id);
    if(previousDrag!==null&&field.hasPointerCapture?.(previousDrag))field.releasePointerCapture(previousDrag);
  };
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
    clearInput();
    clearTimeout(resumeTimer);
    const resume=!force&&g.paused&&!g.resuming;
    g.resuming=false;g.paused=true;
    document.querySelector('[data-compost-pause]').textContent=resume?'Pause':'Resume';
    field.classList.toggle('is-paused',g.paused);
    field.querySelector('.compost-paused')?.remove();
    if(!resume){
      cancelAnimationFrame(raf);raf=0;
      const overlay=document.createElement('div');overlay.className='compost-paused';
      overlay.innerHTML='<div class="compost-pause-panel">'+compostArt('basket')+'<strong>Paused</strong><p>Take your time. Your round is waiting.</p><button type="button" data-compost-pause>Resume</button></div>';field.appendChild(overlay);
      if(!document.hidden)overlay.querySelector('button').focus();
    }else{
      g.resuming=true;
      const overlay=document.createElement('div');overlay.className='compost-paused';
      overlay.innerHTML='<div class="compost-pause-panel"><strong role="status" aria-live="polite"><span>Get ready</span> <span data-no-translate>3</span></strong><button type="button" data-compost-pause>Pause</button></div>';
      field.appendChild(overlay);overlay.querySelector('button').focus({preventScroll:true});
      const deadline=performance.now()+3000;
      const tick=()=>{
        if(!g?.resuming)return;
        const remaining=Math.ceil((deadline-performance.now())/1000);
        if(remaining>0){overlay.querySelector('[data-no-translate]').textContent=remaining;resumeTimer=setTimeout(tick,100);return;}
        g.resuming=false;g.paused=false;overlay.remove();field.classList.remove('is-paused');
        document.querySelector('#compost-hud [data-compost-pause]').textContent='Pause';
        last=performance.now();raf=requestAnimationFrame(frame);field.focus({preventScroll:true});
      };
      resumeTimer=setTimeout(tick,100);
    }
  };
  const visibility=()=>{if(document.hidden)togglePause(true);};
  const release=event=>{if(hold?.id===event.pointerId){hold=null;direction();}if(drag===event.pointerId)drag=null;};
  const keyup=event=>{keys.delete(event.key);direction();};
  const leave=()=>{clearTimeout(resumeTimer);clearInput();clearTimeout(feedbackTimer);cancelAnimationFrame(raf);cancelAnimationFrame(fitFrame);raf=0;g=null;document.removeEventListener('visibilitychange',visibility);window.removeEventListener('hashchange',leave);window.removeEventListener('resize',fitAfterText);window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',clearInput);};
  document.addEventListener('visibilitychange',visibility);window.addEventListener('hashchange',leave);cleanupCompost=leave;
  window.addEventListener('resize',fitAfterText);
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
  window.addEventListener('keyup',keyup);window.addEventListener('blur',clearInput);
  const start=()=>{
    document.querySelector('.compost-result')?.remove();
    clearTimeout(resumeTimer);clearInput();clearTimeout(feedbackTimer);
    cancelAnimationFrame(raf);
    const seq=makeSequence();
    const select=document.querySelector('#compost-pace');pace=Object.hasOwn(PACES,select.value)?select.value:'regular';select.disabled=true;try{localStorage.setItem(PACE_KEY,pace);}catch{/* the pace simply resets next time */}
    g={paused:false,direction:0,pace,...PACES[pace],seq,good:seq.filter(x=>x.good).length,spawned:0,resolved:0,falling:[],caught:0,plasticCaught:0,plasticAvoided:0,basket:50,clock:0};
    field.classList.remove('is-paused');
    field.innerHTML=`<div class="compost-basket" id="compost-basket" aria-hidden="true">${compostArt('basket')}</div>`;
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
  root.addEventListener('click',event=>{
    if(event.target.closest('[data-compost-start]'))start();
    else if(event.target.closest('[data-compost-pause]'))togglePause();
    else if(event.detail===0&&event.target.closest('[data-compost-left]'))moveBasket((g?.basket??50)-BASKET_STEP);
    else if(event.detail===0&&event.target.closest('[data-compost-right]'))moveBasket((g?.basket??50)+BASKET_STEP);
  });
  root.addEventListener('pointerdown',event=>{
    const button=event.target.closest('[data-compost-left],[data-compost-right]');
    if(!button||!g||g.paused||hold||event.button>0||event.isPrimary===false)return;
    hold={id:event.pointerId,button,direction:button.hasAttribute('data-compost-left')?-1:1};
    try{button.setPointerCapture?.(event.pointerId);}catch{/* Capture may be unavailable for synthetic or cancelled pointers. */}
    moveBasket(g.basket+hold.direction*BASKET_STEP);direction();
  });
  root.addEventListener('lostpointercapture',release);
  root.addEventListener('keydown',event=>{
    if(g&&!event.repeat&&(event.key==='Escape'||(event.code==='Space'&&event.target===field))){event.preventDefault();togglePause();return;}
    if(!g||g.paused||!['ArrowLeft','ArrowRight'].includes(event.key)||event.target.closest('select'))return;
    event.preventDefault();keys.add(event.key);direction();
    if(!event.repeat)moveBasket(g.basket+(event.key==='ArrowLeft'?-BASKET_STEP:BASKET_STEP));
  });
  field.addEventListener('pointermove',event=>{
    if(!g||drag!==event.pointerId)return;
    const r=field.getBoundingClientRect();moveBasket(((event.clientX-r.left)/r.width)*100);
  });
  field.addEventListener('pointerdown',event=>{
    if(!g||g.paused||drag!==null||event.button>0||event.isPrimary===false||event.target.closest('button'))return;
    drag=event.pointerId;try{field.setPointerCapture?.(event.pointerId);}catch{/* Keep direct movement available without capture. */}
    const r=field.getBoundingClientRect();moveBasket(((event.clientX-r.left)/r.width)*100);
  });
}
