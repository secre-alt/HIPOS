import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
const server=spawn(process.execPath,['scripts/serve-pwa.mjs'],{windowsHide:true,stdio:'pipe',env:{...process.env,PORT:'4186'}});
let browser;
try {
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(d.toString().includes('http://localhost'))resolve();});server.once('exit',c=>reject(Error(`Server exited ${c}`)));server.stderr.on('data',d=>process.stderr.write(d));setTimeout(()=>reject(Error('Server timeout')),30000).unref();});
 browser=await chromium.launch({channel:process.env.PW_CHANNEL||undefined,headless:true});
 for(const width of [390,1280]) for(const theme of ['light','dark']) {
  const page=await browser.newPage({viewport:{width,height:844}});
  await page.goto('http://127.0.0.1:4186');
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  const trigger=page.locator('footer [data-action="about"]');await trigger.click();
  const modal=page.locator('#about-dialog');await expect(modal).toBeVisible();await expect(modal).toHaveAccessibleName('About HIPOS');
  await expect(modal.getByText('What is HIPOS?',{exact:true})).toBeVisible();
  assert.ok(await modal.evaluate(el=>el.scrollWidth<=el.clientWidth),'No horizontal overflow');
  await page.screenshot({path:`test-results/about-${width}-${theme}.png`});
  await page.keyboard.press('Escape');await expect(modal).not.toBeVisible();await expect(trigger).toBeFocused();
  await page.locator('.settings-toggle:visible').click();
  const category=page.locator('[data-settings-category="app"]');if(await category.isVisible())await category.click();else await page.selectOption('#settings-category','app');
  const settingsTrigger=page.locator('#settings-dialog [data-action="about"]');await settingsTrigger.click();await expect(modal).toBeVisible();
  await modal.getByRole('button',{name:'Close About HIPOS',exact:true}).click();await expect(settingsTrigger).toBeFocused();
  const languageCategory=page.locator('[data-settings-category="language"]');if(await languageCategory.isVisible())await languageCategory.click();else await page.selectOption('#settings-category','language');
  await page.selectOption('#language','fil');
  await page.keyboard.press('Escape');await trigger.click();await expect(page.locator('#about-title')).toHaveText('Tungkol sa HIPOS');await expect(modal.getByText('Ano ang HIPOS?',{exact:true})).toBeVisible();
  await page.close();
 }
 console.log('About modal: desktop/mobile, both themes, close/focus, settings and Filipino passed.');
} finally {await browser?.close();server.kill();}
