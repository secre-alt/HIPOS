import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {waste,moreWaste} from '../pwa/content.js';
const server=spawn(process.execPath,['scripts/serve-pwa.mjs'],{windowsHide:true,env:{...process.env,PORT:'4189'},stdio:['ignore','pipe','inherit']});
let browser;
try {
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('http://localhost'))resolve();});server.once('exit',c=>reject(Error('Server exited '+c)));});
 browser=await chromium.launch({channel:process.env.PW_CHANNEL||'msedge',headless:true});await mkdir('test-results/sorting',{recursive:true});
 for(const [width,height] of [[390,844],[1280,720],[844,390],[320,568],[568,320]])for(const theme of ['light','dark'])for(const language of ['en','fil']) {
  const context=await browser.newContext({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(lang=>localStorage.setItem('hipos.language',lang),language);
  await page.goto('http://localhost:4189/#sort');await page.locator('#sort-item').waitFor();
  for(const correct of [true,false]) {
   const title=await page.locator('#sort-item strong').textContent();
   let yes;
   if(language==='en')yes=[...waste,...moreWaste].find(item=>item[0]===title)[1];
   else yes=true;
   const illustrations=await page.locator('.sort-bin-icon').evaluateAll(nodes=>nodes.map(node=>node.innerHTML));
   await page.locator(`[data-sort-bin="${(correct?yes:!yes)?'yes':'no'}"]`).click();
   await page.locator('#sort-feedback').waitFor({state:'visible'});
   assert.equal(await page.locator('.sort-answer-item').textContent(),title,'feedback names the item being reviewed');
   assert.ok((await page.locator('.sort-answer-destination').innerText()).length>0);
   assert.equal(await page.locator('.sort-explanation p').count(),1,'one guidance paragraph');
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   if(language==='en')assert.equal(await page.locator('.sort-bin.is-wrong').count(),correct?0:1);
   assert.deepEqual(await page.locator('.sort-bin-icon').evaluateAll(nodes=>nodes.map(node=>node.innerHTML)),illustrations,'destination illustrations remain visible after answering');
   assert.equal(await page.locator('.sort-choice-label').count(),1);assert.equal(await page.locator('.sort-answer-label').count(),1);
   assert.equal(await page.locator('#sort-item').evaluate(el=>getComputedStyle(el).opacity),'1');
   assert.ok(await page.locator('.sort-instruction').isHidden());
   await page.locator('#sort-answer-dialog[open]').waitFor();
   const next=await page.locator('#sort-next').boundingBox();
   const panel=await page.locator('.sort-answer-panel').boundingBox();
   assert.ok(panel.y>=0&&panel.y+panel.height<=height+1,'modal stays within viewport');
   assert.ok(next.y>=0&&next.y+next.height<=height+1,`Next visible at ${width}x${height}`);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow');
   assert.ok(await page.locator('.sort-explanation p').isVisible(),'guidance is visible immediately');
   assert.ok((await page.locator('.sort-explanation p').innerText()).length>15);
   assert.equal(await page.locator('.sort-explanation summary').count(),0);
   if(correct){await page.keyboard.press('Escape');assert.ok(await page.locator('#sort-answer-dialog').isHidden());
   await page.waitForFunction(()=>document.activeElement?.matches('[data-sort-review]'));
   assert.equal(await page.locator('[data-sort-review]').evaluate(el=>el===document.activeElement),true);
   await page.keyboard.press('Enter');await page.locator('#sort-answer-dialog[open]').waitFor();
   await page.keyboard.press('Tab');
   assert.equal(await page.locator('[data-sort-close]').evaluate(el=>el===document.activeElement),true,'Tab stays inside the modal');
   await page.locator('[data-sort-close]').click();
   await page.locator('[data-sort-review]').click();await page.locator('#sort-answer-dialog[open]').waitFor();
   assert.equal(await page.locator('.sort-choice-label').count(),1,'reviewing does not score the answer twice');
   await page.locator('#sort-next').click();assert.ok(await page.locator('.sort-instruction').isVisible());assert.equal(await page.locator('.sort-choice-label').count(),0);}
  }
  if(language==='en'&&width>=390)await page.screenshot({path:`test-results/sorting/${width}-${theme}.png`});
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS sorting feedback ${width}x${height} ${theme} ${language}`);
 }
 // Exercise every item title: long Filipino labels must fit the shortest layout too.
 for(const theme of ['light','dark'])for(const language of ['en','fil']) {
  const context=await browser.newContext({viewport:{width:568,height:320},colorScheme:theme,reducedMotion:'reduce'}),page=await context.newPage();
  await page.addInitScript(lang=>localStorage.setItem('hipos.language',lang),language);
  await page.goto('http://localhost:4189/#sort');await page.locator('#sort-item').waitFor();
  for(const [title] of [...waste,...moreWaste]) {
   await page.evaluate(title=>{document.querySelector('#sort-item strong').textContent=title;dispatchEvent(new Event('resize'));},title);
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
   const fits=await page.evaluate(()=>{
    const stage=document.querySelector('.sort-stage').getBoundingClientRect(),bins=document.querySelector('.sort-bins').getBoundingClientRect(),top=document.querySelector('aside').getBoundingClientRect().bottom,bottom=document.querySelector('.mobile-bottom-nav').getBoundingClientRect();
    return stage.top>=top-1&&bins.bottom<=(bottom.height?bottom.top:innerHeight)+1;
   });
   assert.ok(fits,'short landscape fits '+title+' '+theme+' '+language);
  }
  await context.close();console.log('PASS every item title in short landscape '+theme+' '+language);
 }
} finally {await browser?.close();server.kill();}
