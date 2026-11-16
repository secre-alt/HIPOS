import {prevention} from './content.js';
import {escapeHTML as e} from './core.js';

// Shared, decorative school-day objects; all guidance remains real HTML text.
const face='<circle cx="43" cy="55" r="2" fill="#254b38"/><circle cx="57" cy="55" r="2" fill="#254b38"/><path d="M46 62q4 4 8 0" fill="none"/><path d="M36 60h3m22 0h3" stroke="#db927f"/>';
const drawings=[
  '<path d="M26 40q24-24 48 0l-4 36H30Z" fill="#f3d68d"/><path d="M26 40q24 14 48 0"/><path d="m37 34 2-8m12 3v-8m12 14 3-8"/>',
  '<rect x="39" y="18" width="22" height="12" rx="4" fill="#f3d68d"/><path d="M39 30h22l6 12v34q0 7-8 7H41q-8 0-8-7V42Z" fill="#a8d9c9"/><path d="M34 46h32"/>',
  '<path d="M39 29v-6q0-6 6-6h10q6 0 6 6v6"/><rect x="20" y="29" width="60" height="50" rx="13" fill="#a8d9c9"/><path d="M20 45h60"/><rect x="45" y="40" width="10" height="10" rx="3" fill="#f3d68d"/>',
  '<path d="M31 34h38l6 45H25Z" fill="#f4c2a8"/><path d="M40 37V25a10 10 0 0 1 20 0v12"/>',
  '<path d="M28 34h44l-4 46H32Z" fill="#c5dda0"/><path d="M24 34h52M37 24h26"/><path d="m39 44 2 28m18-28-2 28"/>',
];
function art(index){return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" fill="none" stroke="#254b38" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${drawings[index]}${index===4?'':face}</svg>`;}
function buddy(){return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M51 85C8 76 16 31 69 17c16 34 22 65-18 68Z" fill="#91d4b8" stroke="#254b38" stroke-width="3"/><path d="m40 77 21-40m-13 24-11-8m16-1 12-4" fill="none" stroke="#407b5c" stroke-width="3" stroke-linecap="round"/><circle cx="41" cy="43" r="3" fill="#254b38"/><circle cx="60" cy="39" r="3" fill="#254b38"/><path d="M47 49q5 5 9-2" fill="none" stroke="#254b38" stroke-width="2.5" stroke-linecap="round"/></svg>';}

export function preventPage(){return `<div class="prevent-page">
  <section class="prevent-hero" aria-labelledby="prevent-title">
    <div class="prevent-copy"><h1 id="prevent-title">Prevent it before it starts.</h1><p>A little planning keeps packaging out of your school day.</p></div>
    <div class="prevent-kit"><span class="kit-ground" aria-hidden="true"></span><button type="button" class="kit-bottle kit-friend" data-kit="bottle" aria-label="Ask bottle buddy for a tip">${art(1)}</button><button type="button" class="kit-lunch kit-friend" data-kit="lunch" aria-label="Ask lunchbox buddy for a tip">${art(2)}</button><button type="button" class="kit-buddy kit-friend" data-kit="leaf" aria-label="Ask leaf buddy for a tip">${buddy()}</button><p class="kit-tip" role="status" aria-live="polite" aria-atomic="true">Tap a buddy for a little tip.</p></div>
  </section>
  <div class="prevent-tips">${prevention.map(([title,body,note],index)=>`<article class="prevent-tip"><div class="prevent-art prevent-art-${index}">${art(index)}<span class="prevent-leaf" aria-hidden="true"></span></div><div class="prevent-tip-copy"><h2>${e(title)}</h2><p>${e(body)}</p>${note?`<p class="prevent-note">${e(note)}</p>`:''}</div></article>`).join('')}</div>
</div>`;}

const tips={
  bottle:['Bring a clean refillable bottle. Use only school-approved refill options.','Give your bottle a wash before its next school day.'],
  lunch:['Pack a washable lunchbox and reusable utensils where school rules allow.','Keep your food containers separate from any waste.'],
  leaf:['A little planning keeps packaging out of your school day.','Buy only what you need. Small choices add up!'],
};
const turns=new WeakMap();
export function interactWithKit(event){
  const button=event.target.closest('[data-kit]');
  if(!button)return;
  const messages=tips[button.dataset.kit];
  if(!messages)return;
  const turn=turns.get(button)||0;
  button.closest('.prevent-kit').querySelector('.kit-tip').textContent=messages[turn%messages.length];
  turns.set(button,turn+1);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const drawing=button.querySelector('svg');
    drawing.getAnimations().forEach(animation=>animation.cancel());
    drawing.animate([{transform:'translateY(0) rotate(0)'},{transform:'translateY(-8px) rotate(-6deg)',offset:.4},{transform:'translateY(0) rotate(0)'}],{duration:360,easing:'ease-out'});
  }
}
