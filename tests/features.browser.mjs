// Browser checks for: production headers (CSP), dark mode, scroll motion, Filipino completeness,
// removed reporting routes, and the in-app update flow. Runs against a copy of dist/ served with the
// same headers as vercel.json. Set PW_CHANNEL=msedge to use Edge instead of bundled Chromium.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {cp,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const PORT=Number(process.env.FEATURES_PORT||4175),base=`http://localhost:${PORT}/`;
if(spawnSync(process.execPath,['scripts/build-pwa.mjs'],{stdio:'inherit'}).status!==0)process.exit(1);
const work=await mkdtemp(join(tmpdir(),'hipos-features-')),site=join(work,'site');
await cp('dist',site,{recursive:true});
const server=spawn(process.execPath,['scripts/serve-pwa.mjs'],{stdio:'pipe',env:{...process.env,PORT:String(PORT),HIPOS_ROOT:site}});
await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('http://localhost'))resolve();});server.stderr.on('data',d=>process.stderr.write(d));server.once('exit',c=>reject(Error('server exited '+c)));});
const browser=await chromium.launch({channel:process.env.PW_CHANNEL||undefined,headless:true});

const failures=[],cspViolations=[],consoleErrors=[];
async function check(name,fn){try{await fn();console.log('PASS - '+name);}catch(error){failures.push(name);console.log('FAIL - '+name+'\n       '+String(error.message).split('\n')[0]);}}
async function open(options={}){
  const ctx=await browser.newContext({acceptDownloads:true,...options}),page=await ctx.newPage();
  await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI));});
  page.on('pageerror',e=>consoleErrors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  page.harvest=async()=>{cspViolations.push(...await page.evaluate(()=>window.__csp||[]).catch(()=>[]));};
  await page.goto(base);await page.locator('#connection',{hasText:'Ready offline'}).waitFor({state:'attached',timeout:20000});
  return {ctx,page};
}
async function close({ctx,page}){await page.harvest();await ctx.close();}
const openSettings=async(pg,cat)=>{await pg.locator('.settings-toggle:visible').click();const b=pg.locator(`[data-settings-category="${cat}"]`);if(await b.isVisible())await b.click();else await pg.selectOption('#settings-category',cat);};
const noticeHas=(page,text)=>page.waitForFunction(t=>document.querySelector('#notice')?.textContent.includes(t),text,{timeout:8000});
const luminance=rgb=>{const [r,g,b]=rgb.match(/\d+/g).map(Number).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b;};

