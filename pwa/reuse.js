import {reuse} from './content.js';
import {escapeHTML as e} from './core.js';

const shapes=[
  '<rect x="40" y="14" width="20" height="12" rx="4" fill="#f0d58e"/><path d="M40 26h20l8 14v37q0 8-8 8H40q-8 0-8-8V40Z" fill="#a8d9c9"/><path d="M33 44h34"/>',
  '<path d="M39 29v-7q0-5 5-5h12q5 0 5 5v7"/><rect x="18" y="29" width="64" height="51" rx="14" fill="#f0d58e"/><path d="M18 45h64"/><rect x="45" y="40" width="10" height="10" rx="3" fill="#a8d9c9"/>',
  '<path d="M29 18v24m-9-24v17q0 9 9 9t9-9V18M29 44v38"/><ellipse cx="66" cy="32" rx="13" ry="18" fill="#a8d9c9"/><path d="M66 50v32"/>',
];
function object(index){return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" fill="none" stroke="#254b38" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${shapes[index]}${index<2?'<circle cx="43" cy="59" r="2" fill="#254b38"/><circle cx="57" cy="59" r="2" fill="#254b38"/><path d="M46 66q4 4 8 0"/>':''}</svg>`;}
function scene(){return `<svg viewBox="0 0 320 200" aria-hidden="true" focusable="false"><ellipse cx="160" cy="171" rx="138" ry="19" fill="var(--leaf-soft)"/><g transform="translate(159 0) rotate(9 55 80)">${object(0).replace('viewBox="0 0 100 100"','width="110" height="170" viewBox="0 0 100 100"')}</g><g transform="translate(35 52) rotate(-7 80 60)">${object(1).replace('viewBox="0 0 100 100"','width="170" height="135" viewBox="0 0 100 100"')}</g><g fill="#dceee3" stroke="#6da78c" stroke-width="2"><circle cx="67" cy="43" r="10"/><circle cx="88" cy="24" r="6"/><circle cx="261" cy="90" r="8"/></g></svg>`;}

export function reusePage(){const [title,body,note]=reuse[3];return `<div class="reuse-page">
  <section class="reuse-hero" aria-labelledby="reuse-title"><div><h1 id="reuse-title">Use it. Wash it.<br>Use it again.</h1><p>Personal reusables work best when school rules and safe washing come first.</p></div><div class="reuse-scene">${scene()}</div></section>
  <ol class="reuse-cycle" aria-label="Reuse routine"><li><span aria-hidden="true">1</span>Use</li><li><span aria-hidden="true">2</span>Wash</li><li><span aria-hidden="true">3</span>Use again</li></ol>
  <div class="reuse-items">${reuse.slice(0,3).map(([heading,text],index)=>`<article class="reuse-item"><button type="button" class="reuse-friend reuse-friend-${index}" data-reuse-tip="${index}" aria-label="Get a care tip: ${e(heading)}">${object(index)}<span class="reuse-leaf" aria-hidden="true"></span></button><h2>${e(heading)}</h2><p>${e(text)}</p><p class="reuse-care" role="status" aria-live="polite" aria-atomic="true">Tap your little helper for a care tip.</p></article>`).join('')}</div>
  <section class="reuse-scheme" aria-labelledby="reuse-scheme-title"><span class="reuse-approval">Requires school approval</span><h2 id="reuse-scheme-title">${e(title)}</h2><p>${e(body)}</p><p class="reuse-disclaimer">${e(note)}</p></section>
</div>`;}

const careTips=[['Wash your bottle after use and let it dry before storing.','Use only school-approved refill options.'],['Wash your lunchbox after use and let it dry before storing.','Ask vendors before requesting food in your own container.'],['Wash reusable utensils after use and let them dry.','Bring reusable utensils only where school rules allow.']];
const turns=new WeakMap();
export function interactWithReuse(event){const button=event.target.closest('[data-reuse-tip]');if(!button)return;const messages=careTips[Number(button.dataset.reuseTip)];if(!messages)return;const turn=turns.get(button)||0;button.closest('.reuse-item').querySelector('.reuse-care').textContent=messages[turn%messages.length];turns.set(button,turn+1);if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const drawing=button.querySelector('svg');drawing.getAnimations().forEach(animation=>animation.cancel());drawing.animate([{transform:'translateY(0)'},{transform:'translateY(-6px) rotate(-5deg)'},{transform:'translateY(0)'}],{duration:320,easing:'ease-out'});}}
