// One-time "How to play" tips. Each tip can be dismissed and stays dismissed on this device.
const KEY='hipos.howto.v1';
const TIPS={
  sort:'Drag the item onto a bin, or just tap a bin. Items you miss go to Review later so you can practice them.',
  compost:'Move the basket with the arrow keys, the Left and Right buttons, or by dragging. Catch food scraps and let plastic fall past.',
};
const seen=(storage=globalThis.localStorage)=>{try{const v=JSON.parse(storage.getItem(KEY)||'[]');return Array.isArray(v)?v:[];}catch{return [];}};
export function howTo(id,storage=globalThis.localStorage){
  if(!TIPS[id]||seen(storage).includes(id))return '';
  return `<div class="howto" role="note" data-howto="${id}" aria-label="How to play"><p><strong>How to play</strong> <span>${TIPS[id]}</span></p><button type="button" class="secondary" data-howto-dismiss="${id}">Got it</button></div>`;
}
export function dismissHowTo(id,storage=globalThis.localStorage){
  if(!TIPS[id])return;
  try{const list=seen(storage);if(!list.includes(id))storage.setItem(KEY,JSON.stringify([...list,id]));}catch{/* tip may show again */}
  document.querySelector(`[data-howto="${id}"]`)?.remove();
}
export const howToIds=Object.keys(TIPS);
