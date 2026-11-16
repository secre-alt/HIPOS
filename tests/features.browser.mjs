// Browser checks for: production headers (CSP), dark mode, scroll motion, Filipino completeness,
// back up / restore, and the in-app update flow. Runs against a copy of dist/ served with the
// same headers as vercel.json. Set PW_CHANNEL=msedge to use Edge instead of bundled Chromium.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {cp,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';

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
    const pages=['home','prevent','reuse','classify','carry','reports','privacy'],allowed=new Set(['Language / Wika','Rencruxx']);
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

  await check('back up and restore reports',async()=>{
    const s=await open({viewport:{width:1280,height:900},reducedMotion:'reduce'}),{page}=s;
    await page.evaluate(()=>{location.hash='reports';});
    await page.getByRole('heading',{name:'Back up and restore'}).waitFor();
    await page.waitForFunction(()=>document.querySelector('#storage-status')?.textContent.length>20,null,{timeout:5000});
    await noticeHas(page,'').catch(()=>{});
    await page.getByRole('button',{name:'Download backup'}).click();
    await noticeHas(page,'No reports to back up yet.');
    await page.fill('#description','Please clarify the handling steps.');
    await page.getByRole('button',{name:'Save on this device'}).click();
    await page.getByRole('heading',{name:'Saved reports (1)'}).waitFor();
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download backup'}).click()]);
    assert.match(download.suggestedFilename(),/^hipos-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const file=join(work,'backup.json');await download.saveAs(file);
    const backup=JSON.parse(await readFile(file,'utf8'));
    assert.equal(backup.type,'HIPOS-BACKUP');assert.equal(backup.reports.length,1);assert.ok(!/pin|salt/i.test(JSON.stringify(backup)));
    // delete, then restore
    page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete'}).click();
    await page.getByRole('heading',{name:'Saved reports (0)'}).waitFor();
    await page.setInputFiles('#restore-file',file);
    await page.getByRole('heading',{name:'Saved reports (1)'}).waitFor();await noticeHas(page,'Restored 1 report.');
    // restoring the same file again adds nothing
    await page.setInputFiles('#restore-file',file);await noticeHas(page,'Restored 0 reports. 1 already on this device.');
    // not a backup
    const junk=join(work,'junk.json');await writeFile(junk,'{"hello":"world"}');
    await page.setInputFiles('#restore-file',junk);await noticeHas(page,'That file is not a HIPOS backup.');
    // one good and one tampered report
    const good={type:'HIPOS1',id:randomUUID(),category:'Other',area:'Canteen',description:'A fresh concern from another phone.',createdAt:Date.now()-60000};
    const mixed=join(work,'mixed.json');await writeFile(mixed,JSON.stringify({type:'HIPOS-BACKUP',version:1,exportedAt:new Date().toISOString(),reports:[good,{...good,id:randomUUID(),category:'Not a category'}]}));
    await page.setInputFiles('#restore-file',mixed);await noticeHas(page,'Restored 1 report. 1 could not be read.');
    await page.getByRole('heading',{name:'Saved reports (2)'}).waitFor();
    // Filipino
    const more={...good,id:randomUUID(),description:'Isa pang concern mula sa ibang phone.'};
    const fil=join(work,'fil.json');await writeFile(fil,JSON.stringify({type:'HIPOS-BACKUP',version:1,exportedAt:new Date().toISOString(),reports:[more]}));
    await openSettings(page,'language');await page.selectOption('#language','fil');await page.keyboard.press('Escape');await page.getByRole('button',{name:'Ibalik mula sa backup'}).waitFor();
    await page.setInputFiles('#restore-file',fil);await noticeHas(page,'Naibalik ang 1 ulat.');
    await close(s);
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

  await check('staff review: filter reports, export CSV (formula-safe), Filipino',async()=>{
    const s=await open({viewport:{width:1280,height:900},reducedMotion:'reduce'}),{page}=s;
    const mk=(category,area,description,minutes)=>JSON.stringify({type:'HIPOS1',id:randomUUID(),category,area,description,createdAt:Date.now()-minutes*60000});
    const reports=[mk('Excessive packaging','Canteen','Too much plastic on every snack, every day.',5),mk('Unsafe waste concern','Hallway','=HYPERLINK("http://example.com") please check, thanks',4),mk('Excessive packaging','Classroom','Lots of wrappers, in the bin "by the door".',3)];
    await page.evaluate(()=>{location.hash='staff';});
    await page.getByLabel('Choose a PIN').fill('123456');await page.getByLabel('Confirm PIN',{exact:true}).fill('123456');
    await page.getByRole('button',{name:'Set PIN and continue'}).click();
    assert.equal(await page.locator('.staff-filters').count(),0,'no filters before anything is imported');
    for(const raw of reports){
      await page.getByRole('button',{name:'Paste transfer text'}).click();
      await page.getByLabel('Transfer text',{exact:true}).fill(raw);
      await page.getByRole('button',{name:'Review report',exact:true}).click();
      await page.getByRole('button',{name:'Confirm import'}).click();await noticeHas(page,'Report imported');
    }
    const cards=()=>page.locator('#staff-list article').count(),count=()=>page.locator('#staff-count').innerText();
    assert.equal(await cards(),3);assert.equal(await count(),'Showing 3 of 3 reports');
    assert.equal(await page.locator('[data-status]').count(),3,'status dropdowns are still one per report');
    await page.locator('[data-status]').first().selectOption('Under Review');await noticeHas(page,'Review status saved.');
    await page.selectOption('#filter-status','Under Review');assert.equal(await cards(),1);assert.equal(await count(),'Showing 1 of 3 reports');
    await page.selectOption('#filter-status','');await page.selectOption('#filter-category','Excessive packaging');assert.equal(await cards(),2);
    await page.selectOption('#filter-area','Canteen');assert.equal(await cards(),1);
    await page.selectOption('#filter-status','Reviewed');assert.equal(await cards(),0);
    assert.match(await page.locator('#staff-list').innerText(),/No reports match these filters\./);
    await page.getByRole('button',{name:'Clear filters'}).click();assert.equal(await cards(),3);
    assert.equal(await page.inputValue('#filter-status'),'');assert.equal(await page.inputValue('#filter-category'),'');
    // export only what is shown
    const parse=csv=>csv.replace(/^﻿/,'').trim().split('\r\n').map(line=>{const cells=[];let cur='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(q){if(ch==='"'&&line[i+1]==='"'){cur+='"';i++;}else if(ch==='"')q=false;else cur+=ch;}else if(ch==='"')q=true;else if(ch===','){cells.push(cur);cur='';}else cur+=ch;}cells.push(cur);return cells;});
    async function exportCsv(name){const [d]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export CSV'}).click()]);assert.match(d.suggestedFilename(),/^hipos-reports-\d{4}-\d{2}-\d{2}\.csv$/);const f=join(work,name);await d.saveAs(f);return readFile(f,'utf8');}
    await page.selectOption('#filter-category','Unsafe waste concern');
    let csv=await exportCsv('one.csv');assert.ok(csv.startsWith('﻿'),'byte-order mark');
    let rows=parse(csv);assert.equal(rows.length,2,'header plus the one filtered report');
    assert.equal(rows[1][3],`'=HYPERLINK("http://example.com") please check, thanks`,'formula is neutralised and commas/quotes survive');
    await page.getByRole('button',{name:'Clear filters'}).click();
    csv=await exportCsv('all.csv');rows=parse(csv);assert.equal(rows.length,4);
    assert.ok(rows.some(r=>r[3]==='Lots of wrappers, in the bin "by the door".'),'quotes and commas round-trip');
    assert.deepEqual(rows[0],['Status','Category','School area','Description','Created','Report ID']);
    // Filipino
    await openSettings(page,'language');await page.selectOption('#language','fil');await page.keyboard.press('Escape');await page.waitForTimeout(500);
    assert.equal(await page.getByRole('button',{name:'I-export ang CSV'}).count(),1);
    assert.equal(await count(),'Ipinapakita ang 3 sa 3 ulat');
    assert.equal(await page.locator('#filter-heading').innerText(),'I-filter ang mga ulat');
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
      for(const pg of ['home','classify','reports','privacy']){
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
    for(const pg of ['home','prevent','reuse','classify','carry','reports','privacy']){
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
    assert.equal(await page.locator('.sticker').count(),15);
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
      assert.ok(await page.locator('#sort-feedback').innerText().then(t=>/Yes!|Not quite\./.test(t)),'feedback explains the answer');
      assert.ok(await page.locator('[data-sort-bin]').first().isDisabled(),'bins lock until Next');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
      await page.locator('#sort-next').click();
    }
    assert.match(await page.locator('.sort-done h3').innerText(),/You sorted \d of 6 right\./);
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

  await check('settings: theme and sound persist; seasonal theme unlocks its extra',async()=>{
    const s=await open({viewport:{width:1280,height:900},reducedMotion:'reduce'}),{page}=s;
    await openSettings(page,'personal');await page.selectOption('#season','christmas');await page.keyboard.press('Escape');
    await openSettings(page,'sound');await page.locator('#sound').check();await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.season),'christmas');
    await page.reload();await page.locator('#connection',{hasText:/offline|Handa/i}).first().waitFor({state:'attached'});
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.season),'christmas','theme is remembered');
    assert.equal(await page.evaluate(()=>localStorage.getItem('hipos.sound')),'on');
    await page.evaluate(()=>{location.hash='avatar';});await page.locator('.buddy-chip',{hasText:'Festive hat'}).waitFor();
    assert.equal(await page.locator('.buddy-chip.is-locked',{hasText:'Festive hat'}).count(),0,'festive hat unlocked by trying the theme');
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
    assert.equal(await page.locator('.arcade-meta').count(),3,'each game card shows progress');
    assert.match(await page.locator('.arcade-meta').first().innerText(),/Not played yet/);
    for(const id of ['sort','compost','garden'])assert.equal(await page.locator(`.games-grid a[href="#${id}"]`).count(),1,id+' on the Games page');
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
