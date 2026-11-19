// "Sort it out!": a friendly one-item-at-a-time sorting game built from the Waste Guide items.
// Drag the item onto a bin, or just tap a bin (keyboard users can Tab to a bin and press Enter).
// Nothing is scored against the student; the only thing kept is sticker progress on this device.
import { FACES, renderAvatar, currentConfig } from './avatar.js';
import {waste,moreWaste} from './content.js';
import {escapeHTML as e} from './core.js';
import {wasteArt,moreWasteArt} from './home.js';
import {cheer,buddySay,sparkle,animate,buzz,sound,recordSort,giveGameTreat,miniBuddy,carePoints,gardenState} from './buddy-fx.js';
import {gardenGrowth} from './garden.js';
import {celebrate} from './motion.js';
import {queueGuideSearch} from './guide.js';

const ROUND=6;
const buddyFace=(x,y,scale)=>'<g transform="translate('+x+' '+y+') scale('+scale+')">'+FACES[0].draw()+'</g>';
const buddyItemArt=art=>art.replace('</svg>',buddyFace(48,56,.65)+'</svg>');
const pool=()=>[...waste.map(([title,suitable,body],i)=>({title,suitable,body,art:buddyItemArt(wasteArt(i))})),...moreWaste.map(([title,suitable,body],i)=>({title,suitable,body,art:buddyItemArt(moreWasteArt(i))}))];
let game=null,lastTitles=[],gardenSummary={};
// Items answered wrong are kept on this device so they can be looked at again; answering one right clears it.
const REVIEW_KEY='hipos.review.v1';
export function reviewList(storage=globalThis.localStorage){
  try{const v=JSON.parse(storage.getItem(REVIEW_KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x.title==='string'&&typeof x.body==='string').slice(0,12):[];}catch{return [];}
}
export function updateReview(item,right,storage=globalThis.localStorage){
  try{
    const rest=reviewList(storage).filter(x=>x.title!==item.title);
    const next=right?rest:[{title:item.title,body:item.body},...rest].slice(0,12);
    storage.setItem(REVIEW_KEY,JSON.stringify(next));
  }catch{/* storage blocked: the game still works */}
}
const reviewLater=()=>{const list=reviewList();return list.length?`<details class="sort-review review-later"><summary><span>Review later</span> <span data-no-translate>(${list.length})</span></summary><ul>${list.map(x=>`<li><strong>${e(x.title)}</strong><p>${e(x.body)}</p></li>`).join('')}</ul><p class="note">Answer one right in a round and it leaves this list.</p><button type="button" class="secondary" data-sort-practice>Practice these</button></details>`:'';};

export function makeRound(random=Math.random,previous=[]){
  const shuffle=a=>{const out=[...a];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
  const all=pool(),fresh=a=>[...a.filter(x=>!previous.includes(x.title)),...a.filter(x=>previous.includes(x.title))];
  const yes=fresh(shuffle(all.filter(x=>x.suitable))).slice(0,ROUND/2),no=fresh(shuffle(all.filter(x=>!x.suitable))).slice(0,ROUND/2);
  return shuffle([...yes,...no]);
}
// A practice round starts with the items you missed before, then fills up with fresh ones.
export function makePracticeRound(missed,random=Math.random,previous=[]){
  const shuffle=a=>{const out=[...a];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
  const names=new Set(missed.map(x=>x.title)),mine=pool().filter(x=>names.has(x.title)).slice(0,ROUND);
  const rest=makeRound(random,previous).filter(x=>!names.has(x.title));
  return shuffle([...mine,...rest].slice(0,ROUND));
}
const start=(practice=false)=>{game={items:practice?makePracticeRound(reviewList(),Math.random,lastTitles):makeRound(Math.random,lastTitles),i:0,score:0,answered:false,review:[]};lastTitles=game.items.map(x=>x.title);};

export function sortGame(summary={}){
  gardenSummary=summary;
  start();
  return `<section class="card sort-game" id="sort-game" aria-labelledby="sort-heading"><h2 id="sort-heading">Sort it out!</h2>${reviewLater()}<div id="sort-body">${body()}</div></section>`;
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
  <button type="button" class="secondary sort-review-answer" data-sort-review hidden>Review answer</button><dialog class="sort-answer-panel" id="sort-answer-dialog" aria-labelledby="sort-answer-title" aria-describedby="sort-answer-item sort-answer-summary"><button type="button" class="secondary sort-modal-close" data-sort-close aria-label="Close answer">&times;</button><div class="sort-modal-buddy" aria-hidden="true"></div><div id="sort-feedback" class="feedback" hidden></div>
  <div class="actions"><button type="button" id="sort-next" data-sort-next hidden>${game.i+1===game.items.length?'See my result':'Next item'}</button></div></dialog>`;
}
// Destination mascots share the actual buddy face artwork.
const pouch='<svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true" focusable="false"><ellipse cx="60" cy="110" rx="35" ry="5" fill="#173d2c" opacity=".12"/><path d="M31 35Q60 25 89 35L98 94Q100 107 86 107H34Q20 107 22 94Z" fill="#B8E26A"/><path d="M41 36V26Q41 8 60 8Q79 8 79 26V36" fill="none" stroke="#63924c" stroke-width="5" stroke-linecap="round"/><path d="M32 36Q60 48 88 36" fill="none" stroke="#63924c" stroke-width="3"/>'+buddyFace(60,72,.85)+'</svg>';
const hand='<svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true" focusable="false"><ellipse cx="60" cy="111" rx="36" ry="5" fill="#173d2c" opacity=".12"/><rect x="28" y="71" width="64" height="39" rx="18" fill="#8FD3F4"/><path d="M49 77L60 91L71 77" fill="#fff6dc"/><rect x="75" y="86" width="11" height="14" rx="3" fill="#fff6dc"/><rect x="25" y="13" width="70" height="71" rx="30" fill="#FFD6B0"/><path d="M25 42Q19 9 58 7Q99 5 95 42Q77 37 71 23Q55 40 25 42Z" fill="#755b4b"/>'+buddyFace(60,55,.85)+'</svg>';
function done(){
  const {score,items}=game,total=items.length,perfect=score===total;
  const line=perfect?'Perfect! Every item sorted right.':score>=total-2?'Great sorting!':'Good practice. Every round teaches something new.';
  const review=game.review.length?`<details class="sort-review"><summary>Review what you learned</summary><ul>${game.review.map(item=>`<li><strong>${e(item.title)}</strong><p>${e(item.body)}</p></li>`).join('')}</ul></details>`:'';
  return `<div class="sort-finished"><p class="sort-finished-line">You sorted ${score} of ${total} right.</p><div class="actions"><button type="button" data-sort-results>See results</button><button type="button" class="secondary" data-sort-restart>Play again</button></div></div><dialog class="sort-answer-panel sort-result" id="sort-result-dialog" aria-labelledby="sort-result-title"><button type="button" class="secondary sort-modal-close" data-sort-result-close aria-label="Close">&times;</button><div class="sort-done"><h3 id="sort-result-title">You sorted ${score} of ${total} right.</h3><p>${line}</p>${game.growth||''}<p class="note">Only clean, dry, nonhazardous items belong in the pouch.</p>${review}<div class="actions"><button type="button" data-sort-again>Play again</button><a class="button-link secondary" href="#compost">Proceed to Compost Catch</a><a class="button-link secondary" href="#classify">Back to Waste Guide</a></div></div></dialog>`;
}
function answer(choice){
  if(!game||game.answered||game.i>=game.items.length)return;
  const item=game.items[game.i],right=(choice==='yes')===item.suitable;
  document.querySelector('#sort-game').classList.add('is-answered');
  document.querySelector('.sort-instruction').hidden=true;
  game.answered=true;updateReview(item,right);
  if(right)game.score++;
  else game.review.push(item);
  document.querySelectorAll('[data-sort-bin]').forEach(b=>{b.disabled=true;if(b.dataset.sortBin===choice){b.classList.add(right?'is-right':'is-wrong');b.insertAdjacentHTML('beforeend','<span class="sort-choice-label">Your choice</span>');}});
  const destination=document.querySelector(`[data-sort-bin="${item.suitable?'yes':'no'}"]`);
  destination.classList.add('is-answer');
  destination.insertAdjacentHTML('beforeend','<span class="sort-answer-label">Correct destination</span>');
  const itemEl=document.querySelector('#sort-item');itemEl?.classList.add(right?'sorted':'bounced');itemEl?.style.removeProperty('transform');
  const fb=document.querySelector('#sort-feedback');
  fb.hidden=false;fb.className='feedback '+(right?'success-feedback':'');
  fb.innerHTML=`<h3 id="sort-answer-title">${right?'Correct!':'Let us try this together'}</h3><p id="sort-answer-item" class="sort-answer-item">${e(item.title)}</p><p id="sort-answer-summary" class="sort-answer-destination">${item.suitable?'Dry-waste pouch':'Ask school staff'}</p><div class="sort-explanation"><p>${e(item.body)}</p></div><p class="sort-guide-link"><a class="button-link secondary" href="#classify" data-guide-for="${e(item.title)}">See in Waste Guide</a></p>`;
  const modal=document.querySelector('#sort-answer-dialog'),review=document.querySelector('[data-sort-review]');
  modal.querySelector('.sort-modal-buddy').innerHTML=renderAvatar({...currentConfig(),face:right?1:0},{size:96,decorative:true});
  modal.addEventListener('click',event=>{if(event.target.closest('[data-sort-close]'))modal.close();const g=event.target.closest('[data-guide-for]');if(g)queueGuideSearch(g.dataset.guideFor);});
  modal.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const controls=[...modal.querySelectorAll('button:not([disabled]),summary,a[href],[tabindex="0"]')].filter(el=>el.getClientRects().length);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  modal.addEventListener('close',()=>{if(review.isConnected&&game?.answered){review.hidden=false;review.focus({preventScroll:true});review.scrollIntoView({block:'center',behavior:'instant'});}});
  const next=document.querySelector('#sort-next');next.hidden=false;next.innerHTML='<span>'+(game.i+1===game.items.length?'See my result':'Next item')+'</span><span aria-hidden="true">&rarr;</span>';
  modal.showModal();next.focus({preventScroll:true});
  if(right){cheer('correct');sparkle(itemEl,6);buzz(10);}
  else{cheer('retry');}
}
function openResult(){
  const modal=document.querySelector('#sort-result-dialog');if(!modal)return;
  modal.addEventListener('click',event=>{if(event.target.closest('[data-sort-result-close]'))modal.close();});
  modal.addEventListener('close',()=>{document.querySelector('[data-sort-results]')?.focus({preventScroll:true});});
  if(typeof modal.showModal==='function')modal.showModal();else modal.setAttribute('open','');
  const heading=modal.querySelector('h3');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});modal.scrollTop=0;
}
function advance(){
  if(!game||!game.answered||game.i>=game.items.length)return;game.i++;game.answered=false;
  document.querySelector('#sort-answer-dialog')?.close();
  const box=document.querySelector('#sort-body');
  document.querySelector('#sort-game').classList.remove('is-answered');
  if(game.i>=game.items.length){
    const before=gardenState(carePoints(gardenSummary));
    recordSort(game.score,game.items.length);giveGameTreat('sort');
    game.growth=gardenGrowth(before,gardenState(carePoints(gardenSummary)));
    box.innerHTML=body();
    if(game.score===game.items.length){celebrate();cheer('complete');}
    else{cheer('complete');}
    openResult();
    return true; // round finished: the caller refreshes stickers
  }
  box.innerHTML=body();
  document.querySelector('[data-sort-bin]')?.focus({preventScroll:true});
  fitGame();
}
// ---- input: click on bins/next/again, and pointer dragging of the item ----
export function sortClick(button){
  if(button.hasAttribute('data-sort-review')){const modal=document.querySelector('#sort-answer-dialog');modal.showModal();document.querySelector('#sort-next').focus({preventScroll:true});return 'review';}
  if(button.hasAttribute('data-sort-practice')){start(true);document.querySelector('#sort-game')?.classList.remove('is-answered');document.querySelector('#sort-body').innerHTML=body();document.querySelector('.review-later')?.removeAttribute('open');fitGame();return 'practice';}
  if(button.hasAttribute('data-sort-bin'))return answer(button.dataset.sortBin)??'answered';
  if(button.hasAttribute('data-sort-next'))return advance()?'finished':'next';
  if(button.hasAttribute('data-sort-results')){openResult();return 'results';}
  if(button.hasAttribute('data-sort-again')||button.hasAttribute('data-sort-restart')){document.querySelector('#sort-game').classList.remove('is-answered');start();document.querySelector('#sort-body').innerHTML=body();fitGame();return 'again';}
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
  if(game?.answered)return;
  const end=bins;
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
