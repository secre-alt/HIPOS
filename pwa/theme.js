// Run before the stylesheet so a saved appearance is applied before first paint.
(()=>{
  const key='hipos.appearance',root=document.documentElement;
  const system=matchMedia('(prefers-color-scheme: dark)');
  const normalize=value=>['light','dark'].includes(value)?value:'system';
  let preference='system';
  try{preference=normalize(localStorage.getItem(key));}catch{}
  const apply=()=>{
    const dark=preference==='dark'||(preference==='system'&&system.matches);
    root.dataset.theme=dark?'dark':'light';
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta=>{
      meta.content=dark?'#07201a':'#0b2f25';
    });
  };
  apply();
  system.addEventListener('change',apply);
  addEventListener('storage',event=>{
    if(event.key===key||event.key===null){
      preference=normalize(event.newValue);apply();
      const select=document.querySelector('#appearance');if(select)select.value=preference;
    }
  });
  document.addEventListener('DOMContentLoaded',()=>{
    const select=document.querySelector('#appearance');if(!select)return;
    select.value=preference;
    select.addEventListener('change',()=>{
      preference=normalize(select.value);apply();
      try{localStorage.setItem(key,preference);}catch{
        const notice=document.querySelector('#notice');
        if(notice)notice.textContent='Appearance changed, but could not be saved on this device.';
      }
    });
  });
})();
