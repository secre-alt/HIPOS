// "Sort it out!": a friendly one-item-at-a-time sorting game built from the Waste Guide items.
// Drag the item onto a bin, or just tap a bin (keyboard users can Tab to a bin and press Enter).
// Nothing is scored against the student; the only thing kept is sticker progress on this device.
import { FACES } from './avatar.js';
import {waste,moreWaste} from './content.js';
import {escapeHTML as e} from './core.js';
import {wasteArt,moreWasteArt} from './home.js';
import {cheer,buddySay,sparkle,animate,buzz,sound,recordSort,giveGameTreat,miniBuddy,carePoints,gardenState} from './buddy-fx.js';
import {gardenGrowth} from './garden.js';
import {celebrate} from './motion.js';

const ROUND=6;
const buddyFace=(x,y,scale)=>'<g transform="translate('+x+' '+y+') scale('+scale+')">'+FACES[0].draw()+'</g>';
const buddyItemArt=art=>art.replace('</svg>',buddyFace(48,56,.65)+'</svg>');
const pool=()=>[...waste.map(([title,suitable,body],i)=>({title,suitable,body,art:buddyItemArt(wasteArt(i))})),...moreWaste.map(([title,suitable,body],i)=>({title,suitable,body,art:buddyItemArt(moreWasteArt(i))}))];
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
  return `<section class="card sort-game" id="sort-game" aria-labelledby="sort-heading"><h2 id="sort-heading">Sort it out!</h2><div id="sort-body">${body()}</div></section>`;
}
function body(){
  if(!game)return '';
  if(game.i>=game.items.length)return done();
  const item=game.items[game.i];
  return `<div class="sort-round"><p class="sort-progress" role="status">Item ${game.i+1} of ${game.items.length}</p>
  <div class="round-markers" aria-hidden="true">${game.items.map((_,i)=>`<span class="${i<game.i?'is-complete':i===game.i?'is-current':''}"></span>`).join('')}</div></div>
  <p class="note sort-instruction">Where does this belong? Drag it, or tap a destination.</p>
  <div class="sort-stage"><div class="sort-item" id="sort-item" data-sort-item><span class="item-art">${item.art}</span><strong>${e(item.title)}</strong></div></div>
  <div class="sort-bins"><button type="button" class="sort-bin sort-yes secondary" data-sort-bin="yes" ${game.answered?'disabled':''}><span class="sort-bin-icon" aria-hidden="true">${pouch}</span><strong>Dry-waste pouch</strong><small>Clean, dry, nonhazardous</small></button><button type="button" class="sort-bin sort-no secondary" data-sort-bin="no" ${game.answered?'disabled':''}><span class="sort-bin-icon" aria-hidden="true">${hand}</span><strong>Ask school staff</strong><small>Keep out of the pouch</small></button></div>
  <div class="sort-answer-panel" hidden><div id="sort-feedback" class="feedback" role="status" aria-live="polite" tabindex="-1" hidden></div>
  <div class="actions"><button type="button" id="sort-next" data-sort-next hidden>${game.i+1===game.items.length?'See my result':'Next item'}</button></div></div>`;
}
// Destination mascots share the actual buddy face artwork.
const pouch='<svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true" focusable="false"><ellipse cx="60" cy="110" rx="35" ry="5" fill="#173d2c" opacity=".12"/><path d="M31 35Q60 25 89 35L98 94Q100 107 86 107H34Q20 107 22 94Z" fill="#B8E26A"/><path d="M41 36V26Q41 8 60 8Q79 8 79 26V36" fill="none" stroke="#63924c" stroke-width="5" stroke-linecap="round"/><path d="M32 36Q60 48 88 36" fill="none" stroke="#63924c" stroke-width="3"/>'+buddyFace(60,72,.85)+'</svg>';
const hand='<svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true" focusable="false"><ellipse cx="60" cy="111" rx="36" ry="5" fill="#173d2c" opacity=".12"/><rect x="28" y="71" width="64" height="39" rx="18" fill="#8FD3F4"/><path d="M49 77L60 91L71 77" fill="#fff6dc"/><rect x="75" y="86" width="11" height="14" rx="3" fill="#fff6dc"/><rect x="25" y="13" width="70" height="71" rx="30" fill="#FFD6B0"/><path d="M25 42Q19 9 58 7Q99 5 95 42Q77 37 71 23Q55 40 25 42Z" fill="#755b4b"/>'+buddyFace(60,55,.85)+'</svg>';
function done(){
  const {score,items}=game,total=items.length,perfect=score===total;
  const line=perfect?'Perfect! Every item sorted right.':score>=total-2?'Great sorting!':'Good practice. Every round teaches something new.';
  const review=game.review.length?`<details class="sort-review"><summary>Review what you learned</summary><ul>${game.review.map(item=>`<li><strong>${e(item.title)}</strong><p>${e(item.body)}</p></li>`).join('')}</ul></details>`:'';
  return `<div class="sort-done"><h3>You sorted ${score} of ${total} right.</h3><p>${line}</p>${game.growth||''}<p class="note">Only clean, dry, nonhazardous items belong in the pouch.</p>${review}<div class="actions"><button type="button" data-sort-again>Play again</button><a class="button-link secondary" href="#garden">Visit your garden</a><a class="button-link secondary" href="#classify">Back to Waste Guide</a></div></div>`;
}
function answer(choice){
  if(!game||game.answered||game.i>=game.items.length)return;
  const item=game.items[game.i],right=(choice==='yes')===item.suitable;
  document.querySelector('#sort-game').classList.add('is-answered');
  document.querySelector('.sort-instruction').hidden=true;
  document.querySelector('.sort-answer-panel').hidden=false;
  game.answered=true;if(right)game.score++;
  else game.review.push(item);
  document.querySelectorAll('[data-sort-bin]').forEach(b=>{b.disabled=true;if(b.dataset.sortBin===choice){b.classList.add(right?'is-right':'is-wrong');b.insertAdjacentHTML('beforeend','<span class="sort-choice-label">Your choice</span>');}});
  const destination=document.querySelector(`[data-sort-bin="${item.suitable?'yes':'no'}"]`);
  destination.classList.add('is-answer');
  destination.insertAdjacentHTML('beforeend','<span class="sort-answer-label">Correct destination</span>');
  const itemEl=document.querySelector('#sort-item');itemEl?.classList.add(right?'sorted':'bounced');itemEl?.style.removeProperty('transform');
  const fb=document.querySelector('#sort-feedback');
  fb.hidden=false;fb.className='feedback '+(right?'success-feedback':'');
  fb.innerHTML=`<p><strong>${right?'Correct!':'Not quite.'}</strong> <span>${e(item.suitable?'This can go in a clean dry-waste pouch.':'This stays out of the pouch.')}</span></p><details class="sort-explanation"><summary>Why this destination?</summary><p>${e(item.body)}</p></details>`;
  const next=document.querySelector('#sort-next');next.hidden=false;next.focus({preventScroll:true});fitGame();
  if(right){cheer('correct');sparkle(itemEl,6);buzz(10);}
  else{cheer('retry');}
}
function advance(){
  if(!game||!game.answered||game.i>=game.items.length)return;game.i++;game.answered=false;
  const box=document.querySelector('#sort-body');
  document.querySelector('#sort-game').classList.remove('is-answered');
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
  document.querySelector('[data-sort-bin]')?.focus({preventScroll:true});
  fitGame();
}
// ---- input: click on bins/next/again, and pointer dragging of the item ----
export function sortClick(button){
  if(button.hasAttribute('data-sort-bin'))return answer(button.dataset.sortBin)??'answered';
  if(button.hasAttribute('data-sort-next'))return advance()?'finished':'next';
  if(button.hasAttribute('data-sort-again')){document.querySelector('#sort-game').classList.remove('is-answered');start();document.querySelector('#sort-body').innerHTML=body();fitGame();return 'again';}
}
// Keep the item and both bins on screen (above the bottom bar) so dragging always has a target.
let fitFrame=0;
export function fitGame(){
  fitVisibleGame();
  cancelAnimationFrame(fitFrame);
  // The language observer can wrap labels after the initial render.
  fitFrame=requestAnimationFrame(fitVisibleGame);
}
function fitVisibleGame(){
  const card=document.querySelector('#sort-game'),bins=card?.querySelector('.sort-bins');if(!bins)return;
  const bottomNav=document.querySelector('.mobile-bottom-nav')?.getBoundingClientRect();
  const end=game?.answered?card.querySelector('#sort-next'):bins;
  const room=(bottomNav?.height?bottomNav.top:innerHeight)-8,over=end.getBoundingClientRect().bottom-room;
  if(over>0)scrollBy({top:over+8,behavior:'instant'});
  const top=card.querySelector('.sort-stage')?.getBoundingClientRect().top;
  const safeTop=(document.querySelector('aside')?.getBoundingClientRect().height||0)+8;
  if(!game?.answered&&top!==undefined&&top<safeTop)scrollBy({top:top-safeTop,behavior:'instant'});
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
