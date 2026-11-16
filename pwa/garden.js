// Buddy garden: a cosy plot of nine flowers that grows from the care you already give on this device.
// Nothing wilts, nothing is lost, and nothing leaves the device.
import {gardenState,carePoints,POINTS_PER_PLOT,buddySay,animate,sparkle,sound,miniBuddy} from './buddy-fx.js';

const STAGE_ICON=['','🌱','🌿'];
const STAGE_TEXT=['Empty plot','Seed','Sprout','In bloom'];
const TIPS=['Habits, sorting rounds, Compost Catch and the daily challenge all water your garden.','Every bit of care helps something grow.','Come back after your next habit to see what grew!'];

export function gardenPage(summary){
  const g=gardenState(carePoints(summary));
  const plots=g.plots.map((p,i)=>{
    const icon=p.stage===POINTS_PER_PLOT?p.bloom:STAGE_ICON[p.stage]||'';
    const label=`${p.name}: ${STAGE_TEXT[p.stage]}`;
    return `<li><button type="button" class="garden-plot secondary" data-garden-plot="${i}" data-stage="${p.stage}" aria-label="${label}"><span class="garden-icon" aria-hidden="true">${icon||'·'}</span><span class="garden-name">${p.name}</span><span class="garden-stage">${STAGE_TEXT[p.stage]}</span></button></li>`;
  }).join('');
  const line=g.complete?'Every flower is in bloom. What a lovely garden!':`${g.blooms} of ${g.plots.length} flowers in bloom`;
  const next=g.complete?'':`<p class="note">${TIPS[g.points%TIPS.length]}</p>`;
  return `<section data-back-to-top-card class="card garden" id="garden" aria-labelledby="garden-heading">${miniBuddy('garden')}<h2 id="garden-heading">Your garden</h2>
  <p class="garden-count" role="status">${line}</p>
  <ul class="garden-grid">${plots}</ul>${next}</section>`;
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
