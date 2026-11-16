import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync('pwa/theme.js','utf8');
function setup(saved,matches=false,blocked=false){
  const events={},media={matches,addEventListener:(_,fn)=>events.system=fn};
  const select={value:'',addEventListener:(_,fn)=>events.select=fn};
  const root={dataset:{}},notice={},meta={};
  let stored=saved;
  runInNewContext(source,{
    matchMedia:()=>media,addEventListener:(name,fn)=>events[name]=fn,
    localStorage:{getItem:()=>{if(blocked)throw Error();return stored;},setItem:(_,value)=>{if(blocked)throw Error();stored=value;}},
    document:{documentElement:root,querySelectorAll:()=>[meta],querySelector:s=>s==='#appearance'?select:notice,addEventListener:(name,fn)=>events[name]=fn}
  });
  events.DOMContentLoaded();
  return {events,media,select,root,notice,meta,saved:()=>stored};
}
test('system default follows live device changes; explicit choices override them and save',()=>{
  const app=setup(null,true);
  assert.equal(app.select.value,'system');assert.equal(app.root.dataset.theme,'dark');
  app.select.value='light';app.events.select();
  assert.equal(app.saved(),'light');assert.equal(app.root.dataset.theme,'light');
  app.events.system();assert.equal(app.root.dataset.theme,'light');
  app.select.value='system';app.events.select();
  app.media.matches=false;app.events.system();assert.equal(app.root.dataset.theme,'light');
  app.media.matches=true;app.events.system();assert.equal(app.root.dataset.theme,'dark');
  assert.equal(app.meta.content,'#07201a');
});
test('saved choices restore, invalid choices fall back, and blocked storage still allows switching',()=>{
  assert.equal(setup('dark').root.dataset.theme,'dark');
  assert.equal(setup('light',true).root.dataset.theme,'light');
  assert.equal(setup('invalid',true).select.value,'system');
  const app=setup(null,false,true);app.select.value='dark';app.events.select();
  assert.equal(app.root.dataset.theme,'dark');assert.match(app.notice.textContent,/could not be saved/);
});
