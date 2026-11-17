import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const port=4187;
const server=spawn(process.execPath,['scripts/serve-pwa.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});
let browser;
try {
  await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('http://localhost'))resolve();});server.once('exit',c=>reject(Error('Server exited '+c)));});
  browser=await chromium.launch({channel:process.env.PW_CHANNEL||'msedge',headless:true});
  for(const width of [390,1280])for(const theme of ['light','dark']) {
    const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.goto(`http://localhost:${port}/#avatar`);
    const input=page.locator('#buddy-nickname');
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
} finally {await browser?.close();server.kill();}
