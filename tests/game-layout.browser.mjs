import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';

const audit=process.env.LAYOUT_AUDIT==='1';
const sizes=[[320,568],[360,640],[390,844],[430,932],[600,960],[760,1024],[761,1024],[768,1024],[1000,800],[1001,800],[1024,768],[1280,720],[1366,768],[1536,728],[1440,900],[1920,1080],[2560,1440],[568,320],[844,390]];
const server=spawn(process.execPath,['scripts/serve-pwa.mjs'],{windowsHide:true,stdio:'pipe',env:{...process.env,PORT:'4187'}});
let browser;
const failures=[],measurements=[];
try {
  await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('http://localhost'))resolve();});server.stderr.on('data',d=>process.stderr.write(d));server.once('exit',code=>reject(Error('Server exited '+code)));});
  browser=await chromium.launch({channel:process.env.PW_CHANNEL||'msedge',headless:true});
  const page=await browser.newPage({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await mkdir('test-results',{recursive:true});
  await page.goto('http://localhost:4187');
  for(const [width,height] of sizes)for(const theme of ['light','dark'])for(const language of ['en','fil'])for(const route of ['games','sort','compost','garden']) {
    const label=`${route} ${width}x${height} ${theme} ${language}`;
    await page.setViewportSize({width,height});
    await page.evaluate(({theme,route,language})=>{document.documentElement.dataset.theme=theme;const select=document.querySelector('#language');if(select.value!==language){select.value=language;select.dispatchEvent(new Event('change'));}location.hash=route;},{theme,route,language});
    await page.locator(route==='games'?'.games-grid':route==='sort'?'#sort-game':route==='compost'?'#compost-game':'#garden').waitFor();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const sortPlay=route==='sort'?await page.evaluate(()=>{
      const stage=document.querySelector('.sort-stage').getBoundingClientRect(),bins=document.querySelector('.sort-bins').getBoundingClientRect(),nav=document.querySelector('aside').getBoundingClientRect(),bottom=document.querySelector('.mobile-bottom-nav').getBoundingClientRect();
      return {stageTop:stage.top,binsBottom:bins.bottom,top:nav.bottom,bottom:bottom.height?bottom.top:innerHeight};
    }):null;
    // Buddy keeps its floating position at the top and while scrolling.
    for(const scroll of [0,240]) {
      const issues=await page.evaluate(scroll=>{
        scrollTo({top:scroll,behavior:'instant'});
        const out=[],rect=el=>el.getBoundingClientRect();
        if(document.documentElement.scrollWidth>innerWidth+1)out.push('horizontal overflow');
        const dock=document.querySelector('.buddy-dock'),avatar=rect(document.querySelector('#avatar-link'));
        if(getComputedStyle(dock).position!=='fixed')out.push('Buddy is not floating');
        if(avatar.top<0||avatar.bottom>innerHeight||avatar.left<0||avatar.right>innerWidth)out.push('Buddy outside viewport');
        return out;
      },scroll);
      failures.push(...issues.map(issue=>`${label} @${scroll}: ${issue}`));
    }
    const columns=await page.evaluate(()=>{
      const root=document.querySelector('#view'),card=root.querySelector('.sort-game,.compost-game,.garden'),intro=root.querySelector('.intro'),back=root.querySelector('.sort-promo a');
      if(!card)return null;
      const c=card.getBoundingClientRect(),i=intro.getBoundingClientRect(),b=back.getBoundingClientRect();
      return {left:c.left,right:c.right,intro:i.left,back:b.left,center:(c.left+c.right)/2};
    });
    if(columns){
      if(Math.abs(columns.left-columns.intro)>2||Math.abs(columns.left-columns.back)>2)failures.push(`${label}: back, intro and card misaligned`);
      if(Math.abs(columns.center-await page.evaluate(()=>document.documentElement.clientWidth/2))>2)failures.push(`${label}: game column is off center`);
    }
    if(route==='games') {
      const aligned=await page.evaluate(()=>{
        const cards=[...document.querySelectorAll('.games-grid > a')],rows=new Map();
        for(const card of cards){const y=Math.round(card.getBoundingClientRect().top);if(!rows.has(y))rows.set(y,[]);rows.get(y).push(card);}
        return [...rows.values()].every(row=>['.arcade-preview','.guide-number','h3','p','.guide-link'].every(selector=>{
          const positions=row.map(card=>card.querySelector(selector).getBoundingClientRect().top);
          return Math.max(...positions)-Math.min(...positions)<2;
        }));
      });
      if(!aligned)failures.push(`${label}: game card content rows are misaligned`);
    }
    if(route==='compost') {
      await page.locator('[data-compost-start]').click();
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const play=await page.evaluate(()=>{
        const field=document.querySelector('#compost-field').getBoundingClientRect(),controls=document.querySelector('#compost-controls').getBoundingClientRect(),hud=document.querySelector('#compost-hud').getBoundingClientRect(),pause=document.querySelector('#compost-hud [data-compost-pause]').getBoundingClientRect(),nav=document.querySelector('aside').getBoundingClientRect(),bottom=document.querySelector('.mobile-bottom-nav').getBoundingClientRect();
        return {fieldTop:field.top,hudTop:hud.top,pauseTop:pause.top,pauseBottom:pause.bottom,controlsBottom:controls.bottom,top:nav.bottom,bottom:bottom.height?bottom.top:innerHeight};
      });
      if(play.fieldTop<play.top-1||play.controlsBottom>play.bottom+1)failures.push(`${label}: playfield / movement controls outside usable viewport`);
      if(play.pauseTop<play.top-1||play.pauseBottom>play.bottom+1)failures.push(`${label}: pause control outside usable viewport`);
      measurements.push({label,...play});
      await page.locator('#compost-hud [data-compost-pause]').click();
    }
    if(route==='sort') {
      const play=sortPlay;
      if(play.stageTop<play.top-1||play.binsBottom>play.bottom+1)failures.push(`${label}: sorting object / bins outside usable viewport`);
      measurements.push({label,...play});
    }
    if(theme==='dark'&&[320,768,1280,1920,568,844].includes(width))await page.screenshot({path:`test-results/game-layout-${route}-${width}x${height}-${language}.png`,fullPage:true});
  }
  // Keep the same round alive while rotating/resizing; a fresh navigation can
  // hide a missing resize handler.
  for(const route of ['sort','compost']) {
    await page.evaluate(route=>{location.hash=route;},route);
    await page.locator(route==='sort'?'#sort-game':'#compost-game').waitFor();
    if(route==='compost')await page.locator('[data-compost-start]').click();
    for(const [width,height] of [[390,844],[844,390],[320,568],[568,320],[1280,720]]) {
      await page.setViewportSize({width,height});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const fits=await page.evaluate(route=>{
        const start=document.querySelector(route==='sort'?'.sort-stage':'#compost-hud').getBoundingClientRect(),end=document.querySelector(route==='sort'?'.sort-bins':'#compost-controls').getBoundingClientRect();
        const top=document.querySelector('aside').getBoundingClientRect().bottom,bottom=document.querySelector('.mobile-bottom-nav').getBoundingClientRect();
        return start.top>=top-1&&end.bottom<=(bottom.height?bottom.top:innerHeight)+1;
      },route);
      if(!fits)failures.push(`${route} ${width}x${height}: active round did not refit after resize`);
    }
  }
  failures.push(...errors.map(error=>'Page error: '+error));
  await writeFile(`test-results/game-layout-${audit?'audit':'report'}.json`,JSON.stringify({sizes,failures,measurements},null,2));
  console.log(`${sizes.length*16} route/theme/language/viewport cases; ${failures.length} alignment issues`);
  if(audit)console.log(failures.slice(0,16).join('\n'));
  else assert.deepEqual(failures,[]);
} finally {await browser?.close();server.kill();}
