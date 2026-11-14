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
  await page.goto(base);await page.getByText('Ready offline',{exact:true}).waitFor({timeout:20000});
  return {ctx,page};
}
async function close({ctx,page}){await page.harvest();await ctx.close();}
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
      await s.page.evaluate(l=>localStorage.setItem('hipos.language',l),lang);await s.page.reload();await s.page.getByText(/offline/i).first().waitFor();
      const out={};
      for(const pg of pages){
        await s.page.evaluate(h=>{location.hash=h;},pg);await s.page.waitForTimeout(450);
        out[pg]=await s.page.evaluate(()=>{const found=[],w=document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT);while(w.nextNode()){const n=w.currentNode,t=n.textContent.trim();if(t.length<4||!/[a-z]/i.test(t)||n.parentElement.closest('[data-no-translate],script,style,option,time'))continue;found.push(t);}return found;});
      }
      await close(s);return out;
    }
    const en=await collect('en'),fil=await collect('fil'),missing=[];
    for(const pg of pages){const f=new Set(fil[pg]);for(const t of en[pg])if(f.has(t)&&!allowed.has(t))missing.push(`${pg}: ${t.slice(0,70)}`);}
    assert.deepEqual([...new Set(missing)],[],'English text still shown with Filipino on');
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
    await page.selectOption('#language','fil');await page.getByRole('button',{name:'Ibalik mula sa backup'}).waitFor();
    await page.setInputFiles('#restore-file',fil);await noticeHas(page,'Naibalik ang 1 ulat.');
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
    await page.getByText('Ready offline',{exact:true}).waitFor({timeout:20000});
    const now=await page.evaluate(()=>fetch('./app.css').then(r=>r.text()));assert.ok(now.includes('hipos-test-v2'),'new version is running');
    assert.ok(await page.locator('#update-banner').isHidden(),'banner is gone after updating');
    await close(s);
  });
}finally{
  await browser.close();server.kill();await rm(work,{recursive:true,force:true});
}
if(failures.length){console.log(`\n${failures.length} check(s) failed.`);process.exit(1);}
console.log('\nAll feature checks passed.');
