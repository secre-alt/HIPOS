import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const port=4187;
const server=spawn(process.execPath,['scripts/serve-pwa.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});
let browser;
try {
  await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('http://localhost'))resolve();});server.once('exit',c=>reject(Error('Server exited '+c)));});
  browser=await chromium.launch({channel:process.env.PW_CHANNEL||undefined,headless:true});
  await mkdir('test-results/nickname',{recursive:true});
  for(const width of [390,1280])for(const theme of ['light','dark']) {
    const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.goto(`http://localhost:${port}/#avatar`);
    const input=page.locator('#buddy-nickname');
    await input.fill('Luna');assert.equal(await page.locator('#buddy-nickname-count').innerText(),'4/24');await page.getByRole('button',{name:'Save nickname',exact:true}).click();
    await page.screenshot({path:`test-results/nickname/${width}-${theme}.png`});
    await page.getByRole('button',{name:'Use default name',exact:true}).click();
    assert.equal(await input.inputValue(),'');
    assert.equal(await page.locator('#buddy-nickname-count').innerText(),'0/24');
    await input.fill('Luna');await page.getByRole('button',{name:'Save nickname',exact:true}).click();
    await page.reload();await input.waitFor();assert.equal(await input.inputValue(),'Luna');
    await page.getByRole('button',{name:'Surprise me',exact:true}).click();assert.equal(await input.inputValue(),'Luna');
    await page.evaluate(()=>location.hash='home');await page.locator('#buddy-heading').waitFor();assert.equal(await page.locator('#buddy-heading').innerText(),'Luna');
    await page.evaluate(()=>{localStorage.setItem('hipos.language','fil');location.hash='avatar';});await page.reload();
    await page.getByRole('button',{name:'I-save ang palayaw',exact:true}).waitFor();assert.equal(await page.locator('#buddy-name').innerText(),'Luna');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
    await input.fill('');await page.getByRole('button',{name:'I-save ang palayaw',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#buddy-name').textContent==='Ang buddy mo');
    await context.close();console.log(`PASS nickname: ${width}px ${theme}`);
  }
  const context=await browser.newContext(),page=await context.newPage();
  await page.goto(`http://localhost:${port}/#avatar`);
  await page.locator('#buddy-nickname').fill('Luna');
  await page.getByRole('button',{name:'Save nickname',exact:true}).click();
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='hipos.buddy.nickname.v1')throw Error('blocked');return original.call(this,key,value);};});
  await page.locator('#buddy-nickname').fill('Nova');
  await page.getByRole('button',{name:'Save nickname',exact:true}).click();
  assert.equal(await page.locator('#buddy-name').innerText(),'Luna');
  assert.equal(await page.locator('#buddy-nickname').inputValue(),'Nova');
  assert.equal(await page.locator('#buddy-nickname').getAttribute('aria-invalid'),'true');
  assert.equal(await page.locator('#buddy-nickname-error').innerText(),'Your name was not saved. Try again.');
  await page.locator('#buddy-nickname').fill('Novi');
  assert.equal(await page.locator('#buddy-nickname-error').innerText(),'');
  await context.close();console.log('PASS nickname save failure preserves the saved name and the draft');
} finally {await browser?.close();server.kill();}
