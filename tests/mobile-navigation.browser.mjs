import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
const server = spawn(process.execPath, ['scripts/serve-pwa.mjs'], { windowsHide: true, stdio: 'pipe', env: { ...process.env, PORT: '4178' } });
let browser;
try {
  await new Promise((resolve, reject) => { server.stdout.on('data', d => { if (d.toString().includes('http://localhost')) resolve(); }); server.once('exit', reject); setTimeout(() => reject(Error('Server timed out')), 20000).unref(); });
  browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true });
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:4178');
  await mkdir('test-results', { recursive: true });
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    for (const width of [320, 390, 760, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      const nav = page.locator('.mobile-bottom-nav');
      if (width > 760) { await expect(nav).toBeHidden(); await expect(page.locator('#nav')).toBeVisible(); continue; }
      await expect(nav).toBeVisible(); await expect(page.locator('#menu-toggle')).toBeHidden();
      assert.equal(await nav.locator(':scope > a, :scope > .mobile-more').count(), 5);
      for (const box of await nav.locator(':scope > a, #mobile-more-toggle').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return { width: r.width, height: r.height }; }))) assert.ok(box.width >= 48 && box.height >= 48);
      await nav.locator('[href="#classify"]').click();
      await expect(nav.locator('[href="#classify"]')).toHaveAttribute('aria-current', 'page');
      const more = page.locator('#mobile-more-toggle'), panel = page.locator('#mobile-more-panel');
      await more.click(); await expect(panel).toBeVisible(); await page.keyboard.press('Escape'); await expect(panel).toBeHidden(); await expect(more).toBeFocused();
      await more.click(); await page.locator('h1').click(); await expect(panel).toBeHidden();
      await more.click(); await panel.locator('[href="#games"]').click(); await expect(panel).toBeHidden(); await expect(more).toHaveClass(/is-current/);
      await page.evaluate(() => location.hash = 'compost'); await expect(more).toHaveClass(/is-current/);
      await more.click(); await panel.locator('[href="#carry"]').click(); await expect(more).toHaveClass(/is-current/);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `test-results/mobile-nav-${theme}-${width}.png` });
    }
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await page.locator('.settings-toggle:visible').click(); await page.selectOption('#language', 'fil'); await page.locator('.settings-close').click();
  await expect(page.locator('#mobile-more-toggle')).toContainText('Iba pa');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log('Mobile navigation passed: both themes, 320/390/760/1280px, routing, popup dismissal, focus, targets, Filipino labels.');
} finally { await browser?.close(); server.kill(); }
