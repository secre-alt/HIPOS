// Easier viewing options: high contrast, easier reading (more spacing) and bigger touch targets.
// Each is a data attribute on <html> that the CSS reads. Saved only on this device; blocked storage still works for the session.
const PREFS={contrast:'hipos.a11y.contrast',reading:'hipos.a11y.reading',touch:'hipos.a11y.touch'};
export const prefNames=Object.keys(PREFS);
export function applyPref(name,on,root=document.documentElement){
  if(!PREFS[name])return;
  if(on)root.dataset[name]=name==='contrast'?'high':name==='reading'?'easy':'large';else delete root.dataset[name];
}
export function readPref(name,storage=globalThis.localStorage){
  try{return storage.getItem(PREFS[name])==='on';}catch{return false;}
}
export function initA11yPrefs(){
  document.querySelectorAll('[data-a11y]').forEach(box=>{
    const name=box.dataset.a11y;if(!PREFS[name])return;
    const on=readPref(name);box.checked=on;applyPref(name,on);
    box.addEventListener('change',()=>{
      applyPref(name,box.checked);
      try{localStorage.setItem(PREFS[name],box.checked?'on':'off');}
      catch{const n=document.querySelector('#notice');if(n)n.textContent='Could not save this setting. It will reset when you close the app.';}
    });
  });
}
// Apply saved choices before first paint so the page does not flash.
export function earlyApplyPrefs(){prefNames.forEach(n=>applyPref(n,readPref(n)));}
