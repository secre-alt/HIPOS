import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';

const server=spawn(process.execPath,['scripts/serve-pwa.mjs'],{windowsHide:true,stdio:'pipe',env:{...process.env,PORT:'4186'}});
let browser;
try {
  await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('http://localhost'))resolve();});server.once('exit',c=>reject(Error('Server exited '+c)));server.stderr.on('data',d=>process.stderr.write(d));});
  browser=await chromium.launch({channel:process.env.PW_CHANNEL||'msedge',headless:true});
  const page=await browser.newPage({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await mkdir('test-results',{recursive:true});
  await page.goto('http://localhost:4186');
  for(const width of [390,1280])for(const theme of ['light','dark'])for(const route of ['games','sort','compost','garden']) {
    await page.setViewportSize({width,height:844});
    await page.evaluate(({theme,route})=>{document.documentElement.dataset.theme=theme;location.hash=route;},{theme,route});
    await page.locator(route==='games'?'.games-grid':route==='sort'?'#sort-game':route==='compost'?'#compost-game':'#garden').waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route}: no overflow at ${width} / ${theme}`);
    if(route==='sort')assert.equal(await page.locator('.round-markers span').count(),6);
    if(route==='compost') {
      await page.locator('[data-compost-start]').click();
      await page.locator('.compost-item svg').first().waitFor();
      await page.locator('.arcade-toolbar [data-compost-pause]').click();
      await expect(page.locator('.compost-paused button')).toBeFocused();
    }
    await page.screenshot({path:`test-results/arcade-${route}-${width}-${theme}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: all four arcade routes at mobile/desktop widths in both themes');
} finally {await browser?.close();server.kill();}
