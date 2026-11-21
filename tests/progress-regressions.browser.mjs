import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

const server=spawn(process.execPath,['scripts/serve-pwa.mjs'],{env:{...process.env,PORT:'4193'},windowsHide:true,stdio:'pipe'});
let browser;
try{
  await new Promise((resolve,reject)=>{
    server.stdout.on('data',data=>{if(data.toString().includes('HIPOS:'))resolve();});
    server.stderr.on('data',data=>process.stderr.write(data));
    server.once('exit',code=>reject(Error(`Server exited: ${code}`)));
  });
  browser=await chromium.launch({channel:process.env.PW_CHANNEL||undefined});
  for(const width of [390,1280])for(const colorScheme of ['light','dark'])for(const language of ['en','fil']){
    const context=await browser.newContext({viewport:{width,height:900},colorScheme,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.clock.install({time:new Date(2026,10,20,23,59)});
    await context.addInitScript(lang=>{
      localStorage.setItem('hipos.language',lang);
      localStorage.setItem('hipos.quiz.v2',JSON.stringify({ids:[0,1,2],answers:[0,1],position:2,day:'2026-11-20'}));
    },language);
    await page.goto('http://127.0.0.1:4193/');
    await page.locator('[data-answer="1"]').click();
    await expect(page.locator('#quiz-result')).toBeVisible();
    await page.clock.setFixedTime(new Date(2026,10,21,0,1));
    await page.locator('#quiz-result [data-quiz-next]').click();
    await expect(page.locator('#quiz-summary')).toHaveCount(0);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('hipos.quiz.v2')).day),'2026-11-21');
    assert.notEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('hipos.buddy.daily')||'{}').quizDay),'2026-11-21');
    // Refresh the overnight checklist, then block only reward writes.
    await page.reload();
    await page.evaluate(()=>{
      const setItem=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){if(key==='hipos.buddy.v1')throw new DOMException('Full','QuotaExceededError');return setItem.call(this,key,value);};
    });
    await page.locator('[data-habit="0"]').check();
    await expect(page.locator('.toast-text').filter({hasText:language==='en'?'Could not save your rewards':'Hindi ma-save ang iyong mga gantimpala'})).toBeVisible();
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(`PASS progress regressions: ${width}px, ${colorScheme}, ${language}`);
  }
}finally{await browser?.close();server.kill();}
