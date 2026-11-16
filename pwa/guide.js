import {waste,wasteKeywords,moreWaste} from './content.js';
import {wasteArt,moreWasteArt} from './home.js';
import {escapeHTML as e} from './core.js';

const items=()=>[...waste.map(([title,suitable,body],i)=>({title,suitable,body,art:wasteArt(i),words:wasteKeywords[i]||'',extra:false})),...moreWaste.map(([title,suitable,body,words],i)=>({title,suitable,body,art:moreWasteArt(i),words,extra:true}))];
const norm=text=>text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

import {miniBuddy} from './buddy-fx.js';
export function guideTools(){
  const total=waste.length+moreWaste.length;
  return `<section class="guide-tools" aria-label="Search and filter the waste guide"><div class="guide-search-heading"><label for="guide-search">Search the guide</label>${miniBuddy('guide')}</div><input id="guide-search" type="search" placeholder="Try “juice box” or “battery”" autocomplete="off" enterkeyhint="search"><div class="chips" role="group" aria-label="Filter by guidance"><button class="secondary chip" data-guide-filter="all" aria-pressed="true">All</button><button class="secondary chip" data-guide-filter="ok" aria-pressed="false">Suitable if clean and dry</button><button class="secondary chip" data-guide-filter="no" aria-pressed="false">Keep out of your pouch</button></div><p id="guide-count" class="note" role="status" aria-live="polite">${total} items</p></section>`;
}
export function guideCards(){
  return items().map(({title,suitable,body,art,words,extra})=>`<article class="card visual-waste-card${extra?' extra':''}" data-kind="${suitable?'ok':'no'}" data-search="${e(norm(`${title} ${body} ${words}`))}">${art}<span class="pill ${suitable?'':'unsafe'}">${suitable?'Suitable if clean and dry':'Keep out of your pouch'}</span><h3>${e(title)}</h3><p>${e(body)}</p></article>`).join('')
    +'<p id="guide-empty" class="feedback" hidden>No match. If you’re unsure, keep it out of your pouch and ask school staff.</p>';
}
export function setGuideFilter(button){
  document.querySelectorAll('[data-guide-filter]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
  applyGuideFilter();
}
export function applyGuideFilter(){
  const input=document.querySelector('#guide-search');if(!input)return;
  const terms=norm(input.value).split(/\s+/).filter(Boolean),kind=document.querySelector('[data-guide-filter][aria-pressed=true]')?.dataset.guideFilter||'all';
  const cards=[...document.querySelectorAll('.visual-waste-card')];let shown=0;
  for(const card of cards){
    // Match the stored English text and keywords, plus whatever language is on screen.
    const hay=card.dataset.search+' '+norm(card.textContent);
    const match=(kind==='all'||card.dataset.kind===kind)&&terms.every(term=>hay.includes(term));
    card.hidden=!match;if(match)shown++;
  }
  document.querySelector('#guide-count').textContent=shown===cards.length?`${cards.length} items`:`${shown} of ${cards.length} items`;
  document.querySelector('#guide-empty').hidden=shown>0;
}
