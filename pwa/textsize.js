// Text size setting. Stored only on this device and applied with a data attribute on <html>
// (the CSS scales the root font size, and all type is in rem).
const KEY='hipos.textsize',sizes=['standard','large','xlarge'];
export function initTextSize(){
  const select=document.querySelector('#textsize');if(!select)return;
  let saved='standard';try{const v=localStorage.getItem(KEY);if(sizes.includes(v))saved=v;}catch{}
  const apply=v=>{if(v==='standard')delete document.documentElement.dataset.text;else document.documentElement.dataset.text=v;select.value=v;};
  apply(saved);
  select.addEventListener('change',()=>{
    const next=sizes.includes(select.value)?select.value:'standard';apply(next);
    try{localStorage.setItem(KEY,next);}catch{document.querySelector('#notice').textContent=document.documentElement.lang==='fil'?'Hindi na-save ang laki ng teksto. Subukan muli.':'Could not save text size. Try again.';}
  });
}
