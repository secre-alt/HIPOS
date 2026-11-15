// Font style setting. Stored only on this device and applied with data attributes on <html>.
// data-font picks the display font (headings, buttons, greeting bubble); data-font-all also
// uses it for body text. The font files are bundled with the app, so they work offline.
const KEY='hipos.font',ALL_KEY='hipos.font.all';
export const USE={default:'The standard HIPOS look.',lilita:'Bold and chunky: headings, greeting bubble, streak chips and buttons.',titan:'Even bolder: the logo, headings and big moments.',grandstander:'Playful and bouncy, still easy to read.',fredoka:'Cute but calm. A safe choice if bold feels too loud.',pixelify:'Retro pixels for small accents only, like the streak and badges.'};
export const FONTS=['default','lilita','titan','grandstander','fredoka','pixelify'];
export const normalizeFont=v=>FONTS.includes(v)?v:'default';
export function initFontStyle(){
  const group=document.querySelector('#font-options'),all=document.querySelector('#font-all');if(!group||!all)return;
  let font='default',everywhere=false;
  try{font=normalizeFont(localStorage.getItem(KEY));everywhere=localStorage.getItem(ALL_KEY)==='1';}catch{}
  const root=document.documentElement;
  const apply=()=>{
    if(font==='default')delete root.dataset.font;else root.dataset.font=font;
    if(font!=='default'&&everywhere)root.dataset.fontAll='';else delete root.dataset.fontAll;
    group.querySelectorAll('[data-font]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.font===font)));
    const current=document.querySelector('.font-current');if(current)current.textContent=group.querySelector('button[data-font="'+font+'"] .font-name')?.textContent||'Default';
    const use=document.querySelector('#font-use');if(use)use.textContent=USE[font]||'';
    all.checked=everywhere&&font!=='default';all.disabled=font==='default';
  };
  const save=()=>{try{localStorage.setItem(KEY,font);localStorage.setItem(ALL_KEY,everywhere?'1':'0');}catch{document.querySelector('#notice').textContent='Could not save font style. Try again.';}};
  apply();
  group.addEventListener('click',event=>{const button=event.target.closest('[data-font]');if(!button)return;font=normalizeFont(button.dataset.font);apply();save();});
  all.addEventListener('change',()=>{everywhere=all.checked;apply();save();});
}
