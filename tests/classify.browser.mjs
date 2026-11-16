import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const port = process.env.CLASSIFY_PORT || '4186';
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
    await page.goto(`http://localhost:${port}/#classify`);
    await page.locator('#guide-search').waitFor();
    const shown = () => page.locator('.visual-waste-card:visible').count();
    assert.equal(await shown(), 16);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('h1').textContent(), 'Know what you’re carrying.');
    assert.equal(await page.locator('.classify-items').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), width > 760 ? 2 : 1);
    const helpers = page.locator('[data-classify-tip]');
    assert.equal(await helpers.count(), 3);
    for (let i = 0; i < 3; i++) {
      const helper = helpers.nth(i);
      await helper.focus();
      await page.keyboard.press(i === 1 ? 'Space' : 'Enter');
      assert.equal(await helper.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.classify-kit [aria-pressed=true]').count(), 1);
      assert.equal(await helper.evaluate(el => getComputedStyle(el).animationName), 'none');
      const box = await helper.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
    }
    assert.match(await page.locator('.kit-tip').textContent(), /Do not touch, collect, or store/);
    const tip = await page.locator('.kit-tip').boundingBox();
    const tools = await page.locator('.guide-tools').boundingBox();
    assert.ok(tip.y + tip.height <= tools.y, 'Safety tip does not overlap search');
    await page.locator('#guide-search').fill('juice box');
    assert.equal(await shown(), 1);
    assert.equal(await page.locator('.visual-waste-card:visible h3').textContent(), 'Clean drink carton');
    await page.locator('#guide-search').fill('baterya');
    assert.equal(await shown(), 1);
    await page.locator('#guide-search').fill('zzzz');
    assert.equal(await shown(), 0);
    assert.ok(await page.locator('#guide-empty').isVisible());
    await page.locator('#guide-search').fill('');
    await page.locator('[data-guide-filter=no]').click();
    assert.equal(await shown(), 8);
    await page.locator('[data-guide-filter=ok]').click();
    assert.equal(await shown(), 8);
    await page.locator('[data-guide-filter=all]').click();
    assert.equal(await shown(), 16);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `test-results/classify-${width}-${colorScheme}.png`, fullPage: true });
    await page.evaluate(() => localStorage.setItem('hipos.language', 'fil'));
    await page.reload();
    await page.waitForFunction(() => document.documentElement.lang === 'fil');
    assert.notEqual(await page.locator('h1').textContent(), 'Know what you’re carrying.');
    await page.locator('[data-classify-tip="5"]').click();
    await page.waitForFunction(() => !document.querySelector('.kit-tip').textContent.includes('Do not touch'));
    assert.match(await page.locator('.kit-tip').textContent(), /Huwag/);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal(await helpers.first().evaluate(el => getComputedStyle(el).animationName), 'kit-bob');
    assert.deepEqual(errors, []);
    console.log(`PASS Classify ${width}px ${colorScheme}: helpers, keyboard, safety guidance, search, filters, layout`);
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill();
}
