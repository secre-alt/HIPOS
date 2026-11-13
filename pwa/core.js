export const categories=['Unclear disposal guidance','Excessive packaging','Unsafe waste concern','Reusable-container concern','Other'];
export const areas=['Prefer not to say','Canteen','Classroom','Hallway','Other area'];
export const statuses=['New','Under Review','Reviewed'];
const bytes=s=>new TextEncoder().encode(s).length;
export function decodeReport(raw,now=Date.now()) {
  if(typeof raw!=='string'||bytes(raw)>650) throw Error('Report must be no larger than 650 bytes.');
  const r=JSON.parse(raw);
  if(!r||r.type!=='HIPOS1'||typeof r.id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(r.id)) throw Error('Not a valid HIPOS report.');
  if(!categories.includes(r.category)||!areas.includes(r.area)) throw Error('Unknown category or school area.');
  if(typeof r.description!=='string'||r.description.length<5||r.description.length>160||bytes(r.description)>300||/[\u0000-\u0009\u000b-\u001f\u007f-\u009f]/.test(r.description)) throw Error('Use 5–160 characters, at most 300 UTF-8 bytes, without control characters.');
  if(!Number.isSafeInteger(r.createdAt)||r.createdAt<1577836800000||r.createdAt>now+86400000) throw Error('Invalid report date.');
  return {type:'HIPOS1',id:r.id,category:r.category,area:r.area,description:r.description,createdAt:r.createdAt};
}
export function createReport(category,area,description) {return decodeReport(JSON.stringify({type:'HIPOS1',id:crypto.randomUUID(),category,area,description:description.trim(),createdAt:Date.now()}));}
export function addImport(records,report){if(records.some(r=>r.id===report.id))throw Error('This report has already been imported.');return [{...report,status:'New'},...records];}
export const escapeHTML=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function pinHash(pin,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new Uint8Array(salt),iterations:210000,hash:'SHA-256'},key,256);return Array.from(new Uint8Array(bits));}
