// Scroll motion: content rises into view as it is scrolled to, tiles stagger in, the hero art
// drifts slowly, and a thin progress line fills the top bar. Everything is progressive:
// without JavaScript, IntersectionObserver or with "reduce motion" on, content is simply shown.
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const TARGETS='#view>*,.waste-choice,.home-activities>.card,.home-guides>.card,.week-days li';
let io=null;

export function revealOnScroll(){
  io?.disconnect();io=null;
  if(reduce.matches||!('IntersectionObserver' in window))return;
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
  const root=document.documentElement;let queued=false;
  const update=()=>{
    queued=false;
    const y=window.scrollY,max=Math.max(1,root.scrollHeight-window.innerHeight);
    document.querySelector('aside')?.style.setProperty('--progress',Math.min(1,Math.max(0,y/max)).toFixed(4));
    const art=document.querySelector('.hero-deco');
    if(art)art.style.setProperty('--sy',reduce.matches?'0':String(Math.min(Math.round(y),1200)));
  };
  const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(update);}};
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  window.addEventListener('hashchange',schedule);
  schedule();
}
