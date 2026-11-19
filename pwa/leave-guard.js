// Asks before an in-app link throws away a game round that is in progress.
// Only links inside the app are checked; the browser's own Back button and reloads are left alone.
export function shouldAsk(href,currentHash,active){
  if(!active||typeof href!=='string'||!href.startsWith('#'))return false;
  return href!==(currentHash||'#')&&href!=='#'+(currentHash||'').replace(/^#/,'');
}
function ask(onLeave){
  const d=document.createElement('dialog');d.className='leave-dialog';d.setAttribute('aria-labelledby','leave-title');
  d.innerHTML='<h2 id="leave-title">Leave this round?</h2><p>Your progress in this round will be lost.</p><div class="actions"><button type="button" data-leave-stay>Keep playing</button><button type="button" class="secondary" data-leave-go>Leave</button></div>';
  document.body.append(d);
  const done=()=>{d.close();d.remove();};
  d.addEventListener('click',e=>{if(e.target.closest('[data-leave-stay]'))done();else if(e.target.closest('[data-leave-go]')){done();onLeave();}});
  d.addEventListener('cancel',()=>{d.remove();});
  if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
  d.querySelector('[data-leave-stay]')?.focus();
}
export function initLeaveGuard(isActive){
  document.addEventListener('click',event=>{
    const a=event.target.closest?.('a[href^="#"]');if(!a||event.defaultPrevented||event.button>0||event.metaKey||event.ctrlKey)return;
    const href=a.getAttribute('href');
    if(!shouldAsk(href,location.hash,isActive()))return;
    event.preventDefault();
    ask(()=>{location.hash=href;});
  },true);
}
