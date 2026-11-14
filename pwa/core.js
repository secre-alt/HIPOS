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
export const BACKUP_TYPE='HIPOS-BACKUP';
// A backup holds only the student's own reports. The staff PIN and imported reports are never included.
export function buildBackup(reports,now=new Date()){
  const valid=[];
  for(const r of reports){try{valid.push(decodeReport(JSON.stringify(r),now.getTime()));}catch{/* skip anything that would not pass import */}}
  return {type:BACKUP_TYPE,version:1,exportedAt:now.toISOString(),reports:valid};
}
// Every report is re-validated with the same rules as QR import, so a hand-edited or damaged file
// cannot add anything the app would not accept. Reports already on this device are skipped.
export function parseBackup(raw,existing=[],now=Date.now()){
  const notBackup='That file is not a HIPOS backup.';
  if(typeof raw!=='string'||raw.length>1000000)throw Error(notBackup);
  let file;try{file=JSON.parse(raw);}catch{throw Error(notBackup);}
  if(!file||file.type!==BACKUP_TYPE||file.version!==1||!Array.isArray(file.reports)||file.reports.length>1000)throw Error(notBackup);
  const seen=new Set(existing.map(r=>r.id)),added=[];let duplicate=0,invalid=0;
  for(const item of file.reports){
    let report;try{report=decodeReport(JSON.stringify(item),now);}catch{invalid++;continue;}
    if(seen.has(report.id)){duplicate++;continue;}
    seen.add(report.id);added.push(report);
  }
  return {reports:[...added,...existing].sort((a,b)=>b.createdAt-a.createdAt),added:added.length,duplicate,invalid};
}
export function addImport(records,report){if(records.some(r=>r.id===report.id))throw Error('This report has already been imported.');return [{...report,status:'New'},...records];}
export const escapeHTML=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function pinHash(pin,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new Uint8Array(salt),iterations:210000,hash:'SHA-256'},key,256);return Array.from(new Uint8Array(bits));}
