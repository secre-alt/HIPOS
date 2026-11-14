import {escapeHTML as e} from './core.js';
import {localDay} from './activities.js';
import {schoolInfo} from './school-info.js';

const key='hipos.activity.v1';
const challenges=[
  ['Plan your next snack','Choose an option with less packaging where available.'],
  ['Bring your own bottle','Pack a clean refillable bottle. Use only school-approved water sources.'],
  ['Check before you carry','Read the handling guide before putting waste in a pouch.'],
  ['Pack reusable utensils','Bring clean utensils where school rules permit.'],
  ['Keep reusables separate','Keep your food containers separate from any waste.'],
  ['Buy only what you need','Plan a portion you can finish to help prevent food waste.'],
  ['Give clean paper another use','Reuse clean, dry paper where practical.'],
];
export function challengeIndex(day=localDay()){
  const [year,month,date]=day.split('-').map(Number);
  return Math.floor(Date.UTC(year,month-1,date)/86400000)%challenges.length;
}
function read(){
  const saved=JSON.parse(localStorage.getItem(key)||'null');
  if(saved===null)return {days:{},recent:[]};
  if(!saved||typeof saved.days!=='object'||!saved.days||Array.isArray(saved.days)||!Array.isArray(saved.recent))throw Error('Invalid activity data');
  return saved;
}
function write(data){
  const cutoff=new Date();cutoff.setDate(cutoff.getDate()-35);
  data.days=Object.fromEntries(Object.entries(data.days).filter(([day])=>day>=localDay(cutoff)));
  localStorage.setItem(key,JSON.stringify(data));
}
export function recordChecklist(checked,previous){
  const data=read(),day=localDay();
  if(previous&&/^\d{4}-\d{2}-\d{2}$/.test(previous.day)&&Array.isArray(previous.checked)&&data.days[previous.day]?.habits===undefined)data.days[previous.day]={...data.days[previous.day],habits:previous.checked.slice(0,3).filter(value=>value===true).length};
  data.days[day]={...data.days[day],habits:checked.filter(Boolean).length};write(data);
}
export function dailyChallenge(){
  let state='',error='';
  try{state=read().days[localDay()]?.challenge||'';}catch{error='Activity history could not be read. Try again after checking browser storage.';}
  const [title,body]=challenges[challengeIndex()];
  return `<section class="card challenge-panel" data-day="${localDay()}" aria-labelledby="challenge-heading"><span class="guide-number">Today’s small challenge</span><h2 id="challenge-heading">${e(title)}</h2><p>${e(body)}</p><p class="muted">Optional. Choose what works for your school day.</p><div class="actions"><button data-challenge="done" aria-pressed="${state==='done'}">Mark complete</button><button class="secondary" data-challenge="skipped" aria-pressed="${state==='skipped'}">Skip today</button><button class="secondary" data-challenge="" ${state?'':'hidden'}>Undo</button></div><p id="challenge-feedback" role="status">${error||challengeFeedback(state)}</p></section>`;
}
function challengeFeedback(state){return state==='done'?'Completed today. A small choice worth remembering.':state==='skipped'?'Skipped today. Choose what works for you.':'';}
export function updateChallenge(button){
  const panel=button.closest('.challenge-panel');
  if(panel.dataset.day!==localDay()){panel.outerHTML=dailyChallenge();return;}
  try{
    const data=read(),day=localDay(),state=button.dataset.challenge;
    if(!['','done','skipped'].includes(state))return;
    data.days[day]={...data.days[day],challenge:state};write(data);
    panel.querySelectorAll('[data-challenge]').forEach(el=>{el.setAttribute('aria-pressed',String(el.dataset.challenge===state));if(el.dataset.challenge==='')el.hidden=!state;});
    panel.querySelector('#challenge-feedback').textContent=challengeFeedback(state);refreshWeekly();
  }catch{panel.querySelector('#challenge-feedback').textContent='Could not save your change. Browser storage may be unavailable. Try again.';}
}
export function weekly(){
  let data;try{data=read();}catch{return '<section id="weekly-activity" class="card"><h2>Your last seven days</h2><p>Activity history could not be read. Try again after checking browser storage.</p></section>';}
  const today=new Date(),days=[];
  // Include the old daily key so previously saved checklist work is not lost.
  try{const old=JSON.parse(localStorage.getItem('hipos.daily.v1')||'null');if(old&&Array.isArray(old.checked)&&/^\d{4}-\d{2}-\d{2}$/.test(old.day)&&data.days[old.day]?.habits===undefined)data.days[old.day]={...data.days[old.day],habits:old.checked.slice(0,3).filter(v=>v===true).length};}catch{}
  for(let offset=6;offset>=0;offset--){
    const day=new Date(today);day.setDate(today.getDate()-offset);
    const id=localDay(day),entry=data.days[id],active=entry?.habits>0||entry?.challenge==='done';
    days.push(`<li class="${active?'activity-done':''}"><time datetime="${id}">${day.getMonth()+1}/${day.getDate()}</time><span>${active?'Completed an action':entry?.challenge==='skipped'?'Challenge skipped':'No actions recorded'}</span></li>`);
  }
  return `<section id="weekly-activity" class="card" aria-labelledby="weekly-heading"><h2 id="weekly-heading">Your last seven days</h2><p>A private record of your choices on this device. Missing a day is okay.</p><ul class="week-days">${days.join('')}</ul><p class="note">This records completed actions, not environmental impact.</p></section>`;
}
export function refreshWeekly(){const panel=document.querySelector('#weekly-activity');if(panel)panel.outerHTML=weekly();}
const guides={prevent:'Prevent',reuse:'Reuse',classify:'Classify',carry:'Carry out'};
export function rememberGuide(page){
  if(!guides[page])return;
  try{const data=read();data.recent=[page,...data.recent.filter(id=>id!==page&&Object.hasOwn(guides,id))].slice(0,3);write(data);}catch{/* Browsing stays available when storage is unavailable. */}
}
export function recentGuides(){
  try{const recent=read().recent.filter(id=>Object.hasOwn(guides,id)).slice(0,3);return recent.length?`<section class="recent-guides" aria-labelledby="recent-heading"><h2 id="recent-heading">Pick up where you left off</h2><div class="actions">${recent.map(id=>`<a class="button-link secondary" href="#${id}"><span>Reopen guide</span>: <span>${guides[id]}</span></a>`).join('')}</div></section>`:'';}catch{return '';}
}
export function schoolSection(){
  const approved=schoolInfo.entries.filter(item=>item.status==='approved'&&item.title&&item.detail&&item.source&&item.reviewedOn&&item.approvedBy);
  return `<section class="card school-info" aria-labelledby="school-heading"><h2 id="school-heading">School information</h2>${approved.length?approved.map(item=>`<article><h3 data-no-translate lang="en">${e(item.title)}</h3><p data-no-translate lang="en">${e(item.detail)}</p><p class="note"><span>Approved by</span>: ${e(item.approvedBy)} · <span>Reviewed</span>: ${e(item.reviewedOn)}<br><span>Source</span>: ${e(item.source)}</p></article>`).join(''):'<span class="approval-label">Awaiting school approval</span><p>No school-specific procedures or contacts have been confirmed in this app.</p><p>Ask authorized school staff for current handling procedures and contacts. HIPOS does not identify a disposal destination.</p>'}</section>`;
}
