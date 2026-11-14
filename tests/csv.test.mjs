import test from 'node:test';
import assert from 'node:assert/strict';
import {reportsToCsv} from '../pwa/core.js';
const row=(o={})=>({id:'3f2b6c0e-1111-4222-8333-444455556666',status:'New',category:'Other',area:'Canteen',description:'Please clarify the handling steps.',createdAt:Date.UTC(2026,10,14,4,30),...o});
const parse=csv=>csv.replace(/^\ufeff/,'').trim().split('\r\n').map(line=>{const cells=[];let cur='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(q){if(ch==='"'&&line[i+1]==='"'){cur+='"';i++;}else if(ch==='"')q=false;else cur+=ch;}else if(ch==='"')q=true;else if(ch===','){cells.push(cur);cur='';}else cur+=ch;}cells.push(cur);return cells;});
test('csv has a byte-order mark, a header, CRLF lines and ISO dates',()=>{
  const csv=reportsToCsv([row()]);
  assert.ok(csv.startsWith('\ufeff"Status","Category","School area","Description","Created","Report ID"\r\n'));
  const [, data]=parse(csv);assert.deepEqual(data,['New','Other','Canteen','Please clarify the handling steps.','2026-11-14T04:30:00.000Z','3f2b6c0e-1111-4222-8333-444455556666']);
});
test('csv keeps commas, quotes and Filipino text intact',()=>{
  const text='He said "hi", twice — Ano ang gagawin sa basura?';
  const [, data]=parse(reportsToCsv([row({description:text})]));assert.equal(data[3],text);
});
test('csv neutralises spreadsheet formulas',()=>{
  for(const bad of ['=SUM(1+1) test','+1 555 0100 call','-2+3 minutes late','@cmd something','\tTabbed value']){
    const [, data]=parse(reportsToCsv([row({description:bad})]));assert.ok(data[3].startsWith("'"),bad);assert.equal(data[3],"'"+bad);
  }
  const [, safe]=parse(reportsToCsv([row({description:'Equals = sign in the middle'})]));assert.equal(safe[3],'Equals = sign in the middle');
});
test('csv flattens line breaks and defaults the status',()=>{
  const [, data]=parse(reportsToCsv([row({description:'line one\nline two',status:undefined})]));assert.equal(data[3],'line one line two');assert.equal(data[0],'New');
});
test('csv of no reports is just the header',()=>{assert.equal(parse(reportsToCsv([])).length,1);});
