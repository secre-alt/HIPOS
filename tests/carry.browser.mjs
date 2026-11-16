import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const port = process.env.CARRY_PORT || '4187';
const server = spawn(process.execPath, ['scripts/serve-pwa.mjs'], {
  windowsHide: true, stdio: 'pipe', env: { ...process.env, PORT: port }
});
let browser;
try {
  await new Promise((resolve, reject) => {
    server.stdout.on('data', data => { if (data.toString().includes('http://localhost')) resolve(); });
    server.once('exit', code => reject(new Error(`Server exited: ${code}`)));
  });
  browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, headless: true });
  await mkdir('test-results', { recursive: true });
  for (const width of [1280, 390, 360]) for (const colorScheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://localhost:${port}/#carry`);
    await page.locator('.carry-steps').waitFor();
    assert.equal(await page.locator('h1').textContent(), 'Carry out with care');
    assert.equal(await page.locator('.carry-steps > li').count(), 4);
    assert.equal(await page.locator('.carry-steps').evaluate(el => getComputedStyle(el).maxWidth), 'none');
    assert.equal(await page.locator('.carry-steps').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), width > 760 ? 2 : 1);
    assert.match(await page.locator('.carry-steps').textContent(), /lawful, approved off-campus arrangement/);
    assert.match(await page.locator('.carry-steps').textContent(), /Do not handle hazardous waste/);
    const helpers = page.locator('[data-carry-tip]');
    assert.equal(await helpers.count(), 3);
    for (let i = 0; i < 3; i++) {
      const helper = helpers.nth(i);
      await helper.focus();
      await page.keyboard.press(i === 1 ? 'Space' : 'Enter');
      assert.equal(await helper.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.carry-kit [aria-pressed=true]').count(), 1);
      assert.equal(await helper.evaluate(el => getComputedStyle(el).animationName), 'none');
      const box = await helper.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
    }
    assert.match(await page.locator('.kit-tip').textContent(), /Do not handle hazardous waste/);
    const tip = await page.locator('.kit-tip').boundingBox();
    const steps = await page.locator('.carry-steps').boundingBox();
    assert.ok(tip.y + tip.height <= steps.y, 'Safety tip does not overlap steps');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `test-results/carry-${width}-${colorScheme}.png`, fullPage: true });
    await page.locator('.carry-steps a[href="#classify"]').click();
    await page.locator('#guide-search').waitFor();
    await page.goto(`http://localhost:${port}/#carry`);
    await page.locator('.carry-steps').waitFor();
    await page.evaluate(() => localStorage.setItem('hipos.language', 'fil'));
    await page.reload();
    await page.waitForFunction(() => document.documentElement.lang === 'fil');
    assert.notEqual(await page.locator('h1').textContent(), 'Carry out with care');
    await page.locator('[data-carry-tip="3"]').click();
    await page.waitForFunction(() => !document.querySelector('.kit-tip').textContent.includes('Do not store'));
    assert.match(await page.locator('.kit-tip').textContent(), /Huwag/);
    const translatedTip = await page.locator('.kit-tip').boundingBox();
    const translatedSteps = await page.locator('.carry-steps').boundingBox();
    assert.ok(translatedTip.y + translatedTip.height <= translatedSteps.y, 'Filipino safety tip does not overlap steps');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal(await helpers.first().evaluate(el => getComputedStyle(el).animationName), 'kit-bob');
    assert.deepEqual(errors, []);
    console.log(`PASS Carry out ${width}px ${colorScheme}: helpers, keyboard, safety, layout, Classify link, Filipino, reduced motion`);
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill();
}
