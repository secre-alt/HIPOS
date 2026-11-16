import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {FONTS,normalizeFont} from '../pwa/fontstyle.js';

test('unknown or damaged font choices fall back to the default font',()=>{
  for(const bad of [null,undefined,'',42,{},'comic','LILITA'])assert.equal(normalizeFont(bad),'default');
  for(const ok of FONTS)assert.equal(normalizeFont(ok),ok);
});
test('every font choice has a Settings button, a stack, and a bundled file',async()=>{
  const [entry,html]=await Promise.all([readFile('pwa/app.css','utf8'),readFile('pwa/index.html','utf8')]);
  const css=(await Promise.all([...entry.matchAll(/@import "(.+?)";/g)].map(([,path])=>readFile('pwa/'+path,'utf8')))).join('\n');
  for(const id of FONTS){
    assert.ok(html.includes(`data-font="${id}"`),`${id} button`);
    if(id==='default')continue;
    assert.ok(new RegExp(`html\\[data-font=${id}\\]\\s*\\{\\s*--font-display:`).test(css),`${id} font stack`);
    assert.ok(css.includes(`[data-font=${id}] .font-sample`),`${id} sample`);
  }
  for(const m of css.matchAll(/url\(\.\.\/fonts\/([a-z0-9-]+\.(?:woff2|ttf))\)/g))await access(`pwa/fonts/${m[1]}`);
  assert.equal([...css.matchAll(/@font-face/g)].length,FONTS.length);
});
test('font licenses ship with the fonts',async()=>{
  const text=await readFile('pwa/fonts/LICENSES.txt','utf8');
  for(const name of ['Lilita One','Titan One','Fredoka','Grandstander','Pixelify Sans'])assert.ok(text.includes(name),name);
  assert.match(text,/SIL OPEN FONT LICENSE/i);
});
