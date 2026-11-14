import test from 'node:test';
import assert from 'node:assert/strict';
import {createReport,buildBackup,parseBackup,BACKUP_TYPE,categories,areas} from '../pwa/core.js';
const make=(text='Please clarify the handling instructions.',age=0)=>{const r=createReport(categories[0],areas[1],text);return age?{...r,createdAt:r.createdAt-age}:r;};

test('backup contains only protocol fields and never a PIN or staff data',()=>{
  const dirty={...make(),status:'Reviewed',pin:{salt:[1],hash:[2]},extra:'x'};
  const backup=buildBackup([dirty]);
  assert.equal(backup.type,BACKUP_TYPE);assert.equal(backup.version,1);
  assert.deepEqual(Object.keys(backup.reports[0]).sort(),['area','category','createdAt','description','id','type']);
  assert.ok(!JSON.stringify(backup).includes('salt'));
});
test('backup skips stored reports that would not pass import',()=>{
  const backup=buildBackup([make(),{...make(),category:'Made up'},{id:'nope'}]);
  assert.equal(backup.reports.length,1);
});
test('restore round-trips and orders newest first',()=>{
  const older=make('Older concern about the canteen.',5000),newer=make('Newer concern about the hallway.');
  const result=parseBackup(JSON.stringify(buildBackup([older,newer])),[]);
  assert.equal(result.added,2);assert.deepEqual(result.reports.map(r=>r.id),[newer.id,older.id]);
});
test('restore skips reports already on the device and keeps existing ones',()=>{
  const have=make('Already here on this device.'),fresh=make('Brand new concern from the file.',1000);
  const result=parseBackup(JSON.stringify(buildBackup([have,fresh])),[have]);
  assert.equal(result.added,1);assert.equal(result.duplicate,1);assert.equal(result.reports.length,2);
});
test('restore re-validates every report and counts the unreadable ones',()=>{
  const good=make(),file=JSON.parse(JSON.stringify(buildBackup([good])));
  file.reports.push({...make(),area:'Nowhere'},{...make(),description:'tiny'},{...make(),createdAt:4102444800000},'garbage',null);
  const result=parseBackup(JSON.stringify(file),[]);
  assert.equal(result.added,1);assert.equal(result.invalid,5);
});
test('restore ignores extra fields a hand-edited file might carry',()=>{
  const file=JSON.parse(JSON.stringify(buildBackup([make()])));file.reports[0].status='Reviewed';file.reports[0].admin=true;
  const [r]=parseBackup(JSON.stringify(file),[]).reports;
  assert.equal(r.status,undefined);assert.equal(r.admin,undefined);
});
test('restore rejects files that are not HIPOS backups',()=>{
  const bad=['','not json','{}','[]','null','{"type":"HIPOS-BACKUP","version":2,"reports":[]}','{"type":"HIPOS-BACKUP","version":1,"reports":"x"}','{"type":"other","version":1,"reports":[]}',JSON.stringify({type:BACKUP_TYPE,version:1,reports:Array(1001).fill({})}),'x'.repeat(1000001)];
  for(const raw of bad)assert.throws(()=>parseBackup(raw,[]),/not a HIPOS backup/,raw.slice(0,30));
  assert.throws(()=>parseBackup(undefined,[]),/not a HIPOS backup/);
});
