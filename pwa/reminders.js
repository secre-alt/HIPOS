// Daily reminder: best-effort, private, and entirely on this device (no push server).
//  1. an in-app nudge on Home when the reminder time has passed and nothing was done today,
//  2. a repeating calendar file made on the device (the only exact-time option when the app is closed),
//  3. local notifications while the app is running, or woken by Periodic Background Sync where the browser allows it.
import {translate} from './i18n.js';

export const REMINDER_KEY='hipos.reminder.v1';
export const STATE_CACHE='hipos-reminder-v1';
export const DEFAULTS={on:false,time:'07:30',days:[1,2,3,4,5],notify:false,snooze:'',lastShown:''};
const TIME=/^([01]\d|2[0-3]):[0-5]\d$/;
const dayId=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const minutes=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};

export function sanitize(raw){
  const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const days=Array.isArray(r.days)?[...new Set(r.days.filter(n=>Number.isInteger(n)&&n>=0&&n<=6))].sort():DEFAULTS.days;
  const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:'';
  return {on:r.on===true,time:typeof r.time==='string'&&TIME.test(r.time)?r.time:DEFAULTS.time,days,notify:r.notify===true,snooze:date(r.snooze),lastShown:date(r.lastShown)};
}
export function readPrefs(storage=globalThis.localStorage){
  try{return sanitize(JSON.parse(storage.getItem(REMINDER_KEY)||'null'));}catch{return sanitize(null);}
}
export function savePrefs(prefs,storage=globalThis.localStorage){
  try{storage.setItem(REMINDER_KEY,JSON.stringify(sanitize(prefs)));return true;}catch{return false;}
}
// Should a reminder show right now? A day with any activity, a snooze, or an earlier reminder today stays quiet.
export function isDue(prefs,now=new Date(),activeToday=false){
  const p=sanitize(prefs),today=dayId(now);
  if(!p.on||activeToday||!p.days.includes(now.getDay()))return false;
  if(p.snooze===today)return false;
  return now.getHours()*60+now.getMinutes()>=minutes(p.time);
}
export const dueForNotification=(prefs,now,activeToday)=>isDue(prefs,now,activeToday)&&sanitize(prefs).notify&&sanitize(prefs).lastShown!==dayId(now);

const ICS_DAYS=['SU','MO','TU','WE','TH','FR','SA'];
const pad=n=>String(n).padStart(2,'0');
const escapeText=s=>String(s).replace(/\\/g,'\\\\').replace(/;/g,'\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
// A repeating all-device calendar event with an alert at the chosen time (floating local time, no server involved).
export function buildIcs(prefs,now=new Date(),text={title:'HIPOS: one small thing today',body:'Small choices add up. Open HIPOS for today\'s challenge.'}){
  const p=sanitize(prefs),days=p.days.length?p.days:DEFAULTS.days,[h,m]=p.time.split(':').map(Number);
  const stamp=`${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const start=`${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}T${pad(h)}${pad(m)}00`;
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HIPOS//Daily reminder//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:daily-reminder@hipos.local',`DTSTAMP:${stamp}`,`DTSTART:${start}`,'DURATION:PT5M',`RRULE:FREQ=WEEKLY;BYDAY=${days.map(d=>ICS_DAYS[d]).join(',')}`,`SUMMARY:${escapeText(text.title)}`,`DESCRIPTION:${escapeText(text.body)}`,'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${escapeText(text.title)}`,'TRIGGER:PT0S','END:VALARM','END:VEVENT','END:VCALENDAR'];
  return lines.join('\r\n')+'\r\n';
}

