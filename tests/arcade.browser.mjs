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
      await expect(page.locator('.compost-legend')).toBeVisible();
      await expect(page.locator('#compost-hud')).toBeHidden();
      await page.screenshot({path:`test-results/arcade-compost-ready-${width}-${theme}.png`,fullPage:true});
      await page.locator('[data-compost-start]').click();
      await expect(page.locator('#compost-hud')).toBeVisible();
      await page.locator('.compost-item svg').first().waitFor();
      await page.locator('#compost-hud [data-compost-pause]').click();
      await expect(page.locator('.compost-paused button')).toBeFocused();
    }
    await page.screenshot({path:`test-results/arcade-${route}-${width}-${theme}.png`,fullPage:true});
  }
  // Deterministic placement lets us exercise a whole round without changing game code.
  await page.evaluate(()=>{Math.random=()=>0.5;location.hash='compost';});
  await page.locator('[data-compost-start]').waitFor();
  await page.clock.install();
  await page.locator('[data-compost-start]').click();
  await page.clock.runFor(5000);
  await expect(page.locator('#compost-status strong')).toHaveText(/Eggshell|Leftover rice/);
  assert.equal(await page.locator('.hipos-avatar.do-hop,.hipos-avatar.do-nod,.hipos-avatar.do-spin').count(),0,'reduced motion skips Buddy reactions');
  assert.ok(Number(await page.locator('#compost-progress').getAttribute('value'))>0,'progress counts resolved items');
  await page.clock.runFor(22000);
  await expect(page.locator('.compost-done h3')).toHaveText('You caught 18 of 18 compostable scraps.');
  await expect(page.locator('.compost-done .garden-growth')).toContainText('Sunflower · Sprout');
  await page.screenshot({path:'test-results/arcade-compost-growth.png',fullPage:true});
  assert.equal(await page.locator('#compost-progress').getAttribute('value'),'18');
  await page.locator('[data-compost-start]').click();
  assert.equal(await page.locator('#compost-progress').getAttribute('value'),'0','replay resets progress');
  for(let i=0;i<5;i++)await page.locator('[data-compost-left]').click();
  await page.clock.runFor(6000);
  await expect(page.locator('#compost-status span')).toHaveText('This scrap can be composted. Try catching it next time.');
  await page.clock.runFor(21000);
  await expect(page.locator('.compost-done h3')).toHaveText('You caught 0 of 18 compostable scraps.');
  await expect(page.locator('.compost-done')).toContainText('Good practice. Try another round.');
  await expect(page.locator('.compost-done .garden-growth')).toContainText('Sunflower · In bloom');
  await page.evaluate(()=>{Math.random=()=>0.9;});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('[data-compost-start]').click();
  const field=await page.locator('#compost-field').boundingBox();
  await page.locator('#compost-field').dispatchEvent('pointerdown',{clientX:field.x+field.width*0.836,clientY:field.y+100});
  await page.clock.runFor(4500);
  assert.ok(await page.locator('.hipos-avatar.do-nod').count()>0,'plastic catch gives a gentle nod');
  await expect(page.locator('#compost-status strong')).toHaveText(/Plastic spoon|Plastic wrapper/);
  await expect(page.locator('#compost-status span')).toHaveText('Keep plastic out of compost. Use a dry-waste pouch only when clean and dry.');
  await page.evaluate(()=>{const language=document.querySelector('#language');language.value='fil';language.dispatchEvent(new Event('change'));});
  await expect(page.locator('#compost-status strong')).toHaveText(/Plastik na kutsara|Plastik na balot/);
  await expect(page.locator('#compost-progress')).toHaveAttribute('aria-label','Usad ng round');
  await expect(page.locator('#compost-status span')).toContainText('kung malinis at tuyo');
  await page.evaluate(()=>{const language=document.querySelector('#language');language.value='en';language.dispatchEvent(new Event('change'));});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>{location.hash='sort';});
  await page.locator('#sort-game').waitFor();
  const missed=[];
  for(let i=0;i<6;i++) {
    const title=await page.locator('.sort-item strong').innerText();
    // Always choose the pouch: a balanced round guarantees three missed items.
    await page.locator('[data-sort-bin="yes"]').click();
    if(await page.locator('.sort-bin.is-wrong').count())missed.push(title);
    await page.locator('[data-sort-next]').click();
  }
  await page.locator('.sort-review summary').click();
  assert.equal(missed.length,3);
  assert.deepEqual(await page.locator('.sort-review li strong').allTextContents(),missed);
  await expect(page.locator('.sort-done .garden-growth')).toContainText('Tulip · Sprout');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hipos.buddy.v1')));
  assert.deepEqual([saved.compost,saved.sorts,saved.treats],[2,1,2],'replays award rounds with only one daily treat per game');
  await page.screenshot({path:'test-results/arcade-sort-review.png',fullPage:true});
  await page.locator('[data-sort-again]').click();
  assert.equal(await page.locator('.sort-review').count(),0,'review clears on replay');
  await page.evaluate(()=>{location.hash='garden';});
  await expect(page.locator('.garden-next')).toContainText('1 care point to the next bloom');
  await expect(page.locator('.garden-next strong')).toHaveText('Tulip');
  await expect(page.locator('.garden-next progress')).toHaveAttribute('value','2');
  await page.evaluate(()=>{const language=document.querySelector('#language');language.value='fil';language.dispatchEvent(new Event('change'));});
  await expect(page.locator('.garden-next')).toContainText('1 puntos ng pag-aalaga');
  await expect(page.locator('.garden-next progress')).toHaveAttribute('aria-label','Usad sa susunod na pamumulaklak');
  await page.evaluate(()=>{const language=document.querySelector('#language');language.value='en';language.dispatchEvent(new Event('change'));});
  await page.evaluate(()=>{localStorage.setItem('hipos.buddy.v1',JSON.stringify({treats:27}));});
  await page.reload();
  await expect(page.locator('.garden-plot[data-stage="3"]')).toHaveCount(9);
  assert.equal(await page.locator('.garden-next progress').count(),0,'full garden has no next-bloom meter');
  assert.equal(new Set(await page.locator('.garden-icon svg').evaluateAll(nodes=>nodes.map(n=>n.innerHTML))).size,9,'every plant has distinct bloom art');
  for(const width of [390,1280])for(const theme of ['light','dark']) {
    await page.setViewportSize({width,height:844});
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'full garden fits');
    await page.screenshot({path:`test-results/garden-blooms-${width}-${theme}.png`,fullPage:true});
  }
  console.log('PASS: full catch/miss rounds, progress reset, plastic guidance, Filipino feedback, and sorting review');
  assert.deepEqual(errors,[]);
  console.log('PASS: all four arcade routes at mobile/desktop widths in both themes');
} finally {await browser?.close();server.kill();}
