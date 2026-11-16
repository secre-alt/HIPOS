// "Sort it out!": a friendly one-item-at-a-time sorting game built from the Waste Guide items.
// Drag the item onto a bin, or just tap a bin (keyboard users can Tab to a bin and press Enter).
// Nothing is scored against the student; the only thing kept is sticker progress on this device.
import {waste,moreWaste} from './content.js';
import {escapeHTML as e} from './core.js';
import {wasteArt,moreWasteArt} from './home.js';
import {cheer,buddySay,sparkle,animate,buzz,sound,recordSort,giveGameTreat,miniBuddy,carePoints,gardenState} from './buddy-fx.js';
import {gardenGrowth} from './garden.js';
import {celebrate} from './motion.js';

const ROUND=6;
const pool=()=>[...waste.map(([title,suitable,body],i)=>({title,suitable,body,art:wasteArt(i)})),...moreWaste.map(([title,suitable,body],i)=>({title,suitable,body,art:moreWasteArt(i)}))];
let game=null,lastTitles=[],gardenSummary={};

export function makeRound(random=Math.random,previous=[]){
  const shuffle=a=>{const out=[...a];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
  const all=pool(),fresh=a=>[...a.filter(x=>!previous.includes(x.title)),...a.filter(x=>previous.includes(x.title))];
  const yes=fresh(shuffle(all.filter(x=>x.suitable))).slice(0,ROUND/2),no=fresh(shuffle(all.filter(x=>!x.suitable))).slice(0,ROUND/2);
  return shuffle([...yes,...no]);
}
const start=()=>{game={items:makeRound(Math.random,lastTitles),i:0,score:0,answered:false,review:[]};lastTitles=game.items.map(x=>x.title);};

export function sortGame(summary={}){
  gardenSummary=summary;
  start();
  return `<section class="card sort-game" id="sort-game" aria-labelledby="sort-heading">${miniBuddy('sort')}<h2 id="sort-heading">Sort it out!</h2><div id="sort-body">${body()}</div></section>`;
}
function body(){
  if(!game)return '';
  if(game.i>=game.items.length)return done();
  const item=game.items[game.i];
  return `<p class="sort-progress" role="status">Item ${game.i+1} of ${game.items.length}</p>
  <div class="round-markers" aria-hidden="true">${game.items.map((_,i)=>`<span class="${i<game.i?'is-complete':i===game.i?'is-current':''}"></span>`).join('')}</div>
  <p class="note">Drag the item to a bin, or tap a bin.</p>
  <div class="sort-stage"><div class="sort-item" id="sort-item" data-sort-item><span class="item-art">${item.art}</span><strong>${e(item.title)}</strong></div></div>
  <div class="sort-bins"><button type="button" class="sort-bin sort-yes secondary" data-sort-bin="yes" ${game.answered?'disabled':''}><span class="sort-bin-icon" aria-hidden="true">${pouch}</span><strong>Dry-waste pouch</strong><small>Clean, dry, nonhazardous</small></button><button type="button" class="sort-bin sort-no secondary" data-sort-bin="no" ${game.answered?'disabled':''}><span class="sort-bin-icon" aria-hidden="true">${hand}</span><strong>Ask school staff</strong><small>Keep out of the pouch</small></button></div>
  <div id="sort-feedback" class="feedback" role="status" aria-live="polite" tabindex="-1" hidden></div>
  <div class="actions"><button type="button" id="sort-next" data-sort-next hidden>${game.i+1===game.items.length?'See my result':'Next item'}</button></div>`;
}
const pouch='<svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 11h16l2 15H6z"/><path d="M11 11q0-6 5-6t5 6M11 19h10"/></svg>';
const hand='<svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15V8a2 2 0 0 1 4 0v6m0-1V6a2 2 0 0 1 4 0v8m0-4a2 2 0 0 1 4 0v8a8 8 0 0 1-8 8h-1a7 7 0 0 1-6-3l-4-6a2 2 0 0 1 3-2l2 2"/></svg>';
function done(){
  const {score,items}=game,total=items.length,perfect=score===total;
  const line=perfect?'Perfect! Every item sorted right.':score>=total-2?'Great sorting!':'Good practice. Every round teaches something new.';
  const review=game.review.length?`<details class="sort-review"><summary>Review what you learned</summary><ul>${game.review.map(item=>`<li><strong>${e(item.title)}</strong><p>${e(item.body)}</p></li>`).join('')}</ul></details>`:'';
  return `<div class="sort-done"><h3>You sorted ${score} of ${total} right.</h3><p>${line}</p>${game.growth||''}<p class="note">Only clean, dry, nonhazardous items belong in the pouch.</p>${review}<div class="actions"><button type="button" data-sort-again>Play again</button><a class="button-link secondary" href="#garden">Visit your garden</a><a class="button-link secondary" href="#classify">Back to Waste Guide</a></div></div>`;
}
function answer(choice){
  if(!game||game.answered||game.i>=game.items.length)return;
  const item=game.items[game.i],right=(choice==='yes')===item.suitable;
  game.answered=true;if(right)game.score++;
  else game.review.push(item);
  document.querySelectorAll('[data-sort-bin]').forEach(b=>{b.disabled=true;if(b.dataset.sortBin===choice)b.classList.add(right?'is-right':'is-wrong');});
  const itemEl=document.querySelector('#sort-item');itemEl?.classList.add(right?'sorted':'bounced');itemEl?.style.removeProperty('transform');
  const fb=document.querySelector('#sort-feedback');
  fb.hidden=false;fb.className='feedback '+(right?'success-feedback':'');
  fb.innerHTML=`<p><strong>${right?'Yes!':'Not quite.'}</strong> <span>${e(item.suitable?'This can go in a clean dry-waste pouch.':'This stays out of the pouch.')}</span> <span>${e(item.body)}</span></p>`;
  const next=document.querySelector('#sort-next');next.hidden=false;next.focus({preventScroll:true});
  if(right){cheer('correct');sparkle(itemEl,6);buzz(10);}
  else{cheer('retry');}
}
function advance(){
  if(!game||!game.answered||game.i>=game.items.length)return;game.i++;game.answered=false;
  const box=document.querySelector('#sort-body');
  if(game.i>=game.items.length){
    const before=gardenState(carePoints(gardenSummary));
    recordSort(game.score,game.items.length);giveGameTreat('sort');
    game.growth=gardenGrowth(before,gardenState(carePoints(gardenSummary)));
    box.innerHTML=body();
    if(game.score===game.items.length){celebrate();cheer('complete');}
    else{cheer('complete');}
    box.querySelector('h3')?.setAttribute('tabindex','-1');box.querySelector('h3')?.focus({preventScroll:true});
    return true; // round finished: the caller refreshes stickers
  }
  box.innerHTML=body();
  fitGame();
}
// ---- input: click on bins/next/again, and pointer dragging of the item ----
export function sortClick(button){
  if(button.hasAttribute('data-sort-bin'))return answer(button.dataset.sortBin)??'answered';
  if(button.hasAttribute('data-sort-next'))return advance()?'finished':'next';
  if(button.hasAttribute('data-sort-again')){start();document.querySelector('#sort-body').innerHTML=body();fitGame();return 'again';}
}
// Keep the item and both bins on screen (above the bottom bar) so dragging always has a target.
export function fitGame(){
  const card=document.querySelector('#sort-game'),bins=card?.querySelector('.sort-bins');if(!bins)return;
  const room=innerHeight-(matchMedia('(max-width:1000px)').matches?96:16),over=bins.getBoundingClientRect().bottom-room;
  if(over>0)scrollBy({top:over+8,behavior:'instant'});
  const top=card.querySelector('.sort-stage')?.getBoundingClientRect().top;
  if(top!==undefined&&top<70)scrollBy({top:top-80,behavior:'instant'});
}
let drag=null;
export function sortPointerDown(event){
  const item=event.target.closest('[data-sort-item]');if(!item||!game||game.answered||event.button>0)return;
  const rect=item.getBoundingClientRect();drag={item,x:event.clientX,y:event.clientY,id:event.pointerId,moved:false,rect};
  item.setPointerCapture?.(event.pointerId);item.classList.add('dragging');
}
export function sortPointerMove(event){
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>6)drag.moved=true;
  drag.item.style.transform=`translate(${dx}px,${dy}px) rotate(${Math.max(-12,Math.min(12,dx/12))}deg)`;
  document.querySelectorAll('[data-sort-bin]').forEach(b=>{const r=b.getBoundingClientRect();b.classList.toggle('hover',event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom);});
}
export function sortPointerUp(event){
  if(!drag||event.pointerId!==drag.id)return;
  const {item}=drag;let target=null;
  document.querySelectorAll('[data-sort-bin]').forEach(b=>{const r=b.getBoundingClientRect();if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom)target=b.dataset.sortBin;b.classList.remove('hover');});
  item.classList.remove('dragging');drag=null;
  if(target)answer(target);else item.style.transform='';
}
export const sortActive=()=>Boolean(game);