// ---------- browser side ----------
const supportsNotify=()=>typeof Notification!=='undefined'&&'serviceWorker' in navigator;
const permission=()=>supportsNotify()?Notification.permission:'unsupported';
const noticeText=()=>({title:translate('HIPOS: one small thing today'),body:translate('Small choices add up. Open HIPOS for today\'s challenge.')});
const DAY_LABELS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// The service worker cannot read localStorage, so it gets a copy in the Cache API.
export async function syncWorkerState(prefs,openDay){
  try{
    if(!('caches' in globalThis))return;
    const cache=await caches.open(STATE_CACHE);
    await cache.put('state',new Response(JSON.stringify({...sanitize(prefs),openDay,...noticeText()}),{headers:{'content-type':'application/json'}}));
  }catch{/* reminders still work while the app is open */}
}
async function registerPeriodic(on){
  try{
    const reg=await navigator.serviceWorker.ready;
    if(!reg.periodicSync)return false;
    if(on){await reg.periodicSync.register('hipos-daily',{minInterval:12*60*60*1000});}
    else{await reg.periodicSync.unregister('hipos-daily');}
    return on;
  }catch{return false;}
}
async function showNotice(){
  const reg=await navigator.serviceWorker.ready;
  await reg.showNotification(noticeText().title,{body:noticeText().body,tag:'hipos-daily',icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',data:{url:'./'}});
}

export function renderSetting(){
  return `<div class="reminder-card" id="reminder-card"><h4>Daily reminder</h4>
<label class="a11y-toggle"><input type="checkbox" id="reminder-on"><span>Remind me to do one small thing</span></label>
<div id="reminder-options" hidden>
<label class="language-control" for="reminder-time">Time<input type="time" id="reminder-time" required></label>
<div class="reminder-days" role="group" aria-labelledby="reminder-days-label"><p id="reminder-days-label" class="a11y-label">Days</p><div>${DAY_LABELS.map((d,i)=>`<label class="reminder-day"><input type="checkbox" data-reminder-day="${i}"><span>${d}</span></label>`).join('')}</div></div>
<p class="note">Reminders are best-effort. They stay on this device and use no account. Phones and notifications may not be allowed during class.</p>
<div class="actions"><button type="button" class="secondary" id="reminder-notify">Turn on notifications</button><button type="button" class="secondary" id="reminder-test" hidden>Send a test notification</button><button type="button" class="secondary" id="reminder-ics">Add to my calendar</button><button type="button" class="secondary" id="reminder-snooze">Snooze today</button></div>
<p id="reminder-status" role="status"></p></div></div>`;
}

export function initReminders({mount,deliver,activeToday,message}){
  if(!mount)return {tick(){}};
  mount.innerHTML=renderSetting();
  const $=s=>mount.querySelector(s);
  let prefs=readPrefs(),today=dayId(new Date());
  const status=t=>{$('#reminder-status').textContent=t?translate(t):'';};
  const persist=()=>{if(!savePrefs(prefs)){status('Could not save this setting. It will reset when you close the app.');}syncWorkerState(prefs,today);};
  const paint=()=>{
    $('#reminder-on').checked=prefs.on;$('#reminder-options').hidden=!prefs.on;$('#reminder-time').value=prefs.time;
    mount.querySelectorAll('[data-reminder-day]').forEach(b=>{b.checked=prefs.days.includes(Number(b.dataset.reminderDay));});
    const perm=permission(),btn=$('#reminder-notify');
    btn.hidden=perm==='unsupported';
    btn.textContent=translate(perm==='granted'&&prefs.notify?'Notifications are on':'Turn on notifications');
    btn.setAttribute('aria-pressed',String(perm==='granted'&&prefs.notify));
    $('#reminder-test').hidden=!(perm==='granted'&&prefs.notify);
    $('#reminder-snooze').disabled=prefs.snooze===today;
  };
  $('#reminder-on').addEventListener('change',e=>{prefs={...prefs,on:e.target.checked};if(!prefs.on)registerPeriodic(false);persist();paint();});
  $('#reminder-time').addEventListener('change',e=>{if(TIME.test(e.target.value)){prefs={...prefs,time:e.target.value};persist();}else{e.target.value=prefs.time;}});
  mount.querySelectorAll('[data-reminder-day]').forEach(b=>b.addEventListener('change',()=>{
    const days=[...mount.querySelectorAll('[data-reminder-day]')].filter(x=>x.checked).map(x=>Number(x.dataset.reminderDay));
    if(!days.length){b.checked=true;status('Pick at least one day.');return;}
    status('');prefs={...prefs,days};persist();
  }));
  $('#reminder-snooze').addEventListener('click',()=>{prefs={...prefs,snooze:today};persist();paint();status('Snoozed. No reminder until tomorrow.');document.querySelector('.reminder-nudge')?.remove();});
  $('#reminder-ics').addEventListener('click',async()=>{
    const file=new File([buildIcs(prefs)],'hipos-daily-reminder.ics',{type:'text/calendar'});
    const ok=await deliver(file,'HIPOS daily reminder');
    if(ok)status('Calendar file saved. Open it to add the repeating reminder.');
  });
  $('#reminder-notify').addEventListener('click',async()=>{
    if(!supportsNotify()){status('This browser cannot show notifications. Use the calendar file instead.');return;}
    if(prefs.notify&&permission()==='granted'){prefs={...prefs,notify:false};persist();await registerPeriodic(false);paint();status('Notifications are off.');return;}
    let result=permission();
    if(result==='default'){try{result=await Notification.requestPermission();}catch{result='denied';}}
    if(result==='granted'){
      prefs={...prefs,notify:true};persist();const periodic=await registerPeriodic(true);paint();
      const installed=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
      status(periodic&&!installed?'Add HIPOS to your home screen so the browser can send reminders in the background.':periodic?'Notifications are on, even when the app is closed (the browser decides the exact time).':'Notifications are on while HIPOS is open. For an exact time, add it to your calendar.');
    }else{prefs={...prefs,notify:false};persist();paint();status('Notifications are blocked in this browser. You can use the calendar file instead.');}
  });
  $('#reminder-test').addEventListener('click',async()=>{
    if(permission()!=='granted'){status('Could not show a notification. Check that notifications are allowed for HIPOS.');return;}
    try{await showNotice();status('Test sent. If you did not see it, check your phone’s notification settings for HIPOS or your browser.');}
    catch{status('Could not show a notification. Check that notifications are allowed for HIPOS.');}
  });
  paint();syncWorkerState(prefs,today);
  async function tick(){
    const now=new Date();today=dayId(now);prefs=readPrefs();
    if(!dueForNotification(prefs,now,activeToday()))return;
    if(permission()!=='granted')return;
    try{await showNotice();prefs={...prefs,lastShown:today};savePrefs(prefs);syncWorkerState(prefs,today);}catch{message?.('');}
  }
  tick();setInterval(tick,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  return {tick,prefs:()=>prefs};
}
// Home nudge shown inside the app when the reminder is due (works without notification permission).
export function nudgeHtml(activeToday,now=new Date(),storage=globalThis.localStorage){
  const prefs=readPrefs(storage);
  if(!isDue(prefs,now,activeToday))return '';
  return `<p class="reminder-nudge" role="status"><span>Ready for today? One small choice is waiting.</span> <button type="button" data-daily-target="challenge-heading">Show me</button> <button type="button" class="secondary" data-reminder-snooze>Not now</button></p>`;
}
export function snoozeToday(storage=globalThis.localStorage,now=new Date()){
  const prefs=readPrefs(storage);savePrefs({...prefs,snooze:dayId(now)},storage);
}
