// "Safe or Stay Away": spot items that are safe for the dry-waste pouch and ones that need school staff.
// Eight quick items, two big buttons, a short reason after each answer. Runs on this device only.
import {escapeHTML as e} from './core.js';
import {gameArt} from './game-art.js';
import {cheer,sparkle,buzz,recordHazard,giveGameTreat,carePoints,gardenState} from './buddy-fx.js';
import {gardenGrowth} from './garden.js';

export const HAZARD_ITEMS=[
  {name:'Used battery',art:'battery',safe:false,why:'Batteries can leak or overheat. Give them to school staff.'},
  {name:'Broken light bulb',art:'bulb',safe:false,why:'Broken bulbs are sharp and can hold unsafe materials. Ask school staff.'},
  {name:'Spray can',art:'aerosol',safe:false,why:'Spray cans can burst under pressure. Keep them out of the pouch.'},
  {name:'Lighter',art:'lighter',safe:false,why:'A lighter can spark or leak fuel. Hand it to school staff.'},
  {name:'Broken glass',art:'glass',safe:false,why:'Glass can cut. Do not touch it; tell school staff.'},
  {name:'Clean paper',art:'paper',safe:true,why:'Clean, dry paper is safe for the dry-waste pouch.'},
  {name:'Empty dry bottle',art:'bottle',safe:true,why:'An empty, dry bottle is safe for the pouch.'},
  {name:'Flattened box',art:'box',safe:true,why:'A clean, flat box is safe for the pouch.'},
  {name:'Clean dry wrapper',art:'wrapper',safe:true,why:'A clean, dry wrapper is safe for the pouch.'},
  {name:'Clean dry carton',art:'carton',safe:true,why:'A rinsed, dry carton is safe for the pouch.'},
];
export const HAZARD_ROUND=8;
export function makeHazardRound(random=Math.random){
  const shuffle=a=>{const o=[...a];for(let i=o.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[o[i],o[j]]=[o[j],o[i]];}return o;};
  const bad=shuffle(HAZARD_ITEMS.filter(x=>!x.safe)).slice(0,HAZARD_ROUND/2),good=shuffle(HAZARD_ITEMS.filter(x=>x.safe)).slice(0,HAZARD_ROUND/2);
  return shuffle([...bad,...good]);
}
let g=null,gardenSummary={};
const begin=()=>{g={items:makeHazardRound(),i:0,score:0,answered:false};};
export function hazardGame(summary={}){
  gardenSummary=summary;begin();
  return `<section class="card hazard-game" id="hazard-game" aria-labelledby="hazard-heading"><h2 id="hazard-heading">Safe or Stay Away</h2><div id="hazard-body">${body()}</div></section>`;
}
function body(){
  if(!g)return '';
  const it=g.items[g.i];
  return `<div class="sort-round"><p class="sort-progress" role="status">Item ${g.i+1} of ${g.items.length}</p><div class="round-markers" aria-hidden="true">${g.items.map((_,i)=>`<span class="${i<g.i?'is-complete':i===g.i?'is-current':''}"></span>`).join('')}</div></div>
  <p class="note">Is it safe for the dry-waste pouch, or should you stay away and ask school staff?</p>
  <div class="sort-stage"><div class="sort-item hazard-item"><span class="item-art">${gameArt(it.art)}</span><strong>${e(it.name)}</strong></div></div>
  <div class="sort-bins"><button type="button" class="sort-bin sort-yes secondary" data-hazard="safe"><strong>Safe for the pouch</strong><small>Clean, dry, nonhazardous</small></button><button type="button" class="sort-bin sort-no secondary" data-hazard="stay"><strong>Stay away</strong><small>Ask school staff</small></button></div>
  <div id="hazard-feedback" class="feedback" role="status" aria-live="polite"></div>
  <div class="actions"><button type="button" id="hazard-next" data-hazard-next hidden>${g.i+1===g.items.length?'See my result':'Next item'}</button></div>`;
}
function answer(choice){
  if(!g||g.answered)return;
  const it=g.items[g.i],right=(choice==='safe')===it.safe;g.answered=true;if(right)g.score++;
  document.querySelectorAll('[data-hazard]').forEach(b=>{b.disabled=true;if(b.dataset.hazard===choice)b.classList.add(right?'is-right':'is-wrong');if((b.dataset.hazard==='safe')===it.safe)b.classList.add('is-answer');});
  const fb=document.querySelector('#hazard-feedback');fb.className='feedback '+(right?'success-feedback':'');
  fb.innerHTML=`<strong>${right?'Correct!':'Let us try this together'}</strong> <span>${e(it.why)}</span>`;
  const next=document.querySelector('#hazard-next');next.hidden=false;next.focus({preventScroll:true});
  if(right){cheer('correct');sparkle(document.querySelector('.hazard-item'),5);buzz(10);}else cheer('retry');
}
function finish(){
  const total=g.items.length,perfect=g.score===total;
  const before=gardenState(carePoints(gardenSummary));
  recordHazard(g.score,total);giveGameTreat('hazard');
  const growth=gardenGrowth(before,gardenState(carePoints(gardenSummary)));
  const line=perfect?'Perfect! You spotted every hazard.':g.score>=total-2?'Great safety eyes!':'Good practice. Every round teaches something new.';
  const box=document.querySelector('#hazard-game');
  const d=document.createElement('dialog');d.className='compost-result hazard-result';d.setAttribute('aria-labelledby','hazard-result-title');
  d.innerHTML=`<div class="compost-done"><h3 id="hazard-result-title">You got ${g.score} of ${total} right.</h3><p>${e(line)}</p>${growth}<p class="note">When in doubt, stay away and ask school staff.</p><div class="actions"><button type="button" data-hazard-again>Play again</button><a class="button-link secondary" href="#garden">Proceed to Buddy garden</a></div></div><button type="button" class="secondary compost-result-close" aria-label="Close">×</button>`;
  box.append(d);
  d.querySelector('.compost-result-close').addEventListener('click',()=>d.close());
  d.addEventListener('close',()=>{d.remove();document.querySelector('[data-hazard-again],[data-hazard]')?.focus({preventScroll:true});});
  if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
  document.dispatchEvent(new CustomEvent('hipos-game-done'));
  cheer('complete');
  document.querySelector('#hazard-body').innerHTML=`<div class="sort-finished"><p class="sort-finished-line">You got ${g.score} of ${total} right.</p><div class="actions"><button type="button" data-hazard-again>Play again</button></div></div>`;
  g.finished=true;
}
export function hazardClick(b){
  if(b.hasAttribute('data-hazard'))return answer(b.dataset.hazard)??'answered';
  if(b.hasAttribute('data-hazard-next')){
    if(!g||!g.answered)return;
    g.i++;g.answered=false;
    if(g.i>=g.items.length){g.i=g.items.length-1;finish();return 'finished';}
    document.querySelector('#hazard-body').innerHTML=body();document.querySelector('[data-hazard]')?.focus({preventScroll:true});return 'next';
  }
  if(b.hasAttribute('data-hazard-again')){document.querySelector('.hazard-result')?.close();begin();document.querySelector('#hazard-body').innerHTML=body();document.querySelector('[data-hazard]')?.focus({preventScroll:true});return 'again';}
}
