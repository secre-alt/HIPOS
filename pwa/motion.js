// Scroll motion: content rises into view as it is scrolled to, tiles stagger in, the hero art
// drifts slowly, and a thin progress line fills the top bar. Everything is progressive:
// without JavaScript, IntersectionObserver or with "reduce motion" on, content is simply shown.
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const TARGETS='#view>*:not(.home-activities),.waste-choice,.home-guides>.card,.week-days li';
let io=null;

export function revealOnScroll(){
  io?.disconnect();io=null;
  if(reduced()||!('IntersectionObserver' in window))return;
  const items=[...document.querySelectorAll(TARGETS)];
  if(!items.length)return;
  items.forEach(el=>el.classList.add('rv'));
  io=new IntersectionObserver(entries=>{
    let n=0;
    for(const entry of entries){
      const el=entry.target;
      if(entry.isIntersecting){
        const delay=Math.min(n++,6)*70;
        el.style.setProperty('--rv-delay',delay+'ms');
        el.classList.add('in');
        io.unobserve(el);
        // Drop the helper classes once settled so hover/press styles behave normally.
        setTimeout(()=>{el.classList.remove('rv','in');el.style.removeProperty('--rv-delay');},delay+800);
      }else if(entry.boundingClientRect.top<0){
        // Already scrolled past (e.g. a re-render while far down the page): show instantly.
        el.classList.remove('rv');io.unobserve(el);
      }
    }
  },{rootMargin:'0px 0px -6% 0px',threshold:.06});
  items.forEach(el=>io.observe(el));
}

export function initScrollEffects(){
  document.querySelector('#back-to-top')?.addEventListener('click',()=>{
    const heading=document.querySelector('#view h1')||document.querySelector('#view');
    if(heading){
      if(!heading.hasAttribute('tabindex'))heading.setAttribute('tabindex','-1');
      heading.focus({preventScroll:true});
    }
    window.scrollTo({top:0,behavior:reduced()?'instant':'smooth'});
  });
  const root=document.documentElement,backToTop=document.querySelector('.back-to-top-row');let queued=false;
  const update=()=>{
    queued=false;
    const y=window.scrollY,max=Math.max(0,root.scrollHeight-window.innerHeight);
    const schoolCard=document.querySelector('#view .school-info');
    const cards=[...document.querySelectorAll('#view .card')].filter(card=>card.getClientRects().length);
    const finalSection=cards.at(-1)||document.querySelector('#view')?.lastElementChild;
    // Home starts at School information; other pages start at their final card.
    // For a tall final section, wait until its closing portion comes into view.
    const section=schoolCard||finalSection,rect=section?.getBoundingClientRect();
    const threshold=rect?(schoolCard?rect.top:Math.max(rect.top,rect.bottom-window.innerHeight*.75)):Infinity;
    if(backToTop)backToTop.hidden=threshold>=window.innerHeight&&max-y>32;
    document.querySelector('aside')?.style.setProperty('--progress',Math.min(1,Math.max(0,y/Math.max(1,max))).toFixed(4));
    const art=document.querySelector('.hero-deco');
    if(art)art.style.setProperty('--sy',reduced()?'0':String(Math.min(Math.round(y),1200)));
  };
  const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(update);}};
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  window.addEventListener('hashchange',schedule);
  // Content and font loading can change the bottom without a scroll event.
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(schedule).observe(document.body);
  const view=document.querySelector('#view');
  if(view&&typeof MutationObserver!=='undefined')new MutationObserver(schedule).observe(view,{childList:true,subtree:true});
  schedule();
}

// A short burst of confetti for a finished challenge or habit list. Skipped for "reduce motion".
export function celebrate(){
  if(reduced()||typeof document==='undefined'||!document.body.animate)return;
  const layer=document.createElement('div');layer.className='celebrate';layer.setAttribute('aria-hidden','true');
  const colors=['#b9f26b','#ffd36b','#9fc9f5','#ff8e72','#6fd08c'];
  for(let i=0;i<26;i++){
    const bit=document.createElement('i');bit.className='confetti';bit.style.setProperty('--c',colors[i%colors.length]);
    const angle=(Math.PI*2*i)/26+Math.random()*.4,distance=140+Math.random()*190;
    layer.append(bit);
    bit.animate([
      {transform:'translate(-50%,-50%) rotate(0deg) scale(1)',opacity:1},
      {transform:`translate(calc(-50% + ${Math.cos(angle)*distance}px),calc(-50% + ${Math.sin(angle)*distance*.8+120}px)) rotate(${Math.random()*720-360}deg) scale(.7)`,opacity:0}
    ],{duration:900+Math.random()*500,easing:'cubic-bezier(.15,.7,.3,1)',fill:'forwards'});
  }
  document.body.append(layer);setTimeout(()=>layer.remove(),1600);
}