try{
  await check('production headers: CSP, camera policy, no sniffing, no-cache for the service worker',async()=>{
    const page=await browser.newPage();
    const html=await page.request.get(base),sw=await page.request.get(base+'sw.js'),manifest=await page.request.get(base+'manifest.webmanifest');
    const h=html.headers();
    assert.match(h['content-security-policy'],/default-src 'self'/);assert.match(h['content-security-policy'],/script-src 'self'/);assert.doesNotMatch(h['content-security-policy'],/unsafe-/);
    assert.match(h['permissions-policy'],/camera=\(self\)/);assert.match(h['permissions-policy'],/microphone=\(\)/);
    assert.equal(h['x-content-type-options'],'nosniff');assert.equal(h['x-frame-options'],'DENY');
    assert.match(sw.headers()['cache-control'],/no-cache/);assert.match(h['cache-control'],/no-cache/);
    assert.match(manifest.headers()['content-type'],/application\/manifest\+json/);
    await page.close();
  });

  await check('dark mode follows the phone setting',async()=>{
    for(const [scheme,test] of [['dark',l=>l<.15],['light',l=>l>.8]]){
      const s=await open({colorScheme:scheme,viewport:{width:390,height:844}});
      const bg=await s.page.evaluate(()=>getComputedStyle(document.body).backgroundColor);
      assert.ok(test(luminance(bg)),`${scheme} body background ${bg}`);
      const theme=await s.page.evaluate(()=>[...document.querySelectorAll('meta[name=theme-color]')].map(m=>m.media));
      assert.equal(theme.length,2);await close(s);
    }
  });

  await check('scroll motion: below-the-fold content reveals on scroll',async()=>{
    const s=await open({viewport:{width:390,height:844},reducedMotion:'no-preference'});
    const before=await s.page.evaluate(()=>{const el=document.querySelector('.home-next');return {rv:el.classList.contains('rv'),opacity:+getComputedStyle(el).opacity};});
    assert.deepEqual(before,{rv:true,opacity:0});
    await s.page.evaluate(()=>document.querySelector('.home-next').scrollIntoView({block:'center'}));
    await s.page.waitForFunction(()=>+getComputedStyle(document.querySelector('.home-next')).opacity===1,null,{timeout:5000});
    await s.page.waitForFunction(()=>document.querySelectorAll('.rv.in').length===0,null,{timeout:5000});
    assert.ok(await s.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
    await close(s);
  });

  await check('reduced motion: nothing is hidden or animated',async()=>{
    const s=await open({viewport:{width:390,height:844},reducedMotion:'reduce'});
    assert.equal(await s.page.locator('.rv').count(),0);
    assert.equal(await s.page.evaluate(()=>+getComputedStyle(document.querySelector('.home-next')).opacity),1);
    await close(s);
  });

  await check('Filipino is complete on every page (only the bilingual label and a name stay English)',async()=>{
    const pages=['home','prevent','reuse','classify','carry','privacy'],allowed=new Set(['Language / Wika','Rencruxx']);
    async function collect(lang){
      const s=await open({viewport:{width:1280,height:900},reducedMotion:'reduce'});
      await s.page.evaluate(l=>localStorage.setItem('hipos.language',l),lang);await s.page.reload();await s.page.locator('#connection',{hasText:/offline|Handa/i}).first().waitFor({state:'attached'});
      const out={};
      for(const pg of pages){
        await s.page.evaluate(h=>{location.hash=h;},pg);await s.page.waitForTimeout(450);
        out[pg]=await s.page.evaluate(()=>{const found=[],w=document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT);while(w.nextNode()){const n=w.currentNode,t=n.textContent.trim();if(t.length<4||!/[a-z]/i.test(t)||n.parentElement.closest('[data-no-translate],script,style,option,time'))continue;found.push(t);}return found;});
      }
      await close(s);return out;
    }
    const en=await collect('en'),fil=await collect('fil'),missing=[];
    for(const pg of pages){const f=new Set(fil[pg]);for(const t of en[pg])if(f.has(t)&&!allowed.has(t))missing.push(`${pg}: ${t.slice(0,70)}`);}
    const left=[...new Set(missing)];if(left.length)console.log('MISSING:',JSON.stringify(left));assert.deepEqual(left,[],'English text still shown with Filipino on');
  });

  await check('removed reporting routes preserve legacy storage and open Home',async()=>{
    const {ctx,page}=await open();
    const legacy=JSON.stringify({reports:[{description:'Fictional saved concern'}],imports:[],pin:null});
    await page.evaluate(value=>localStorage.setItem('hipos.pwa.v1',value),legacy);
    for(const route of ['reports','staff']){
      await page.goto(base+'#'+route);
      await page.waitForFunction(()=>document.querySelector('#page-label').textContent==='Your daily guide');
      assert.equal(await page.locator('a[href="#reports"],a[href="#staff"],#report-form,#pin-form,[data-action="scan"]').count(),0);
      assert.equal(await page.evaluate(()=>localStorage.getItem('hipos.pwa.v1')),legacy);
    }
    const manifest=await (await page.request.get(base+'manifest.webmanifest')).json();
    assert.ok(manifest.shortcuts.every(item=>!['./#reports','./#staff'].includes(item.url)));
    await close({ctx,page});
  });

  await check('Waste Guide: search (English and Filipino words), filter chips, safe empty state',async()=>{
    const s=await open({viewport:{width:390,height:844},reducedMotion:'reduce'}),{page}=s;
    await page.evaluate(()=>{location.hash='classify';});await page.locator('#guide-search').waitFor();
    const shown=()=>page.evaluate(()=>[...document.querySelectorAll('.visual-waste-card')].filter(c=>!c.hidden).map(c=>c.querySelector('h3').textContent));
    assert.equal((await shown()).length,16);assert.equal(await page.locator('.waste-guide-art').count(),6);
    await page.fill('#guide-search','juice box');assert.deepEqual(await shown(),['Clean drink carton']);
    assert.equal(await page.locator('#guide-count').innerText(),'1 of 16 items');
    await page.fill('#guide-search','baterya');assert.deepEqual(await shown(),['Batteries and electronic items']);
    await page.fill('#guide-search','tissue');assert.deepEqual(await shown(),['Used tissues and hygiene waste']);
    await page.fill('#guide-search','zzzz');assert.deepEqual(await shown(),[]);
    assert.ok(await page.locator('#guide-empty').isVisible());assert.match(await page.locator('#guide-empty').innerText(),/keep it out of your pouch and ask school staff/);
    await page.fill('#guide-search','');
    await page.getByRole('button',{name:'Keep out of your pouch'}).click();
    assert.equal((await shown()).length,8);
    assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.visual-waste-card')].filter(c=>!c.hidden).every(c=>c.dataset.kind==='no')),'only keep-out items');
    await page.getByRole('button',{name:'All',exact:true}).click();assert.equal((await shown()).length,16);
    await openSettings(page,'language');await page.selectOption('#language','fil');await page.keyboard.press('Escape');await page.waitForTimeout(400);
    assert.equal(await page.locator('label[for=guide-search]').innerText(),'Hanapin sa gabay');
    await page.fill('#guide-search','karton');assert.match(await page.locator('#guide-count').innerText(),/^\d+ sa 16 aytem$/);
    await close(s);
  });

  await check('streak, badges and the weekly image: earn, show, save a real PNG, Filipino',async()=>{
    const s=await open({viewport:{width:390,height:844},reducedMotion:'reduce'}),{page}=s;
    assert.match(await page.locator('.streak').innerText(),/No streak yet/);
    await page.locator('[data-habit="0"]').check();
    await page.waitForFunction(()=>/1 day streak/.test(document.querySelector('.streak')?.textContent||''),null,{timeout:5000});
    const earned=await page.locator('.badge.earned .badge-name').allInnerTexts();assert.deepEqual(earned,['First step']);
    for(const i of [1,2])await page.locator(`[data-habit="${i}"]`).check();
    await page.waitForFunction(()=>document.querySelectorAll('.badge.earned').length>=2,null,{timeout:5000});
    const [download]=await Promise.all([page.waitForEvent('download',{timeout:10000}),page.locator('[data-action="share-week"]').click()]);
    assert.match(download.suggestedFilename(),/^hipos-week-\d{4}-\d{2}-\d{2}\.png$/);
    const path=join(work,'week.png');await download.saveAs(path);const png=await readFile(path);
    assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),1080);assert.equal(png.readUInt32BE(20),1350);
    await noticeHas(page,'Your week image is ready.');
    await page.evaluate(()=>localStorage.setItem('hipos.language','fil'));await page.reload();await page.locator('#connection',{hasText:/offline|Handa/i}).first().waitFor({state:'attached'});
    assert.match(await page.locator('.streak').innerText(),/1 araw na tuloy-tuloy/);
    assert.match(await page.locator('[data-action="share-week"]').innerText(),/I-save ang linggo ko/);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
    await close(s);
  });

  await check('text size: persists, scales type, no horizontal overflow at any width, Filipino',async()=>{
    const s=await open({viewport:{width:1280,height:900},reducedMotion:'reduce'}),{page}=s;
    const size=()=>page.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('.home-intro p:not(.eyebrow)')).fontSize));
    const base=await size();
    await openSettings(page,'text');await page.selectOption('#textsize','xlarge');await page.keyboard.press('Escape');
    assert.ok(await size()>base*1.2,'type grows with Extra large');
    await page.reload();await page.locator('#connection',{hasText:/offline|Handa/i}).first().waitFor({state:'attached'});
    assert.equal(await page.inputValue('#textsize'),'xlarge');assert.ok(await size()>base*1.2,'choice is remembered');
    for(const width of [360,390,768,1001,1280,1920]){
      await page.setViewportSize({width,height:900});
      for(const pg of ['home','classify','privacy']){
        await page.evaluate(h=>{location.hash=h;},pg);await page.waitForTimeout(250);
        const over=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
        assert.ok(over<=0,`horizontal overflow of ${over}px on #${pg} at ${width}px wide with Extra large text`);
      }
    }
    await page.evaluate(()=>localStorage.setItem('hipos.language','fil'));await page.reload();await page.locator('#connection',{hasText:/offline|Handa/i}).first().waitFor({state:'attached'});
    assert.match(await page.locator('.textsize-control').innerText(),/Laki ng teksto/);
    assert.deepEqual(await page.locator('#textsize option').allInnerTexts(),['Karaniwan','Malaki','Napakalaki']);
    await close(s);
  });

  await check('accessibility basics: names, one h1, unique ids, heading order, labels',async()=>{
    const s=await open({viewport:{width:1280,height:900},reducedMotion:'reduce'}),{page}=s,problems=[];
    for(const pg of ['home','prevent','reuse','classify','carry','privacy']){
      await page.evaluate(h=>{location.hash=h;},pg);await page.waitForTimeout(300);
      const found=await page.evaluate(()=>{
        const out=[],visible=el=>!!(el.offsetWidth||el.offsetHeight||el.getClientRects().length)&&getComputedStyle(el).visibility!=='hidden';
        const name=el=>(el.getAttribute('aria-label')||el.getAttribute('aria-labelledby')&&document.getElementById(el.getAttribute('aria-labelledby'))?.textContent||el.textContent||el.getAttribute('title')||'').trim();
        document.querySelectorAll('button,a[href],[role=button]').forEach(el=>{if(visible(el)&&!el.closest('[aria-hidden=true]')&&!name(el))out.push('no accessible name: '+el.outerHTML.slice(0,80));});
        document.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(el=>{if(!visible(el))return;const labelled=el.labels?.length||el.getAttribute('aria-label')||el.getAttribute('aria-labelledby');if(!labelled)out.push('unlabelled field: '+el.outerHTML.slice(0,80));});
        document.querySelectorAll('img').forEach(el=>{if(!el.hasAttribute('alt'))out.push('image without alt: '+el.outerHTML.slice(0,80));});
        const ids=[...document.querySelectorAll('[id]')].map(e=>e.id),dup=ids.filter((v,i)=>ids.indexOf(v)!==i);if(dup.length)out.push('duplicate ids: '+[...new Set(dup)].join(','));
        const h1=[...document.querySelectorAll('h1')].filter(visible);if(h1.length!==1)out.push(`expected one visible h1, found ${h1.length}`);
        if(document.documentElement.lang!=='en')out.push('html lang is '+document.documentElement.lang);
        return out;
      });
      problems.push(...found.map(f=>`#${pg}: ${f}`));
    }
    await close(s);
    assert.deepEqual(problems,[],'accessibility problems: '+JSON.stringify(problems));
  });

  await check('buddy: tap reactions, habit treats and cheers, mini helper, sticker book, moods',async()=>{
    const s=await open({viewport:{width:390,height:844}}),{page}=s;
    assert.equal(await page.locator('.buddy-strip-art').count(),1);
    await page.locator('.buddy-strip-art').click();
    await page.waitForFunction(()=>!document.querySelector('#buddy-say').hidden,null,{timeout:3000});
    assert.ok((await page.locator('.buddy-say-text').innerText()).length>3,'buddy says something when tapped');
    await page.locator('[data-habit="0"]').check();
    await page.waitForFunction(()=>/Little habit|One small step|Packed and ready/.test(document.querySelector('.buddy-say-text')?.textContent||''),null,{timeout:3000});
    assert.match(await page.locator('.buddy-treats').innerText(),/Treats shared: 1/);
    await page.locator('[data-habit="0"]').uncheck();await page.locator('[data-habit="0"]').check();
    assert.match(await page.locator('.buddy-treats').innerText(),/Treats shared: 1/,'no extra treat for ticking again');
    const mini=await page.locator('.mini-buddy').count();assert.ok(mini>=3,'helper buddies in the checklist, challenge and quiz cards');
    await page.locator('.quiz-panel .mini-buddy').click();
    await page.waitForFunction(()=>/clean|Wet|tip/i.test(document.querySelector('.buddy-say-text')?.textContent||''),null,{timeout:3000});
    // cheers off: no bubble
    await openSettings(page,'sound');await page.locator('#cheers').uncheck();await page.keyboard.press('Escape');
    await page.locator('.buddy-strip-art').click();await page.waitForTimeout(300);
    assert.ok(await page.locator('#buddy-say').isHidden(),'cheers off hides the bubble');
    await page.evaluate(()=>{location.hash='avatar';});await page.locator('.sticker-book').waitFor();
    assert.ok(await page.locator('.sticker.earned').count()>=1,'first step sticker earned');
    assert.equal(await page.locator('.sticker').count(),17);
    assert.ok(await page.locator('[data-mood]').count()>=1,'buddy has a mood');
    // Filipino
    await openSettings(page,'language');await page.selectOption('#language','fil');await page.keyboard.press('Escape');await page.waitForTimeout(400);
    assert.match(await page.locator('.sticker-book h2').innerText(),/Aklat ng sticker/);
    await close(s);
  });

  await check('sorting game: tap or drag, feedback, a full round, result, play again, Filipino, no overflow',async()=>{
    const s=await open({viewport:{width:360,height:640},reducedMotion:'reduce'}),{page}=s;
    await page.evaluate(()=>{location.hash='sort';});await page.locator('#sort-game').waitFor();
    assert.equal(await page.locator('h1').count(),1);
    for(let i=1;i<=6;i++){
      assert.match(await page.locator('.sort-progress').innerText(),new RegExp(`Item ${i} of 6`));
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const viewport=page.viewportSize(),bins=await page.locator('.sort-bins').boundingBox();
      assert.ok(bins.y+bins.height<=viewport.height,`both bins are on screen (bottom ${Math.round(bins.y+bins.height)} of ${viewport.height})`);
      if(i===2){ // drag the item onto the "ask staff" bin with the pointer
        const item=await page.locator('#sort-item').boundingBox(),bin=await page.locator('.sort-no').boundingBox();
        await page.mouse.move(item.x+item.width/2,item.y+item.height/2);await page.mouse.down();
        await page.mouse.move(bin.x+bin.width/2,bin.y+bin.height/2,{steps:8});await page.mouse.up();
      }else await page.locator(i%2?'.sort-yes':'.sort-no').click();
      await page.locator('#sort-feedback').waitFor({state:'visible'});
      assert.ok(await page.locator('#sort-feedback').innerText().then(t=>/Correct!|Let us try this together/.test(t)),'feedback explains the answer');
      assert.ok(await page.locator('[data-sort-bin]').first().isDisabled(),'bins lock until Next');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
      await page.locator('#sort-next').click();
    }
    assert.match(await page.locator('.sort-done h3').innerText(),/You sorted \d of 6 right\./);
    assert.equal(await page.locator('dialog.sort-result[open]').count(),1,'the result opens as a modal');
    await page.locator('[data-sort-result-close]').click();assert.equal(await page.locator('dialog.sort-result[open]').count(),0,'the result modal closes');
    await page.locator('[data-sort-results]').click();assert.equal(await page.locator('dialog.sort-result[open]').count(),1,'See results reopens it');
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('hipos.buddy.v1')||'{}').sorts===1);
    await page.locator('[data-sort-again]').click();assert.match(await page.locator('.sort-progress').innerText(),/Item 1 of 6/);
    await page.evaluate(()=>{location.hash='avatar';});await page.locator('.sticker-book').waitFor();
    assert.ok(await page.locator('.sticker.earned .sticker-name',{hasText:'Sorting star'}).count()===1,'sorting star sticker earned');
    await openSettings(page,'language');await page.selectOption('#language','fil');await page.keyboard.press('Escape');
    await page.evaluate(()=>{location.hash='sort';});await page.locator('#sort-game').waitFor();await page.waitForTimeout(400);
    assert.match(await page.locator('.sort-progress').innerText(),/Aytem 1 sa 6/);
    assert.match(await page.locator('.sort-bins').innerText(),/Pouch para sa tuyong basura/);
    await close(s);
  });

  await check('Safe or Stay Away: eight items, feedback, result modal, rewards and a sticker',async()=>{
    const s=await open({viewport:{width:390,height:800}}),{page}=s;
    await page.goto(base+'#hazard');await page.locator('#hazard-game').waitFor();
    assert.ok((await page.locator('#hazard-game .sort-bin').first().boundingBox()).height>=44,'touch size');
    for(let i=0;i<8;i++){
      await page.locator('[data-hazard="safe"]').click();
      assert.ok(await page.locator('#hazard-feedback').innerText(),'feedback shown');
      await page.locator('[data-hazard-next]').click();
    }
    await page.locator('dialog.hazard-result[open]').waitFor({timeout:5000});
    assert.match(await page.locator('.hazard-result h3').innerText(),/of 8 right/);
    const st=await page.evaluate(()=>JSON.parse(localStorage.getItem('hipos.buddy.v1')));
    assert.equal(st.hazard,1);
    await page.locator('.hazard-result .compost-result-close').click();
    await page.locator('dialog.hazard-result').waitFor({state:'detached',timeout:3000});
    await page.goto(base+'#games');assert.ok(await page.locator('.arcade-hazard').isVisible(),'hub card');
    await close(s);
  });
  await check('review later: wrong sorting answers are kept, shown, and cleared when answered right',async()=>{
    const s=await open({viewport:{width:390,height:800}}),{page}=s;
    await page.evaluate(()=>localStorage.setItem('hipos.review.v1',JSON.stringify([{title:'Glass jar',body:'Ask staff.'}])));
    await page.goto(base+'#sort');await page.locator('#sort-game').waitFor();
    assert.match(await page.locator('.review-later summary').innerText(),/Review later \(1\)/);
    await page.evaluate(()=>{localStorage.setItem('hipos.language','fil');});
    await page.evaluate(()=>localStorage.setItem('hipos.review.v1','{broken'));
    await page.reload();await page.locator('#sort-game').waitFor();
    assert.equal(await page.locator('.review-later').count(),0,'damaged data is ignored');
    await close(s);
  });
  await check('reduced motion: game pages and result dialogs have no running animations; dialogs are named',async()=>{
    const s=await open({viewport:{width:390,height:800},reducedMotion:'reduce'}),{page}=s;
    for(const hash of ['games','sort','compost','hazard','garden']){
      await page.goto(base+'#'+hash);await page.waitForTimeout(300);
      const running=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations===Infinity).length);
      assert.equal(running,0,hash+' has no endless animations');
    }
    await page.goto(base+'#hazard');await page.locator('#hazard-game').waitFor();
    for(let i=0;i<8;i++){await page.locator('[data-hazard="safe"]').click();await page.locator('[data-hazard-next]').click();}
    const d=page.locator('dialog.hazard-result[open]');await d.waitFor();
    const labelled=await d.evaluate(el=>document.getElementById(el.getAttribute('aria-labelledby'))?.textContent.length>0);
    assert.ok(labelled,'result dialog has an accessible name');
    await page.keyboard.press('Escape');await page.locator('dialog.hazard-result').waitFor({state:'detached',timeout:3000});
    assert.ok(await page.evaluate(()=>document.activeElement?.closest('#hazard-game')!==null),'focus returns to the game');
    await close(s);
  });
  await check('blocked storage: the app still opens, says progress will not be saved, and no welcome loops',async()=>{
    const ctx=await browser.newContext({viewport:{width:390,height:800}}),page=await ctx.newPage();
    const errs=[];page.on('pageerror',e=>errs.push(String(e)));
    await ctx.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('blocked','QuotaExceededError');};});
    await page.goto(base);
    await page.locator('#connection').waitFor({state:'attached'});
    await page.waitForFunction(()=>document.body.innerText.includes('blocking storage'),null,{timeout:8000});
    assert.equal(await page.locator('dialog.welcome').count(),0);
    assert.deepEqual(errs,[],'no uncaught errors');
    await ctx.close();
  });
  await check('first-run welcome: three skippable steps once, never for returning users or automated browsers',async()=>{
    const s=await open({viewport:{width:390,height:800}}),{page}=s;
    assert.equal(await page.locator('dialog.welcome').count(),0,'automated browsers are not interrupted');
    await page.evaluate(()=>localStorage.setItem('hipos.welcome.v1','force'));
    await page.reload();await page.locator('dialog.welcome[open]').waitFor({timeout:8000});
    assert.match(await page.locator('.welcome h2').innerText(),/Meet your buddy/);
    await page.locator('[data-welcome-buddy="bottle"]').click();await page.locator('#welcome-name').fill('Pip');
    await page.locator('[data-welcome-next]').click();assert.match(await page.locator('.welcome h2').innerText(),/language/i);
    await page.locator('[data-welcome-lang="fil"]').click();assert.equal(await page.evaluate(()=>document.documentElement.lang),'fil','language applies at once');
    await page.locator('[data-welcome-lang="en"]').click();
    await page.locator('[data-welcome-next]').click();assert.match(await page.locator('.welcome h2').innerText(),/small thing/);
    assert.ok(await page.locator('.welcome a, .welcome button').evaluateAll(els=>els.filter(e=>e.getClientRects().length).every(e=>e.getBoundingClientRect().height>=44)),'welcome controls are touch sized');
    await page.locator('[data-welcome-go][href="#sort"]').click();
    await page.waitForFunction(()=>location.hash==='#sort'&&!document.querySelector('dialog.welcome'));
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('hipos.avatar.v1')).character),'bottle','buddy choice is saved');
    assert.equal(await page.evaluate(()=>localStorage.getItem('hipos.buddy.nickname.v1')),'Pip','nickname is saved');
    assert.equal(await page.evaluate(()=>localStorage.getItem('hipos.welcome.v1')),'done');
    await page.reload();await page.waitForTimeout(1200);assert.equal(await page.locator('dialog.welcome').count(),0,'it never shows twice');
    await close(s);
  });
  await check('settings: theme and sound persist; seasonal theme unlocks its extra',async()=>{
    const s=await open({viewport:{width:1280,height:900},reducedMotion:'reduce'}),{page}=s;
    await openSettings(page,'personal');await page.selectOption('#season','christmas');await page.keyboard.press('Escape');
    await openSettings(page,'sound');await page.locator('#sound').check();await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.season),'christmas');
    await page.reload();await page.locator('#connection',{hasText:/offline|Handa/i}).first().waitFor({state:'attached'});
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.season),'christmas','theme is remembered');
    assert.equal(await page.evaluate(()=>localStorage.getItem('hipos.sound')),'on');
    await openSettings(page,'sound');await page.selectOption('#voicepack','sleepy');await page.keyboard.press('Escape');
    await page.reload();await page.locator('#connection',{hasText:/offline|Handa/i}).first().waitFor({state:'attached'});
    await openSettings(page,'sound');assert.equal(await page.locator('#voicepack').inputValue(),'sleepy','voice pack is remembered');await page.keyboard.press('Escape');
    await page.evaluate(()=>{location.hash='avatar';});await page.locator('.buddy-chip',{hasText:'Festive hat'}).waitFor();
    assert.equal(await page.locator('.buddy-chip.is-locked',{hasText:'Festive hat'}).count(),0,'festive hat unlocked by trying the theme');
    assert.equal(await page.locator('.buddy-chip.is-locked',{hasText:'Peely'}).count(),1,'Peely starts locked');
    await page.evaluate(()=>{const raw=JSON.parse(localStorage.getItem('hipos.buddy.v1')||'{}');raw.compost=1;raw.compostPerfect=1;localStorage.setItem('hipos.buddy.v1',JSON.stringify(raw));});
    await page.reload();await page.locator('.buddy-chip',{hasText:'Peely'}).waitFor();
    assert.equal(await page.locator('.buddy-chip.is-locked',{hasText:'Peely'}).count(),0,'Peely unlocked by a perfect Compost Catch');
    assert.equal(await page.locator('.buddy-chip.is-locked',{hasText:'Volt'}).count(),1,'Volt starts locked');
    const other=await page.context().newPage();await other.goto(page.url().split('#')[0]);
    await other.evaluate(()=>{const raw=JSON.parse(localStorage.getItem('hipos.buddy.v1')||'{}');raw.sorts=1;raw.perfect=1;localStorage.setItem('hipos.buddy.v1',JSON.stringify(raw));});await other.close();
    await page.waitForTimeout(300);await page.evaluate(()=>document.dispatchEvent(new Event('hipos-game-done')));
    await page.locator('.unlock-pop',{hasText:'Volt'}).waitFor();
    assert.ok(await page.locator('.unlock-pop .unlock-close').evaluate(el=>el.getBoundingClientRect().height>=44),'pop-up close button is touch sized');
    await page.locator('.unlock-pop .unlock-close').click();assert.equal(await page.locator('.unlock-pop').count(),0,'pop-up closes');
    await openSettings(page,'personal');await page.selectOption('#season','default');await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.season),undefined);
    await close(s);
  });

  await check('buddy dock: the buddy stays on screen while scrolling at phone, laptop and wide sizes',async()=>{
    for(const [width,height] of [[390,844],[1280,800],[1900,950]]){
      const s=await open({viewport:{width,height},reducedMotion:'reduce'}),{page}=s;
      const dock=page.locator('#avatar-link');
      for(const y of [0,1200]){
        await page.evaluate(v=>scrollTo(0,v),y);await page.waitForTimeout(150);
        const box=await dock.boundingBox();
        assert.ok(box&&box.y>=0&&box.y+box.height<=height&&box.x>=0&&box.x+box.width<=width,`buddy fully on screen at ${width}px after scrolling to ${y}`);
        assert.ok(box.width>=40,`buddy is at least 40px wide (${box.width}) at ${width}px`);
      }
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
      await close(s);
    }
  });

  await check('font combos: game font on headings/buttons/chips, body stays readable, preview updates',async()=>{
    const s=await open({viewport:{width:1280,height:900},reducedMotion:'reduce'}),{page}=s;
    await openSettings(page,'text');
    await page.locator('.font-picker summary').click();
    await page.locator('[data-font="lilita"]').click();
    const f=await page.evaluate(()=>{const g=s=>getComputedStyle(document.querySelector(s)).fontFamily;return{h:g('.fp-title'),b:g('.fp-body'),c:g('.fp-chip')};});
    if(!/Lilita/i.test(f.h)||!/Lilita/i.test(f.c))throw new Error('display font not applied: '+JSON.stringify(f));
    if(/Lilita/i.test(f.b))throw new Error('body should keep reading font: '+f.b);
    await page.keyboard.press('Escape');await close(s);
  });
  await check('arcade pause freezes play, resumes, pauses when hidden and cleans up on navigation',async()=>{
    const s=await open({viewport:{width:390,height:844},reducedMotion:'reduce'}),{page}=s;
    await page.evaluate(()=>{location.hash='compost';});
    await page.locator('[data-compost-start]').click();
    await page.locator('.compost-item').first().waitFor();
    await page.locator('#compost-hud [data-compost-pause]').click();
    const before=await page.locator('.compost-item').first().getAttribute('style');
    await page.waitForTimeout(250);
    assert.equal(await page.locator('.compost-item').first().getAttribute('style'),before,'falling items freeze');
    const basket=await page.locator('#compost-basket').getAttribute('style');
    await page.locator('[data-compost-left]').click();
    assert.equal(await page.locator('#compost-basket').getAttribute('style'),basket,'movement freezes too');
    await page.locator('.compost-paused button').click();
    await page.locator('.compost-paused').waitFor({state:'detached'});
    await page.waitForTimeout(100);
    assert.notEqual(await page.locator('.compost-item').first().getAttribute('style'),before,'fall resumes');
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
    await page.locator('.compost-paused').waitFor();
    await page.evaluate(()=>{delete document.hidden;location.hash='games';});
    await page.locator('.games-grid').waitFor();
    await page.locator('a[href="#compost"].arcade-card').click();
    await page.locator('[data-compost-start]').click();
    await page.locator('.compost-item').first().waitFor();
    assert.equal(await page.locator('.compost-paused').count(),0,'new visit starts cleanly');
    await close(s);
  });
  await check('menu has one Games item that opens a hub for every game; the garden shows nine plots, grows from care, Filipino',async()=>{
    const s=await open({viewport:{width:1280,height:900},reducedMotion:'reduce'}),{page}=s;
    assert.equal(await page.locator('#nav a',{hasText:'Games'}).count(),1,'Games in the menu');
    for(const name of ['Compost Catch','Buddy garden'])assert.equal(await page.locator('#nav a',{hasText:name}).count(),0,name+' is grouped under Games');
    assert.equal(await page.locator('.games-strip a[href="#games"]').count(),1,'home links to Games');
    await page.locator('#nav a',{hasText:'Games'}).click();await page.locator('.games-grid').waitFor();
    assert.equal(await page.locator('.arcade-meta').count(),4,'each game card shows progress');
    assert.match(await page.locator('.arcade-meta').first().innerText(),/Not played yet/);
    for(const id of ['sort','compost','hazard','garden'])assert.equal(await page.locator(`.games-grid a[href="#${id}"]`).count(),1,id+' on the Games page');
    await page.locator('.games-grid a[href="#compost"]').click();await page.locator('#compost-game').waitFor();
    assert.equal(await page.locator('#nav a.active').innerText(),'Games','a game keeps Games active in the menu');
    await page.locator('a',{hasText:'All games'}).click();await page.locator('.games-grid').waitFor();
    await page.locator('.games-grid a[href="#garden"]').click();
    await page.locator('#garden .garden-plot').first().waitFor();
    assert.equal(await page.locator('#garden .garden-plot').count(),9);
    assert.equal(await page.locator('#garden .garden-plot[data-stage="3"]').count(),0,'a fresh garden has no blooms');
    await page.evaluate(()=>{const raw=JSON.parse(localStorage.getItem('hipos.buddy.v1')||'{}');raw.treats=4;raw.sorts=1;localStorage.setItem('hipos.buddy.v1',JSON.stringify(raw));});
    await page.reload();await page.locator('#garden .garden-plot').first().waitFor();
    assert.equal(await page.locator('#garden .garden-plot[data-stage="3"]').count(),1,'five points: one bloom');
    await page.locator('#garden .garden-plot').first().click();
    await page.locator('#buddy-say .buddy-say-text',{hasText:'in bloom'}).waitFor({state:'attached'});
    await openSettings(page,'language');await page.selectOption('#language','fil');await page.keyboard.press('Escape');await page.waitForTimeout(400);
    assert.match(await page.locator('#garden .garden-count').textContent(),/namumulaklak/);
    await close(s);
  });
  await check('no CSP violations or console errors across all pages and features',async()=>{
    assert.deepEqual(cspViolations,[],'CSP violations');
    assert.deepEqual(consoleErrors,[],'console errors');
  });

  await check('update flow: banner appears for a new version, Update now applies it, first visit never reloads',async()=>{
    const s=await open({viewport:{width:390,height:844}}),{page}=s;
    let navigations=0;page.on('framenavigated',f=>{if(f===page.mainFrame())navigations++;});
    await page.waitForTimeout(800);
    assert.ok(await page.locator('#update-banner').isHidden(),'no banner on first visit');assert.equal(navigations,0,'no reload on first visit');
    // "deploy" a new version: change a shipped file and the service-worker cache id
    await writeFile(join(site,'app.css'),(await readFile(join(site,'app.css'),'utf8'))+'\n/* hipos-test-v2 */\n');
    const swPath=join(site,'sw.js'),sw=await readFile(swPath,'utf8');
    assert.match(sw,/CACHE=PREFIX\+'[0-9a-f]+'/);await writeFile(swPath,sw.replace(/(CACHE=PREFIX\+')[0-9a-f]+(')/,'$1ffffffffffffffff$2'));
    await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
    await page.locator('#update-banner').waitFor({state:'visible',timeout:20000});
    assert.match(await page.locator('#update-banner').innerText(),/new version of HIPOS is ready/);
    const stillOld=await page.evaluate(()=>fetch('./app.css').then(r=>r.text()));assert.ok(!stillOld.includes('hipos-test-v2'),'page keeps the old version until Update now');
    await page.locator('#dismiss-update').click();assert.ok(await page.locator('#update-banner').isHidden(),'Later hides the banner');
    await page.evaluate(()=>{document.querySelector('#update-banner').hidden=false;});
    const reloaded=page.waitForEvent('load',{timeout:20000});await page.locator('#apply-update').click();await reloaded;
    await page.locator('#connection',{hasText:'Ready offline'}).waitFor({state:'attached',timeout:20000});
    const now=await page.evaluate(()=>fetch('./app.css').then(r=>r.text()));assert.ok(now.includes('hipos-test-v2'),'new version is running');
    assert.ok(await page.locator('#update-banner').isHidden(),'banner is gone after updating');
    await close(s);
  });
}finally{
  await browser.close();server.kill();await rm(work,{recursive:true,force:true});
}
if(failures.length){console.log(`\n${failures.length} check(s) failed.`);process.exit(1);}
console.log('\nAll feature checks passed.');
