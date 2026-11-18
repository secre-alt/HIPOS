import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

const port = process.env.UX_PORT || '4186';
const server = spawn(process.execPath, ['scripts/serve-pwa.mjs'], {
  env: {...process.env, PORT: port}, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
});
let browser;
try {
  await new Promise((resolve, reject) => {
    server.stdout.on('data', data => {if (data.toString().includes('HIPOS:')) resolve();});
    server.stderr.on('data', data => process.stderr.write(data));
    server.once('exit', code => reject(Error(`Server exited: ${code}`)));
  });
  browser = await chromium.launch({channel: process.env.PW_CHANNEL || undefined});
  for (const width of [390, 1280]) for (const colorScheme of ['light', 'dark']) for (const language of ['en', 'fil']) {
    const context = await browser.newContext({viewport: {width, height: 900}, colorScheme, reducedMotion: 'reduce'});
    await context.addInitScript(lang => localStorage.setItem('hipos.language', lang), language);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/`);
    await expect(page.locator('#today-heading')).toHaveText(language === 'en' ? 'Today' : 'Ngayon');
    assert.ok(await page.evaluate(() => document.querySelector('.waste-checker').compareDocumentPosition(document.querySelector('.home-today')) & Node.DOCUMENT_POSITION_FOLLOWING));
    await page.locator('[data-waste="5"]').click();
    await expect(page.locator('#waste-result')).toContainText(language === 'en' ? 'Do not touch' : 'Huwag');
    await page.screenshot({path: `test-results/ux-home-${width}-${colorScheme}-${language}.png`, fullPage: true});
    await page.evaluate(() => {location.hash = 'classify';});
    const input = page.locator('#guide-search');
    await input.fill('bote');
    await expect(page.locator('.visual-waste-card:visible')).not.toHaveCount(0);
    await page.locator('[data-guide-filter="no"]').click();
    await input.fill('zzzz-no-match');
    await expect(page.locator('#guide-empty')).toBeVisible();
    await page.locator('[data-guide-reset]').click();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect(page.locator('[data-guide-filter="all"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.visual-waste-card:visible')).toHaveCount(16);
    await page.locator('[data-guide-filter="no"]').click();
    await input.fill('battery');
    await page.locator('[data-guide-clear]').click();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect(page.locator('[data-guide-filter="no"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.visual-waste-card[data-kind="ok"]:visible')).toHaveCount(0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
    await page.screenshot({path: `test-results/ux-classify-${width}-${colorScheme}-${language}.png`, fullPage: true});
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS guidance UX: ${width}px, ${colorScheme}, ${language}`);
  }
} finally {
  await browser?.close();
  server.kill();
}
