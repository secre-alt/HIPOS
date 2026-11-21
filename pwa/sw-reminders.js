self.addEventListener('periodicsync',event=>{if(event.tag==='hipos-daily')event.waitUntil((async()=>{
  const cache=await caches.open('hipos-reminder-v1'),hit=await cache.match('state');if(!hit)return;
  const s=await hit.json(),now=new Date(),id=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  const [h,m]=String(s.time).split(':').map(Number);
  if(!s.on||!s.notify||!Array.isArray(s.days)||!s.days.includes(now.getDay()))return;
  if(now.getHours()*60+now.getMinutes()<h*60+m||s.doneDay===id||s.lastShown===id||s.snooze===id)return;
  await self.registration.showNotification(s.title,{body:s.body,tag:'hipos-daily',icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',actions:s.open?[{action:'open',title:s.open}]:[],data:{url:'./'}});
  s.lastShown=id;await cache.put('state',new Response(JSON.stringify(s),{headers:{'content-type':'application/json'}}));
})());});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{
  const all=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const c of all){if('focus' in c){await c.focus();return;}}
  await self.clients.openWindow('./');
})());});
