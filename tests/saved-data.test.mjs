import test from 'node:test';
import assert from 'node:assert/strict';
import {createReport,validateSavedData,categories,areas} from '../pwa/core.js';

const fixture=()=>({reports:[createReport(categories[0],areas[0],'Please clarify this guidance.')],imports:[],pin:null});

test('saved records keep protocol fields and valid staff status and PIN',()=>{
  const saved=fixture();
  saved.reports[0].extra='<img onerror="bad">';
  saved.imports=[{...saved.reports[0],status:'Reviewed'}];
  saved.pin={salt:Array(16).fill(3),hash:Array(32).fill(7),extra:true};
  const clean=validateSavedData(saved);
  assert.equal(clean.reports[0].extra,undefined);
  assert.equal(clean.imports[0].extra,undefined);
  assert.equal(clean.imports[0].status,'Reviewed');
  assert.deepEqual(clean.pin,{salt:Array(16).fill(3),hash:Array(32).fill(7)});
  assert.notEqual(clean.pin.salt,saved.pin.salt);
});

test('damaged storage is rejected without mutating or dropping original records',()=>{
  for(const corrupt of [
    s=>{s.reports.push(null);},
    s=>{s.reports[0].id='" onclick="bad';},
    s=>{s.reports[0].createdAt='invalid';},
    s=>{s.reports.push({...s.reports[0]});},
    s=>{s.imports=[{...s.reports[0],status:'Unknown'}];},
    s=>{s.pin={salt:[1],hash:[]};},
    s=>{s.pin={salt:Array(16).fill(-1),hash:Array(32).fill(0)};},
    s=>{delete s.pin;},
  ]){
    const saved=fixture();corrupt(saved);
    const before=JSON.stringify(saved);
    assert.throws(()=>validateSavedData(saved));
    assert.equal(JSON.stringify(saved),before);
  }
  for(const saved of [null,false,[],{}, {reports:[],imports:'bad',pin:null}])assert.throws(()=>validateSavedData(saved));
});
