// Buddy garden: a cosy plot of nine flowers that grows from the care you already give on this device.
// Nothing wilts, nothing is lost, and nothing leaves the device.
import {gardenState,carePoints,POINTS_PER_PLOT,buddySay,animate,sparkle,sound,miniBuddy} from './buddy-fx.js';
import {gardenArt} from './game-art.js';
import {escapeHTML as e} from './core.js';

const STAGE_TEXT=['Empty plot','Seed','Sprout','In bloom'];
const TIPS=['Habits, sorting rounds, Compost Catch and the daily challenge all water your garden.','Every bit of care helps something grow.','Come back after your next habit to see what grew!'];

export function gardenPage(summary){
  const g=gardenState(carePoints(summary));
  const plots=g.plots.map((p,i)=>{
    return `<li><button type="button" class="garden-plot secondary" data-garden-plot="${i}" data-stage="${p.stage}"><span class="garden-icon" aria-hidden="true">${gardenArt(p.stage,i)}</span><span class="garden-name">${e(p.name)}</span><span class="garden-stage">${STAGE_TEXT[p.stage]}</span></button></li>`;
  }).join('');
  const line=g.complete?'Every flower is in bloom. What a lovely garden!':`${g.blooms} of ${g.plots.length} flowers in bloom`;
  const next=g.complete?'':`<p class="note">${TIPS[g.points%TIPS.length]}</p><p class="note">Each treat, completed game round, and completed challenge day counts as one care point. Three care points bring one flower into bloom.</p>`;
  return `<section class="card garden" id="garden" aria-labelledby="garden-heading">${miniBuddy('garden')}<h2 id="garden-heading">Your garden</h2>
  <p class="garden-count" role="status">${line}</p>${gardenProgress(g)}
  <ul class="garden-grid">${plots}</ul>${next}${g.points===0?'<div class="garden-empty"><p class="note">Your garden is waiting for its first care point. Try one of these:</p><div class="actions"><a class="button-link" href="#sort">Play the sorting game</a><a class="button-link secondary" href="#compost">Catch the compost</a><a class="button-link secondary" href="#home">Do a daily habit</a></div></div>':''}</section>`;
}

function gardenProgress(g){
  if(g.complete)return '<p class="garden-next">Your garden is fully grown. Nothing wilts.</p>';
  const next=g.plots[g.blooms];
  return `<div class="garden-next"><p><span>Next bloom</span> · <strong>${e(next.name)}</strong></p><progress max="${POINTS_PER_PLOT}" value="${next.stage}" aria-label="Progress to next bloom"></progress><p class="note">${g.toNext===1?'1 care point to the next bloom':`${g.toNext} care points to the next bloom`}</p></div>`;
}

// Both game results use the real before/after state, without granting extra rewards.
export function gardenGrowth(before,after){
  const changed=after.plots.map((p,i)=>({...p,index:i})).filter((p,i)=>p.stage>before.plots[i].stage);
  if(!changed.length)return '<div class="garden-growth"><p>Your garden is fully grown. Nothing wilts.</p></div>';
  const latest=changed[changed.length-1];
  return `<div class="garden-growth"><span class="garden-growth-art" aria-hidden="true">${gardenArt(latest.stage,latest.index)}</span><div><strong>Your garden grew</strong><ul>${changed.map(p=>`<li><span>${e(p.name)}</span> · <span>${STAGE_TEXT[p.stage]}</span></li>`).join('')}</ul><p>Each completed round counts as one care point, plus one treat per game each day.</p><p>Three care points bring one flower into bloom.</p>${after.complete?'<p>Your garden is fully grown. Nothing wilts.</p>':''}</div></div>`;
}

export function initGarden(){
  const root=document.querySelector('#garden');if(!root)return;
  root.addEventListener('click',event=>{
    const b=event.target.closest('[data-garden-plot]');if(!b)return;
    const stage=Number(b.dataset.stage),name=b.querySelector('.garden-name')?.textContent||'';
    b.classList.remove('wiggle');void b.offsetWidth;b.classList.add('wiggle');
    sound('coin');
    if(stage===POINTS_PER_PLOT){sparkle(b,6);buddySay(`${name} is in bloom!`);}
    else if(stage>0)buddySay('It is growing. Keep caring!');
    else buddySay('This plot is waiting for its seed.');
    animate('hop');
  });
}
