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
  return `<section class="card sort-game tabletop-game" id="sort-game" aria-labelledby="sort-heading"><h2 id="sort-heading">Sort it out!</h2><div id="sort-body">${body()}</div></section>`;
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
// Local illustrations give both destinations a physical place on the tabletop.
const pouch='<svg viewBox="0 0 160 112" width="160" height="112" aria-hidden="true" focusable="false"><ellipse cx="80" cy="102" rx="56" ry="7" fill="#163d2c" opacity=".12"/><path d="M48 23Q80 9 112 23L126 87Q128 101 110 101H50Q32 101 34 87Z" fill="#bad98e" stroke="#466747" stroke-width="2.5"/><path d="M49 25Q80 39 111 25" fill="none" stroke="#466747" stroke-width="3"/><path d="M58 26Q50 5 65 5Q76 5 75 31M85 31Q84 5 95 5Q110 5 102 26" fill="none" stroke="#466747" stroke-width="4" stroke-linecap="round"/><path d="M42 57L39 86Q38 94 50 94H110Q122 94 121 86L118 57" fill="none" stroke="#90b267" stroke-width="2" stroke-dasharray="3 4"/><rect x="60" y="50" width="40" height="32" rx="9" fill="#f6f5df"/><path d="M79 73Q63 61 86 55Q95 67 79 73ZM78 76L85 61" fill="#79a760" stroke="#466747" stroke-width="2" stroke-linecap="round"/></svg>';
const hand='<svg viewBox="0 0 160 112" width="160" height="112" aria-hidden="true" focusable="false"><ellipse cx="80" cy="103" rx="55" ry="6" fill="#163d2c" opacity=".12"/><path d="M33 100V81Q33 59 64 57H94Q124 59 124 81V100Z" fill="#8cbac4" stroke="#3c626b" stroke-width="2.5"/><path d="M66 59L79 75L93 59M79 75V99" fill="#f9f6e8" stroke="#3c626b" stroke-width="2"/><path d="M67 47V60Q79 69 91 60V47" fill="#e7b58e" stroke="#855d44" stroke-width="2"/><ellipse cx="79" cy="32" rx="25" ry="28" fill="#f1c9a2" stroke="#855d44" stroke-width="2"/><path d="M54 31Q46 1 76 1Q110 -2 104 32Q92 20 89 13Q77 28 54 31Z" fill="#594439"/><circle cx="69" cy="34" r="2" fill="#413c35"/><circle cx="89" cy="34" r="2" fill="#413c35"/><path d="M73 44Q79 49 85 44" fill="none" stroke="#855d44" stroke-width="2" stroke-linecap="round"/><rect x="97" y="73" width="16" height="21" rx="3" fill="#f9f6e8"/><path d="M101 79H109M101 84H109" stroke="#3c626b" stroke-width="2"/><path d="M23 73Q14 66 17 55Q19 50 24 55L27 61V44Q29 39 32 44L34 61L38 52Q41 48 43 53L40 76" fill="#f1c9a2" stroke="#855d44" stroke-width="2" stroke-linejoin="round"/></svg>';
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
