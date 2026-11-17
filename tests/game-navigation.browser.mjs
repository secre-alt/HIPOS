import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['scripts/serve-pwa.mjs'],{windowsHide:true,env:{...process.env,PORT:'4190'},stdio:['ignore','pipe','inherit']});let browser;
try {
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('http://localhost'))resolve();});server.once('exit',c=>reject(Error('Server exited '+c)));});
 browser=await chromium.launch({channel:process.env.PW_CHANNEL||'msedge',headless:true});
 for(const width of [390,1280])for(const theme of ['light','dark'])for(const language of ['en','fil']) {
  const context=await browser.newContext({viewport:{width,height:844},colorScheme:theme,reducedMotion:'reduce'}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(lang=>localStorage.setItem('hipos.language',lang),language);
  await page.goto('http://localhost:4190/#sort');
  for(const [route,back,next] of [['sort','games','compost'],['compost','sort','garden'],['garden','compost','games']]) {
   await page.waitForFunction(route=>location.hash==='#'+route,route);
   const nav=page.locator('.game-pagination');await nav.waitFor();
   assert.deepEqual(await nav.locator('a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href'))),['#'+back,'#'+next]);
   await nav.scrollIntoViewIfNeeded();
   for(const link of await nav.locator('a').all()) {const r=await link.boundingBox();assert.ok(r.height>=44&&r.width>=44);assert.ok(r.x>=0&&r.x+r.width<=width+1);}
   if(language==='fil')assert.ok((await nav.innerText()).includes('Bumalik'));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await nav.locator('a').first().focus();await page.keyboard.press('Enter');await page.waitForFunction(back=>location.hash==='#'+back,back);
   await page.evaluate(route=>location.hash=route,route);await page.waitForFunction(route=>location.hash==='#'+route,route);await nav.waitFor();
   await nav.locator('.game-proceed').focus();await page.keyboard.press('Enter');
   await page.waitForFunction(next=>location.hash==='#'+next,next);
  }
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS game navigation ${width}px ${theme} ${language}`);
 }
}finally{await browser?.close();server.kill();}
